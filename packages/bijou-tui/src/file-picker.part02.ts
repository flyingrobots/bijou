import type { IOPort } from '@flyingrobots/bijou';

import { safeReadEntries } from './file-picker.part01.js';

import type { FilePickerRenderOptions, FilePickerState } from './file-picker.part01.js';
export function fpFocusPrev(state: FilePickerState): FilePickerState {
  if (state.entries.length === 0) return state;
  const focusIndex = (state.focusIndex - 1 + state.entries.length) % state.entries.length;
  return { ...state, focusIndex, scrollY: adjustScroll(focusIndex, state.scrollY, state.height, state.entries.length) };
}
export function fpEnter(state: FilePickerState, io: IOPort): FilePickerState {
  if (state.entries.length === 0) return state;
  const entry = state.entries[state.focusIndex];
  if (!entry?.isDirectory) return state;

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
export function adjustScroll(focusIndex: number, scrollY: number, height: number, totalItems: number): number {
  let newScrollY = scrollY;
  if (focusIndex < newScrollY) {
    newScrollY = focusIndex;
  } else if (focusIndex >= newScrollY + height) {
    newScrollY = focusIndex - height + 1;
  }
  const maxScroll = Math.max(0, totalItems - height);
  return Math.min(newScrollY, maxScroll);
}
export function renderFilePickerEntryLines(
  state: FilePickerState,
  options?: FilePickerRenderOptions,
): string[] {
  const indicator = options?.focusIndicator ?? '\u25b8';
  const selectedIndicator = options?.selectedIndicator ?? '*';
  const hasSelection = options?.selectedIndex !== undefined
    && options.selectedIndex >= 0
    && options.selectedIndex < state.entries.length;
  const dirIcon = options?.dirIndicator ?? 'd';
  const fileIcon = options?.fileIndicator ?? '-';
  const pad = ' '.repeat(indicator.length);
  const selectedPad = ' '.repeat(selectedIndicator.length);

  if (state.entries.length === 0) return ['  (empty)'];

  return state.entries.map((entry, index) => {
    const prefix = index === state.focusIndex ? indicator : pad;
    const selected = hasSelection && index === options.selectedIndex ? selectedIndicator : selectedPad;
    const icon = entry.isDirectory ? dirIcon : fileIcon;
    const suffix = entry.isDirectory ? '/' : '';
    return hasSelection
      ? `${prefix} ${selected} ${icon} ${entry.name}${suffix}`
      : `${prefix} ${icon} ${entry.name}${suffix}`;
  });
}
export function filePicker(state: FilePickerState, options?: FilePickerRenderOptions): string {
  const entryLines = renderFilePickerEntryLines(state, options);
  return [
    state.cwd,
    ...entryLines.slice(state.scrollY, state.scrollY + state.height),
  ].join('\n');
}
