import { existsSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initDefaultContext, scopedNodeIO, type ScopedNodeIO } from '@flyingrobots/bijou-node';
import {
  boxSurface,
  stringToSurface,
  type BijouContext,
  type IOPort,
  type Surface,
} from '@flyingrobots/bijou';
import {
  filePickerKeyMap,
  filePickerSurface,
  fpFocusNext,
  fpFocusPrev,
  hstackSurface,
  isKeyMsg,
  isResizeMsg,
  placeSurface,
  quit,
  rasterToGlyphSurface,
  run,
  vstackSurface,
  type App,
  type Cmd,
  type FileEntry,
  type FilePickerState,
  type KeyMsg,
} from '@flyingrobots/bijou-tui';
import { rasterizeSvgToRgba } from '../docs/svg-raster.js';
import { decodeImageRgba, type DecodedImageFormat } from './image-codecs.js';

export type ImageRenderMode = 'braille' | 'ascii';

export interface ImageViewerModel {
  readonly columns: number;
  readonly rows: number;
  readonly picker: FilePickerState;
  readonly selectedPath: string | undefined;
  readonly mode: ImageRenderMode;
  readonly lastError: string | undefined;
}

export interface ImageViewerOptions {
  readonly root?: string;
  readonly initialPath?: string;
  readonly columns?: number;
  readonly rows?: number;
}

type ImageViewerMsg =
  | { readonly type: 'focus-next' }
  | { readonly type: 'focus-prev' }
  | { readonly type: 'enter' }
  | { readonly type: 'back' }
  | { readonly type: 'refresh' }
  | { readonly type: 'toggle-mode' }
  | { readonly type: 'quit' };

interface StartupPaths {
  readonly root: string;
  readonly cwd: string;
  readonly selectedPath: string | undefined;
}

interface LoadedImage {
  readonly format: DecodedImageFormat | 'svg';
  readonly width: number;
  readonly height: number;
  readonly surface: Surface;
}

const DEFAULT_ASSET_ROOT = fileURLToPath(new URL('../../assets', import.meta.url));
const SUPPORTED_IMAGE_EXTENSIONS = new Set(['.png', '.svg', '.ppm', '.pnm']);
const pickerKeys = filePickerKeyMap<ImageViewerMsg>({
  focusNext: { type: 'focus-next' },
  focusPrev: { type: 'focus-prev' },
  enter: { type: 'enter' },
  back: { type: 'back' },
  quit: { type: 'quit' },
});

export function createImageViewerApp(
  ctx: BijouContext = initDefaultContext(),
  options: ImageViewerOptions = {},
): App<ImageViewerModel, ImageViewerMsg> {
  const startup = resolveStartupPaths(options);
  const io = scopedNodeIO({ root: startup.root });

  return {
    init: () => {
      const columns = Math.max(1, options.columns ?? ctx.runtime.columns);
      const rows = Math.max(1, options.rows ?? ctx.runtime.rows);
      const picker = createImagePickerState(startup.cwd, io, pickerHeight(rows));
      const selectedPath = startup.selectedPath ?? firstImagePath(picker, io);
      return [{
        columns,
        rows,
        picker: focusSelectedEntry(picker, selectedPath, io),
        selectedPath,
        mode: 'braille',
        lastError: undefined,
      }, []];
    },

    update: (msg, model) => {
      if (isResizeMsg(msg)) {
        return [{
          ...model,
          columns: Math.max(1, msg.columns),
          rows: Math.max(1, msg.rows),
          picker: resizePicker(model.picker, pickerHeight(msg.rows)),
        }, []];
      }

      if (isKeyMsg(msg)) {
        return updateKey(msg, model, io);
      }

      switch (msg.type) {
        case 'focus-next':
          return [{ ...model, picker: fpFocusNext(model.picker), lastError: undefined }, []];
        case 'focus-prev':
          return [{ ...model, picker: fpFocusPrev(model.picker), lastError: undefined }, []];
        case 'enter':
          return [enterFocusedEntry(model, io), []];
        case 'back':
          return [enterParentDirectory(model, io), []];
        case 'refresh':
          return [refreshModel(model, io), []];
        case 'toggle-mode':
          return [{ ...model, mode: nextMode(model.mode), lastError: undefined }, []];
        case 'quit':
          return [model, [quit()]];
      }

      return [model, []];
    },

    view: (model) => renderImageViewer(model, ctx, io),
  };
}

export async function main(ctx: BijouContext = initDefaultContext()): Promise<void> {
  await run(createImageViewerApp(ctx, { initialPath: process.argv[2] }), { ctx });
}

