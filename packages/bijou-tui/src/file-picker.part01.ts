import { sanitizePositiveInt } from '@flyingrobots/bijou';

import type { IOPort } from '@flyingrobots/bijou';

import { adjustScroll } from './file-picker.part02.js';
export interface FileEntry {
  /** Name of the file or directory (without trailing `/`). */
  name: string;
  /** Whether this entry is a directory. */
  isDirectory: boolean;
}
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
export interface FilePickerRenderOptions {
  /** Character(s) shown next to the focused entry (default: `"\u25b8"`). */
  readonly focusIndicator?: string;
  /** Index of the entry that is selected by the hosting application. */
  readonly selectedIndex?: number;
  /** Character(s) shown next to the selected entry when `selectedIndex` is set (default: `"*"`). */
  readonly selectedIndicator?: string;
  /** Character(s) shown before directory names (default: `"d"`). */
  readonly dirIndicator?: string;
  /** Character(s) shown before file names (default: `"-"`). */
  readonly fileIndicator?: string;
}
export interface FilePickerSurfaceOptions extends FilePickerRenderOptions {
  /** Fixed viewport width. Defaults to the widest rendered row or cwd header. */
  readonly width?: number;
  /** Show a scrollbar track on the right edge. Default: false. */
  readonly showScrollbar?: boolean;
}
export function safeReadEntries(io: IOPort, cwd: string, filter?: string): FileEntry[] {
  try {
    return parseEntries(io.readDir(cwd), filter);
  } catch {
    return [];
  }
}
export function parseEntries(names: string[], filter?: string): FileEntry[] {
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
export function createFilePickerState(options: FilePickerOptions): FilePickerState {
  const height = sanitizePositiveInt(options.height, 10);
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
export function fpFocusNext(state: FilePickerState): FilePickerState {
  if (state.entries.length === 0) return state;
  const focusIndex = (state.focusIndex + 1) % state.entries.length;
  return { ...state, focusIndex, scrollY: adjustScroll(focusIndex, state.scrollY, state.height, state.entries.length) };
}
