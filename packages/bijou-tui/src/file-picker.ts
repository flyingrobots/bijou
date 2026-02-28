/**
 * File picker building block — a directory browser with focus navigation.
 *
 * Uses `IOPort.readDir()` to list directory contents and `IOPort.joinPath()`
 * to navigate between directories. Follows the same state + pure transformers
 * + sync render + convenience keymap pattern as pager and accordion.
 *
 * ```ts
 * // In TEA init:
 * const fpState = createFilePickerState({ cwd: '/project', io });
 *
 * // In TEA view:
 * const output = filePicker(model.fpState);
 *
 * // In TEA update:
 * case 'focus-next':
 *   return [{ ...model, fpState: fpFocusNext(model.fpState) }, []];
 * case 'enter':
 *   return [{ ...model, fpState: fpEnter(model.fpState, io) }, []];
 * ```
 */

import type { IOPort } from '@flyingrobots/bijou';
import { createKeyMap, type KeyMap } from './keybindings.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single entry (file or directory) in the file picker listing. */
export interface FileEntry {
  /** Name of the file or directory (without trailing `/`). */
  name: string;
  /** Whether this entry is a directory. */
  isDirectory: boolean;
}

/** Immutable state for the file picker widget. */
export interface FilePickerState {
  /** Current working directory being browsed. */
  readonly cwd: string;
  /** Sorted entries in the current directory. */
  readonly entries: readonly FileEntry[];
  /** Index of the currently focused entry. */
  readonly focusIndex: number;
  /** Vertical scroll offset (first visible entry index). */
  readonly scrollY: number;
  /** Maximum number of visible entries. */
  readonly height: number;
  /** Optional file extension filter (e.g. `".ts"`). */
  readonly filter?: string;
}

/** Options for creating a new file picker state. */
export interface FilePickerOptions {
  /** Starting directory path. */
  readonly cwd: string;
  /** IO port used for directory listing and path joining. */
  readonly io: IOPort;
  /** Maximum number of visible entries (default: 10). */
  readonly height?: number;
  /** Optional file extension filter (e.g. `".ts"`). */
  readonly filter?: string;
}

