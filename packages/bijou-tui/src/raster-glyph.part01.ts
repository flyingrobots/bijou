export type RasterGlyphFit = 'stretch' | 'contain' | 'fit';
export type RasterGlyphColorMode = 'none' | 'fg' | 'fg-bg';
export type RasterGlyphDitherMode = 'none' | 'ordered';
export type RasterGlyphCharsetOrder = 'light-to-dark' | 'dark-to-light';
export interface RgbaFrame {
  readonly width: number;
  readonly height: number;
  readonly data: Uint8ClampedArray | readonly number[];
}
export interface RasterGlyphCharsetRenderer {
  readonly kind: 'charset';
  readonly chars?: string;
  readonly order?: RasterGlyphCharsetOrder;
}
export interface RasterGlyphBrailleRenderer {
  readonly kind: 'braille';
  readonly threshold?: number;
}
export interface RasterGlyphQuadRenderer {
  readonly kind: 'quad';
  readonly threshold?: number;
}
export type RasterGlyphRenderer =
  | RasterGlyphCharsetRenderer
  | RasterGlyphBrailleRenderer
  | RasterGlyphQuadRenderer;
export interface RasterToGlyphSurfaceOptions {
  readonly columns: number;
  readonly rows: number;
  readonly fit?: RasterGlyphFit;
  readonly cellAspectRatio?: number;
  readonly zoom?: number;
  readonly panX?: number;
  readonly panY?: number;
  readonly colorMode?: RasterGlyphColorMode;
  readonly contrast?: number;
  readonly dither?: RasterGlyphDitherMode;
  readonly renderer?: RasterGlyphRenderer;
}
export interface FitTransform {
  readonly scaleX: number;
  readonly scaleY: number;
  readonly offsetX: number;
  readonly offsetY: number;
  readonly drawWidth: number;
  readonly drawHeight: number;
}
export interface SourceRect {
  readonly x0: number;
  readonly y0: number;
  readonly x1: number;
  readonly y1: number;
}
export interface ColorAccumulator {
  r: number;
  g: number;
  b: number;
  count: number;
}
export interface RasterSample {
  readonly darkness: number;
  readonly color: readonly [number, number, number] | undefined;
}
export interface RasterGlyphAdjustments {
  readonly contrast: number;
  readonly dither: RasterGlyphDitherMode;
}
export const DEFAULT_RASTER_GLYPH_CHARSET = ' .:-=+*#%@';
export const DEFAULT_RENDERER: RasterGlyphCharsetRenderer = {
  kind: 'charset',
  chars: DEFAULT_RASTER_GLYPH_CHARSET,
  order: 'light-to-dark',
};
export const DEFAULT_THRESHOLD = 0.5;
export const DEFAULT_CELL_ASPECT_RATIO = 1;
export const DEFAULT_CONTRAST = 1;
export const MIN_CONTRAST = 0.1;
export const MAX_CONTRAST = 4;
export const ORDERED_DITHER_STRENGTH = 0.2;
export const BAYER_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
] as const;
export const BRAILLE_DOT_MAP = [
  [0x01, 0x08],
  [0x02, 0x10],
  [0x04, 0x20],
  [0x40, 0x80],
] as const;