if (process.argv[1] != null && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch(console.error);
}

function updateKey(
  msg: KeyMsg,
  model: ImageViewerModel,
  io: ScopedNodeIO,
): [ImageViewerModel, Cmd<ImageViewerMsg>[]] | [ImageViewerModel, []] {
  if (msg.key === 'm' || msg.key === 'tab') {
    return [{ ...model, mode: nextMode(model.mode), lastError: undefined }, []];
  }
  if (msg.key === 'r') {
    return [refreshModel(model, io), []];
  }

  const pickerMsg = pickerKeys.handle(msg);
  if (pickerMsg !== undefined) {
    return createImageViewerAppUpdate(pickerMsg, model, io);
  }

  return [model, []];
}

function createImageViewerAppUpdate(
  msg: ImageViewerMsg,
  model: ImageViewerModel,
  io: ScopedNodeIO,
): [ImageViewerModel, Cmd<ImageViewerMsg>[]] | [ImageViewerModel, []] {
  switch (msg.type) {
    case 'focus-next':
      return [{ ...model, picker: fpFocusNext(model.picker), lastError: undefined }, []];
    case 'focus-prev':
      return [{ ...model, picker: fpFocusPrev(model.picker), lastError: undefined }, []];
    case 'enter':
      return [enterFocusedEntry(model, io), []];
    case 'back':
      return [enterParentDirectory(model, io), []];
    case 'refresh':
      return [refreshModel(model, io), []];
    case 'toggle-mode':
      return [{ ...model, mode: nextMode(model.mode), lastError: undefined }, []];
    case 'quit':
      return [model, [quit()]];
  }
}

function resolveStartupPaths(options: ImageViewerOptions): StartupPaths {
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

  const stats = statSync(absolute);
  if (stats.isDirectory()) {
    return {
      root: absolute,
      cwd: absolute,
      selectedPath: undefined,
    };
  }

  const root = dirname(absolute);
  return {
    root,
    cwd: root,
    selectedPath: isSupportedImagePath(absolute) ? absolute : undefined,
  };
}

function createImagePickerState(cwd: string, io: IOPort, height: number): FilePickerState {
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
      continue;
    }
    if (isSupportedImagePath(name)) {
      files.push({ name, isDirectory: false });
    }
  }

  directories.sort(compareEntries);
  files.sort(compareEntries);
  return [...directories, ...files];
}

function compareEntries(a: FileEntry, b: FileEntry): number {
  return a.name.localeCompare(b.name);
}

function resizePicker(state: FilePickerState, height: number): FilePickerState {
  const nextHeight = Math.max(1, height);
  const scrollY = Math.min(state.scrollY, Math.max(0, state.entries.length - nextHeight));
  return { ...state, height: nextHeight, scrollY };
}

function refreshModel(model: ImageViewerModel, io: ScopedNodeIO): ImageViewerModel {
  const picker = createImagePickerState(model.picker.cwd, io, model.picker.height);
  const selectedPath = model.selectedPath ?? firstImagePath(picker, io);
  return {
    ...model,
    picker: focusSelectedEntry(picker, selectedPath, io),
    selectedPath,
    lastError: undefined,
  };
}

function enterFocusedEntry(model: ImageViewerModel, io: ScopedNodeIO): ImageViewerModel {
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
    lastError: undefined,
  };
}

function enterParentDirectory(model: ImageViewerModel, io: ScopedNodeIO): ImageViewerModel {
  const parent = safeJoinPath(io, model.picker.cwd, '..');
  if (parent === undefined || parent === model.picker.cwd) return model;
  return {
    ...model,
    picker: createImagePickerState(parent, io, model.picker.height),
    lastError: undefined,
  };
}

function firstImagePath(state: FilePickerState, io: IOPort): string | undefined {
  const entry = state.entries.find((candidate) => !candidate.isDirectory);
  return entry === undefined ? undefined : safeJoinPath(io, state.cwd, entry.name);
}

