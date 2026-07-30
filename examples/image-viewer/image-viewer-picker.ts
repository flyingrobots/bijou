import type { ScopedNodeIO } from '@flyingrobots/bijou-node';
import type { FilePickerState } from '@flyingrobots/bijou-tui';
import type { ImageViewerModel } from './image-viewer-contract.js';
import {
  createImagePickerState,
  safeJoinPath,
  safeResolvePath,
} from './image-viewer-files.js';
import { DEFAULT_IMAGE_VIEWPORT } from './image-viewer-options.js';

export function refreshModel(
  model: ImageViewerModel,
  io: ScopedNodeIO,
): ImageViewerModel {
  const picker = createImagePickerState(
    model.picker.cwd,
    io,
    model.picker.height,
  );
  const selectedPath = model.selectedPath ?? firstImagePath(picker, io);
  return {
    ...model,
    picker: focusSelectedEntry(picker, selectedPath, io),
    selectedPath,
    lastError: undefined,
  };
}

export function enterFocusedEntry(
  model: ImageViewerModel,
  io: ScopedNodeIO,
): ImageViewerModel {
  const entry = model.picker.entries[model.picker.focusIndex];
  if (entry === undefined) return model;
  const nextPath = safeJoinPath(io, model.picker.cwd, entry.name);
  if (nextPath === undefined) {
    return { ...model, lastError: 'Unable to open selected entry.' };
  }
  if (entry.isDirectory) {
    return {
      ...model,
      picker: createImagePickerState(nextPath, io, model.picker.height),
      lastError: undefined,
    };
  }
  return {
    ...model,
    selectedPath: nextPath,
    viewport: DEFAULT_IMAGE_VIEWPORT,
    lastError: undefined,
  };
}

export function enterParentDirectory(
  model: ImageViewerModel,
  io: ScopedNodeIO,
): ImageViewerModel {
  const parent = safeJoinPath(io, model.picker.cwd, '..');
  if (parent === undefined || parent === model.picker.cwd) return model;
  return {
    ...model,
    picker: createImagePickerState(parent, io, model.picker.height),
    lastError: undefined,
  };
}

export function firstImagePath(
  state: FilePickerState,
  io: ScopedNodeIO,
): string | undefined {
  const entry = state.entries.find((candidate) => !candidate.isDirectory);
  return entry === undefined
    ? undefined
    : safeJoinPath(io, state.cwd, entry.name);
}

export function focusSelectedEntry(
  state: FilePickerState,
  selectedPath: string | undefined,
  io: ScopedNodeIO,
): FilePickerState {
  const selectedIndex = selectedEntryIndex(state, selectedPath, io);
  if (selectedIndex === undefined) return state;
  return {
    ...state,
    focusIndex: selectedIndex,
    scrollY: scrollForFocus(selectedIndex, state.height, state.entries.length),
  };
}

export function selectedEntryIndex(
  state: FilePickerState,
  selectedPath: string | undefined,
  io: ScopedNodeIO,
): number | undefined {
  const resolvedSelectedPath = safeResolvePath(io, selectedPath);
  if (resolvedSelectedPath === undefined) return undefined;
  const index = state.entries.findIndex((entry) => {
    if (entry.isDirectory) return false;
    const entryPath = safeJoinPath(io, state.cwd, entry.name);
    return safeResolvePath(io, entryPath) === resolvedSelectedPath;
  });
  return index >= 0 ? index : undefined;
}

function scrollForFocus(
  focusIndex: number,
  height: number,
  totalItems: number,
): number {
  if (focusIndex < height) return 0;
  return Math.min(focusIndex - height + 1, Math.max(0, totalItems - height));
}
