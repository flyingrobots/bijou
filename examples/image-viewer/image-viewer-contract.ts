import type { BijouContext, Surface } from '@flyingrobots/bijou';
import type {
  App,
  Cmd,
  FilePickerState,
  KeyMsg,
  MouseMsg,
  RasterGlyphColorMode,
  RasterGlyphDitherMode,
  ResizeMsg,
} from '@flyingrobots/bijou-tui';
import type { DecodedImageFormat } from './image-codecs.js';

export type ImageRenderMode = 'braille' | 'ascii';

export interface ImageViewportModel {
  readonly zoomPercent: number;
  readonly panX: number;
  readonly panY: number;
}

export interface ImageTuningModel {
  readonly colorMode: RasterGlyphColorMode;
  readonly thresholdPercent: number;
  readonly contrastPercent: number;
  readonly dither: RasterGlyphDitherMode;
}

export interface ImageViewerModel {
  readonly columns: number;
  readonly rows: number;
  readonly picker: FilePickerState;
  readonly selectedPath: string | undefined;
  readonly mode: ImageRenderMode;
  readonly viewport: ImageViewportModel;
  readonly tuning: ImageTuningModel;
  readonly lastError: string | undefined;
}

export interface ImageViewerOptions {
  readonly root?: string;
  readonly initialPath?: string;
  readonly columns?: number;
  readonly rows?: number;
}

export interface ImageViewerAppMsg {
  readonly type:
    | 'focus-next'
    | 'focus-prev'
    | 'enter'
    | 'back'
    | 'refresh'
    | 'toggle-mode'
    | 'quit';
}

export interface ImageViewerApp extends Omit<
  App<ImageViewerModel, ImageViewerAppMsg>,
  'view'
> {
  view(model: ImageViewerModel): Surface;
}

export type ImageViewerMsg =
  | KeyMsg
  | ResizeMsg
  | MouseMsg
  | { readonly type: 'pulse'; readonly dt: number }
  | ImageViewerAppMsg;

export type ImageViewerUpdate = [ImageViewerModel, Cmd<ImageViewerAppMsg>[]];

export interface StartupPaths {
  readonly root: string;
  readonly cwd: string;
  readonly selectedPath: string | undefined;
}

export interface LoadedImage {
  readonly format: DecodedImageFormat | 'svg';
  readonly width: number;
  readonly height: number;
  readonly surface: Surface;
}

export type CreateImageViewer = (
  ctx?: BijouContext,
  options?: ImageViewerOptions,
) => ImageViewerApp;
