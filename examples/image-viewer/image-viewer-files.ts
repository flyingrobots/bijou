import { existsSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { IOPort } from '@flyingrobots/bijou';
import type { ScopedNodeIO } from '@flyingrobots/bijou-node';
import type { FileEntry, FilePickerState } from '@flyingrobots/bijou-tui';
import type {
  ImageViewerOptions,
  StartupPaths,
} from './image-viewer-contract.js';
import {
  DEFAULT_ASSET_ROOT,
  isSupportedImagePath,
} from './image-viewer-options.js';

export function resolveStartupPaths(options: ImageViewerOptions): StartupPaths {
  const requested = options.initialPath ?? options.root;
  if (requested === undefined) {
    return {
      root: DEFAULT_ASSET_ROOT,
      cwd: DEFAULT_ASSET_ROOT,
      selectedPath: undefined,
    };
  }
  const absolute = resolve(requested);
  if (!existsSync(absolute)) {
    return {
      root: DEFAULT_ASSET_ROOT,
      cwd: DEFAULT_ASSET_ROOT,
      selectedPath: undefined,
    };
  }
  if (statSync(absolute).isDirectory()) {
    return { root: absolute, cwd: absolute, selectedPath: undefined };
  }
  const root = dirname(absolute);
  return {
    root,
    cwd: root,
    selectedPath: isSupportedImagePath(absolute) ? absolute : undefined,
  };
}

export function createImagePickerState(
  cwd: string,
  io: IOPort,
  height: number,
): FilePickerState {
  return {
    cwd,
    entries: readImageEntries(io, cwd),
    focusIndex: 0,
    scrollY: 0,
    height: Math.max(1, height),
  };
}

function readImageEntries(io: IOPort, cwd: string): readonly FileEntry[] {
  let names: string[];
  try {
    names = io.readDir(cwd);
  } catch {
    return [];
  }
  const directories: FileEntry[] = [];
  const files: FileEntry[] = [];
  for (const name of names) {
    if (name.endsWith('/')) {
      directories.push({ name: name.slice(0, -1), isDirectory: true });
    } else if (isSupportedImagePath(name)) {
      files.push({ name, isDirectory: false });
    }
  }
  directories.sort(compareEntries);
  files.sort(compareEntries);
  return [...directories, ...files];
}

function compareEntries(left: FileEntry, right: FileEntry): number {
  return left.name.localeCompare(right.name);
}

export function resizePicker(
  state: FilePickerState,
  height: number,
): FilePickerState {
  const nextHeight = Math.max(1, height);
  const scrollY = Math.min(
    state.scrollY,
    Math.max(0, state.entries.length - nextHeight),
  );
  return { ...state, height: nextHeight, scrollY };
}

export function safeResolvePath(
  io: ScopedNodeIO,
  path: string | undefined,
): string | undefined {
  if (path === undefined) return undefined;
  try {
    return io.resolvePath(path);
  } catch {
    return undefined;
  }
}

export function safeJoinPath(
  io: IOPort,
  ...parts: string[]
): string | undefined {
  try {
    return io.joinPath(...parts);
  } catch {
    return undefined;
  }
}
