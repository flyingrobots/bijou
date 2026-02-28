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

export interface FileEntry {
  name: string;
  isDirectory: boolean;
}

export interface FilePickerState {
  readonly cwd: string;
  readonly entries: readonly FileEntry[];
  readonly focusIndex: number;
  readonly scrollY: number;
  readonly height: number;
  readonly filter?: string;
}

export interface FilePickerOptions {
  readonly cwd: string;
  readonly io: IOPort;
  readonly height?: number;
  readonly filter?: string;
}

export interface FilePickerRenderOptions {
  readonly focusIndicator?: string;
  readonly dirIndicator?: string;
  readonly fileIndicator?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse raw directory listing into sorted `FileEntry[]`.
 *
 * @param names  - Names returned by `IOPort.readDir()` (dirs have trailing `/`).
 * @param filter - Optional extension suffix (e.g. `".ts"`) — only files whose
 *                 name ends with this suffix are included. Directories are
 *                 always included regardless of the filter.
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
 */
export function createFilePickerState(options: FilePickerOptions): FilePickerState {
  const names = options.io.readDir(options.cwd);
  const entries = parseEntries(names, options.filter);

  return {
    cwd: options.cwd,
    entries,
    focusIndex: 0,
    scrollY: 0,
    height: options.height ?? 10,
    filter: options.filter,
  };
}

// ---------------------------------------------------------------------------
// State transformers
// ---------------------------------------------------------------------------

/** Move focus to the next entry (wraps around). */
export function fpFocusNext(state: FilePickerState): FilePickerState {
  if (state.entries.length === 0) return state;
  const focusIndex = (state.focusIndex + 1) % state.entries.length;
  return { ...state, focusIndex, scrollY: adjustScroll(focusIndex, state.scrollY, state.height, state.entries.length) };
}

/** Move focus to the previous entry (wraps around). */
export function fpFocusPrev(state: FilePickerState): FilePickerState {
  if (state.entries.length === 0) return state;
  const focusIndex = (state.focusIndex - 1 + state.entries.length) % state.entries.length;
  return { ...state, focusIndex, scrollY: adjustScroll(focusIndex, state.scrollY, state.height, state.entries.length) };
}

/** Enter the focused directory, refreshing the entry list. No-op on files. */
export function fpEnter(state: FilePickerState, io: IOPort): FilePickerState {
  if (state.entries.length === 0) return state;
  const entry = state.entries[state.focusIndex];
  if (!entry || !entry.isDirectory) return state;

  const newCwd = io.joinPath(state.cwd, entry.name);
  const names = io.readDir(newCwd);
  const entries = parseEntries(names, state.filter);

  return {
    ...state,
    cwd: newCwd,
    entries,
    focusIndex: 0,
    scrollY: 0,
  };
}

/** Navigate to the parent directory. No-op at filesystem root. */
export function fpBack(state: FilePickerState, io: IOPort): FilePickerState {
  const newCwd = io.joinPath(state.cwd, '..');
  if (newCwd === state.cwd) return state;

  const names = io.readDir(newCwd);
  const entries = parseEntries(names, state.filter);

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