/** Options for rendering the file picker view. */
export interface FilePickerRenderOptions {
  /** Character(s) shown next to the focused entry (default: `"\u25b8"`). */
  readonly focusIndicator?: string;
  /** Character(s) shown before directory names (default: `"d"`). */
  readonly dirIndicator?: string;
  /** Character(s) shown before file names (default: `"-"`). */
  readonly fileIndicator?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Safely read and parse directory entries. Returns `[]` if the directory
 * is unreadable (permissions, missing, etc.) instead of throwing.
 *
 * @param io - IO port for filesystem access.
 * @param cwd - Directory path to read.
 * @param filter - Optional file extension filter.
 * @returns Sorted array of file entries, or empty array on error.
 */
function safeReadEntries(io: IOPort, cwd: string, filter?: string): FileEntry[] {
  try {
    return parseEntries(io.readDir(cwd), filter);
  } catch {
    return [];
  }
}

/**
 * Parse raw directory listing into sorted `FileEntry[]`.
 *
 * @param names  - Names returned by `IOPort.readDir()` (dirs have trailing `/`).
 * @param filter - Optional extension suffix (e.g. `".ts"`) — only files whose
 *                 name ends with this suffix are included. Directories are
 *                 always included regardless of the filter.
 * @returns Sorted array of file entries (directories first, then files).
 */
function parseEntries(names: string[], filter?: string): FileEntry[] {
  const dirs: FileEntry[] = [];
  const files: FileEntry[] = [];

  for (const name of names) {
    if (name.endsWith('/')) {
      dirs.push({ name: name.slice(0, -1), isDirectory: true });
    } else {
      if (filter && !name.endsWith(filter)) continue;
      files.push({ name, isDirectory: false });
    }
  }

  // Sort dirs first, then files, both alphabetically
  dirs.sort((a, b) => a.name.localeCompare(b.name));
  files.sort((a, b) => a.name.localeCompare(b.name));

  return [...dirs, ...files];
}

// ---------------------------------------------------------------------------
// State creation
// ---------------------------------------------------------------------------

/**
 * Create initial file picker state for the given directory.
 *
 * Reads directory contents via `io.readDir()` and parses entries into
 * directories (trailing `/`) and files. Directories are sorted first,
 * then files, both alphabetically.
 *
 * @param options - Starting directory, IO port, height, and optional filter.
 * @returns Fresh file picker state with focus on the first entry.
 */
export function createFilePickerState(options: FilePickerOptions): FilePickerState {
  const height = Math.max(1, options.height ?? 10);
  const entries = safeReadEntries(options.io, options.cwd, options.filter);

  return {
    cwd: options.cwd,
    entries,
    focusIndex: 0,
    scrollY: 0,
    height,
    filter: options.filter,
  };
}

// ---------------------------------------------------------------------------
// State transformers
// ---------------------------------------------------------------------------

/**
 * Move focus to the next entry (wraps around).
 *
 * @param state - Current file picker state.
 * @returns Updated state with focus on the next entry.
 */
export function fpFocusNext(state: FilePickerState): FilePickerState {
  if (state.entries.length === 0) return state;
  const focusIndex = (state.focusIndex + 1) % state.entries.length;
  return { ...state, focusIndex, scrollY: adjustScroll(focusIndex, state.scrollY, state.height, state.entries.length) };
}

/**
 * Move focus to the previous entry (wraps around).
 *
 * @param state - Current file picker state.
 * @returns Updated state with focus on the previous entry.
 */
export function fpFocusPrev(state: FilePickerState): FilePickerState {
  if (state.entries.length === 0) return state;
  const focusIndex = (state.focusIndex - 1 + state.entries.length) % state.entries.length;
  return { ...state, focusIndex, scrollY: adjustScroll(focusIndex, state.scrollY, state.height, state.entries.length) };
}

/**
 * Enter the focused directory, refreshing the entry list. No-op on files.
 *
 * @param state - Current file picker state.
 * @param io - IO port for filesystem access.
 * @returns Updated state browsing the focused directory, or unchanged if focused on a file.
 */
export function fpEnter(state: FilePickerState, io: IOPort): FilePickerState {
  if (state.entries.length === 0) return state;
  const entry = state.entries[state.focusIndex];
  if (!entry || !entry.isDirectory) return state;

  const newCwd = io.joinPath(state.cwd, entry.name);
  const entries = safeReadEntries(io, newCwd, state.filter);

  return {
    ...state,
    cwd: newCwd,
    entries,
    focusIndex: 0,
    scrollY: 0,
  };
}

/**
 * Navigate to the parent directory. No-op at filesystem root.
 *
 * @param state - Current file picker state.
 * @param io - IO port for filesystem access.
 * @returns Updated state browsing the parent directory, or unchanged at root.
 */
export function fpBack(state: FilePickerState, io: IOPort): FilePickerState {
  const newCwd = io.joinPath(state.cwd, '..');
  if (newCwd === state.cwd) return state;

  const entries = safeReadEntries(io, newCwd, state.filter);

  return {
    ...state,
    cwd: newCwd,
    entries,
    focusIndex: 0,
    scrollY: 0,
  };
}

// ---------------------------------------------------------------------------
// Scroll helper
// ---------------------------------------------------------------------------

/**
 * Clamp scroll position so the focused entry stays within the visible window.
 *
 * @param focusIndex - Index of the focused entry.
 * @param scrollY - Current scroll offset.
 * @param height - Viewport height in entries.
 * @param totalItems - Total number of entries.
 * @returns Adjusted scroll offset.
 */
function adjustScroll(focusIndex: number, scrollY: number, height: number, totalItems: number): number {
  let newScrollY = scrollY;
  if (focusIndex < newScrollY) {
    newScrollY = focusIndex;
  } else if (focusIndex >= newScrollY + height) {
    newScrollY = focusIndex - height + 1;
  }
  const maxScroll = Math.max(0, totalItems - height);
  return Math.min(newScrollY, maxScroll);
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

/**
 * Render the file picker — cwd header followed by the visible entry list.
 *
 * Each entry is prefixed with a focus indicator and a type indicator
 * (directory or file). Directories are suffixed with `/`.
 *
 * @param state - Current file picker state.
 * @param options - Rendering options (focus, dir, and file indicators).
 * @returns Rendered file picker string with cwd header and entry list.
 */
export function filePicker(state: FilePickerState, options?: FilePickerRenderOptions): string {
  const indicator = options?.focusIndicator ?? '\u25b8';
  const dirIcon = options?.dirIndicator ?? 'd';
  const fileIcon = options?.fileIndicator ?? '-';
  const pad = ' '.repeat(indicator.length);

  const lines: string[] = [];
  lines.push(state.cwd);

  if (state.entries.length === 0) {
    lines.push('  (empty)');
    return lines.join('\n');
  }

  const visibleEntries = state.entries.slice(state.scrollY, state.scrollY + state.height);

  for (let i = 0; i < visibleEntries.length; i++) {
    const entry = visibleEntries[i]!;
    const globalIndex = state.scrollY + i;
    const prefix = globalIndex === state.focusIndex ? indicator : pad;
    const icon = entry.isDirectory ? dirIcon : fileIcon;
    const suffix = entry.isDirectory ? '/' : '';
    lines.push(`${prefix} ${icon} ${entry.name}${suffix}`);
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Convenience keymap
// ---------------------------------------------------------------------------

/**
 * Create a preconfigured KeyMap for file picker navigation.
 *
 * The caller provides their own message types for each action:
 * ```ts
 * const keys = filePickerKeyMap({
 *   focusNext: { type: 'next' },
 *   focusPrev: { type: 'prev' },
 *   enter: { type: 'enter' },
 *   back: { type: 'back' },
 *   quit: { type: 'quit' },
 * });
 * ```
 *
 * @template Msg - Application message type dispatched by key bindings.
 * @param actions - Map of navigation and action messages.
 * @returns Preconfigured key map with vim-style file picker bindings.
 */
export function filePickerKeyMap<Msg>(actions: {
  focusNext: Msg;
  focusPrev: Msg;
  enter: Msg;
  back: Msg;
  quit: Msg;
}): KeyMap<Msg> {
  return createKeyMap<Msg>()
    .group('Navigation', (g) => g
      .bind('j', 'Next entry', actions.focusNext)
      .bind('down', 'Next entry', actions.focusNext)
      .bind('k', 'Previous entry', actions.focusPrev)
      .bind('up', 'Previous entry', actions.focusPrev),
    )
    .group('Actions', (g) => g
      .bind('enter', 'Enter directory / select file', actions.enter)
      .bind('backspace', 'Parent directory', actions.back)
      .bind('left', 'Parent directory', actions.back),
    )
    .bind('q', 'Quit', actions.quit)
    .bind('ctrl+c', 'Quit', actions.quit);
}