function focusSelectedEntry(
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

function selectedEntryIndex(
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

function scrollForFocus(focusIndex: number, height: number, totalItems: number): number {
  if (focusIndex < height) return 0;
  return Math.min(focusIndex - height + 1, Math.max(0, totalItems - height));
}

function safeResolvePath(io: ScopedNodeIO, path: string | undefined): string | undefined {
  if (path === undefined) return undefined;
  try {
    return io.resolvePath(path);
  } catch {
    return undefined;
  }
}

function safeJoinPath(io: IOPort, ...parts: string[]): string | undefined {
  try {
    return io.joinPath(...parts);
  } catch {
    return undefined;
  }
}

function renderImageViewer(
  model: ImageViewerModel,
  ctx: BijouContext,
  io: ScopedNodeIO,
): Surface {
  const width = Math.max(1, model.columns);
  const height = Math.max(1, model.rows);
  const sidebarWidth = Math.max(24, Math.min(38, Math.floor(width * 0.32)));
  const gap = width > 60 ? 1 : 0;
  const mainWidth = Math.max(1, width - sidebarWidth - gap);

  return placeSurface(
    hstackSurface(
      gap,
      renderSidebar(model, sidebarWidth, height, ctx, io),
      renderPreview(model, mainWidth, height, ctx, io),
    ),
    { width, height },
  );
}

function renderSidebar(
  model: ImageViewerModel,
  width: number,
  height: number,
  ctx: BijouContext,
  io: ScopedNodeIO,
): Surface {
  const picker = resizePicker(model.picker, Math.max(1, height - 5));
  const pickerSurface = filePickerSurface(picker, {
    width: Math.max(1, width - 2),
    showScrollbar: true,
    focusIndicator: '>',
    selectedIndex: selectedEntryIndex(picker, model.selectedPath, io),
    dirIndicator: 'd',
    fileIndicator: '-',
  });
  return placeSurface(
    boxSurface(pickerSurface, { title: 'Images', width, ctx }),
    { width, height },
  );
}

function renderPreview(
  model: ImageViewerModel,
  width: number,
  height: number,
  ctx: BijouContext,
  io: ScopedNodeIO,
): Surface {
  const footer = `q quit  Enter open/select  <- parent  m mode:${model.mode}  r refresh`;
  const previewHeight = Math.max(1, height - 5);
  const previewWidth = Math.max(1, width - 2);
  let title = 'Preview';
  let body: Surface;
  let status = 'No image selected.';

  if (model.selectedPath === undefined) {
    body = stringToSurface('No supported image selected.', previewWidth, previewHeight);
  } else {
    title = basename(model.selectedPath);
    const loaded = loadImagePreview(model.selectedPath, previewWidth, previewHeight, model.mode, io);
    if (loaded instanceof Error) {
      status = loaded.message;
      body = stringToSurface(status, previewWidth, previewHeight);
    } else {
      status = `Mode: ${model.mode}  Format: ${loaded.format.toUpperCase()}  Source: ${loaded.width}x${loaded.height}`;
      body = loaded.surface;
    }
  }

  if (model.lastError !== undefined) {
    status = model.lastError;
  }

  return placeSurface(
    vstackSurface(
      boxSurface(placeSurface(body, {
        width: previewWidth,
        height: previewHeight,
        hAlign: 'center',
        vAlign: 'middle',
      }), { title, width, ctx }),
      stringToSurface(status, width, 1),
      stringToSurface(footer, width, 1),
    ),
    { width, height },
  );
}

function loadImagePreview(
  selectedPath: string,
  columns: number,
  rows: number,
  mode: ImageRenderMode,
  io: ScopedNodeIO,
): LoadedImage | Error {
  try {
    const resolvedPath = io.resolvePath(selectedPath);
    const ext = extname(resolvedPath).toLowerCase();
    const decoded = ext === '.svg'
      ? {
          format: 'svg' as const,
          frame: rasterizeSvgToRgba(readFileSync(resolvedPath, 'utf8'), {
            width: Math.max(1, columns * 2),
            height: Math.max(1, rows * 4),
          }),
        }
      : decodeImageRgba(readFileSync(resolvedPath), resolvedPath);

    return {
      format: decoded.format,
      width: decoded.frame.width,
      height: decoded.frame.height,
      surface: rasterToGlyphSurface(decoded.frame, {
        columns,
        rows,
        fit: 'contain',
        cellAspectRatio: 0.5,
        colorMode: 'none',
        renderer: mode === 'braille'
          ? { kind: 'braille', threshold: 0.45 }
          : { kind: 'charset', chars: ' .:-=+*#%@', order: 'light-to-dark' },
      }),
    };
  } catch (error) {
    return error instanceof Error ? error : new Error(String(error));
  }
}

function nextMode(mode: ImageRenderMode): ImageRenderMode {
  return mode === 'braille' ? 'ascii' : 'braille';
}

function pickerHeight(rows: number): number {
  return Math.max(1, rows - 5);
}

function isSupportedImagePath(path: string): boolean {
  return SUPPORTED_IMAGE_EXTENSIONS.has(extname(path).toLowerCase());
}
