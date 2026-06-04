import { createSurface, type Cell, type Surface } from '@flyingrobots/bijou';

export type RasterGlyphFit = 'stretch' | 'contain' | 'fit';
export type RasterGlyphColorMode = 'none' | 'fg' | 'fg-bg';
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
  readonly colorMode?: RasterGlyphColorMode;
  readonly renderer?: RasterGlyphRenderer;
}

interface FitTransform {
  readonly scaleX: number;
  readonly scaleY: number;
  readonly offsetX: number;
  readonly offsetY: number;
  readonly drawWidth: number;
  readonly drawHeight: number;
}

interface SourceRect {
  readonly x0: number;
  readonly y0: number;
  readonly x1: number;
  readonly y1: number;
}

interface ColorAccumulator {
  r: number;
  g: number;
  b: number;
  count: number;
}

interface RasterSample {
  readonly darkness: number;
  readonly color: readonly [number, number, number] | undefined;
}

const DEFAULT_RASTER_GLYPH_CHARSET = ' .:-=+*#%@';

const DEFAULT_RENDERER: RasterGlyphCharsetRenderer = {
  kind: 'charset',
  chars: DEFAULT_RASTER_GLYPH_CHARSET,
  order: 'light-to-dark',
};

const DEFAULT_THRESHOLD = 0.5;
const DEFAULT_CELL_ASPECT_RATIO = 1;

const BRAILLE_DOT_MAP = [
  [0x01, 0x08],
  [0x02, 0x10],
  [0x04, 0x20],
  [0x40, 0x80],
] as const;

const QUAD_CHARS = [
  ' ', '▘', '▝', '▀',
  '▖', '▌', '▞', '▛',
  '▗', '▚', '▐', '▜',
  '▄', '▙', '▟', '█',
] as const;

export const RASTER_GLYPH_CHARSETS = {
  ascii: ' .:-=+*#%@',
  blocks: ' ░▒▓█',
  launch: '/\\MXYZabc!?=-. ',
} as const;

export function validateRasterGlyphCharset(chars: string): readonly string[] {
  const glyphs = Array.from(chars);
  if (glyphs.length === 0) {
    throw new RangeError('Raster glyph charset must contain at least one glyph.');
  }

  for (const glyph of glyphs) {
    if (glyph === '\n' || glyph === '\r') {
      throw new RangeError('Raster glyph charset must be single-line.');
    }

    const codePoint = glyph.codePointAt(0);
    if (codePoint !== undefined && (codePoint < 0x20 || codePoint === 0x7f)) {
      throw new RangeError('Raster glyph charset cannot contain control characters.');
    }
  }

  return glyphs;
}

export function rasterToGlyphSurface(frame: RgbaFrame, options: RasterToGlyphSurfaceOptions): Surface {
  validateRgbaFrame(frame);

  const columns = sanitizeDimension(options.columns);
  const rows = sanitizeDimension(options.rows);
  const surface = createSurface(columns, rows, { char: ' ', empty: false });
  if (columns === 0 || rows === 0) return surface;

  const fit = options.fit ?? 'stretch';
  const cellAspectRatio = sanitizeCellAspectRatio(options.cellAspectRatio);
  const colorMode = options.colorMode ?? 'none';
  const renderer = options.renderer ?? DEFAULT_RENDERER;
  const transform = createFitTransform(frame, columns, rows, fit, cellAspectRatio);

  switch (renderer.kind) {
    case 'charset':
      renderCharset(surface, frame, transform, renderer, colorMode);
      break;
    case 'braille':
      renderBraille(surface, frame, transform, renderer.threshold ?? DEFAULT_THRESHOLD, colorMode);
      break;
    case 'quad':
      renderQuad(surface, frame, transform, renderer.threshold ?? DEFAULT_THRESHOLD, colorMode);
      break;
  }

  return surface;
}

function renderCharset(
  surface: Surface,
  frame: RgbaFrame,
  transform: FitTransform,
  renderer: RasterGlyphCharsetRenderer,
  colorMode: RasterGlyphColorMode,
): void {
  const glyphs = validateRasterGlyphCharset(renderer.chars ?? DEFAULT_RASTER_GLYPH_CHARSET);
  const order = renderer.order ?? 'light-to-dark';

  for (let y = 0; y < surface.height; y++) {
    for (let x = 0; x < surface.width; x++) {
      const sample = sampleTargetRect(frame, transform, x, y, x + 1, y + 1);
      const char = sample === undefined
        ? ' '
        : glyphForDarkness(sample.darkness, glyphs, order);
      surface.set(x, y, cellForSample(char, sample, colorMode, DEFAULT_THRESHOLD));
    }
  }
}

function renderBraille(
  surface: Surface,
  frame: RgbaFrame,
  transform: FitTransform,
  threshold: number,
  colorMode: RasterGlyphColorMode,
): void {
  for (let y = 0; y < surface.height; y++) {
    for (let x = 0; x < surface.width; x++) {
      let code = 0;
      const colors = createColorAccumulator();
      const darkColors = createColorAccumulator();
      const lightColors = createColorAccumulator();

      for (let sy = 0; sy < 4; sy++) {
        for (let sx = 0; sx < 2; sx++) {
          const sample = sampleTargetRect(
            frame,
            transform,
            x + (sx / 2),
            y + (sy / 4),
            x + ((sx + 1) / 2),
            y + ((sy + 1) / 4),
          );
          accumulateSampleColors(sample, colors, darkColors, lightColors, threshold);
          if (sample !== undefined && sample.darkness >= threshold) {
            code |= BRAILLE_DOT_MAP[sy]![sx]!;
          }
        }
      }

      const char = String.fromCharCode(0x2800 + code);
      surface.set(x, y, cellForAccumulatedColors(char, colorMode, colors, darkColors, lightColors));
    }
  }
}

function renderQuad(
  surface: Surface,
  frame: RgbaFrame,
  transform: FitTransform,
  threshold: number,
  colorMode: RasterGlyphColorMode,
): void {
  for (let y = 0; y < surface.height; y++) {
    for (let x = 0; x < surface.width; x++) {
      let mask = 0;
      const colors = createColorAccumulator();
      const darkColors = createColorAccumulator();
      const lightColors = createColorAccumulator();

      for (let sy = 0; sy < 2; sy++) {
        for (let sx = 0; sx < 2; sx++) {
          const sample = sampleTargetRect(
            frame,
            transform,
            x + (sx / 2),
            y + (sy / 2),
            x + ((sx + 1) / 2),
            y + ((sy + 1) / 2),
          );
          accumulateSampleColors(sample, colors, darkColors, lightColors, threshold);
          if (sample !== undefined && sample.darkness >= threshold) {
            mask |= 1 << (sy * 2 + sx);
          }
        }
      }

      const char = QUAD_CHARS[mask] ?? ' ';
      surface.set(x, y, cellForAccumulatedColors(char, colorMode, colors, darkColors, lightColors));
    }
  }
}

function glyphForDarkness(
  darkness: number,
  glyphs: readonly string[],
  order: RasterGlyphCharsetOrder,
): string {
  if (glyphs.length === 1) return glyphs[0] ?? ' ';

  const t = order === 'light-to-dark' ? darkness : 1 - darkness;
  const index = Math.round(clampUnit(t) * (glyphs.length - 1));
  return glyphs[index] ?? glyphs[glyphs.length - 1] ?? ' ';
}

function createFitTransform(
  frame: RgbaFrame,
  columns: number,
  rows: number,
  fit: RasterGlyphFit,
  cellAspectRatio: number,
): FitTransform {
  if (fit === 'stretch') {
    return {
      scaleX: columns / frame.width,
      scaleY: rows / frame.height,
      offsetX: 0,
      offsetY: 0,
      drawWidth: columns,
      drawHeight: rows,
    };
  }

  const visualTargetWidth = columns * cellAspectRatio;
  const scaleX = visualTargetWidth / frame.width;
  const scaleY = rows / frame.height;
  const scale = fit === 'contain'
    ? Math.min(scaleX, scaleY)
    : Math.max(scaleX, scaleY);
  const drawWidth = (frame.width * scale) / cellAspectRatio;
  const drawHeight = frame.height * scale;

  return {
    scaleX: scale / cellAspectRatio,
    scaleY: scale,
    offsetX: (columns - drawWidth) / 2,
    offsetY: (rows - drawHeight) / 2,
    drawWidth,
    drawHeight,
  };
}

function sampleTargetRect(
  frame: RgbaFrame,
  transform: FitTransform,
  tx0: number,
  ty0: number,
  tx1: number,
  ty1: number,
): RasterSample | undefined {
  const rect = sourceRectForTargetRect(frame, transform, tx0, ty0, tx1, ty1);
  if (rect === undefined) return undefined;

  const colors = createColorAccumulator();
  let totalDarkness = 0;
  let sampleCount = 0;

  const startX = Math.max(0, Math.floor(rect.x0));
  const endX = Math.min(frame.width, Math.ceil(rect.x1));
  const startY = Math.max(0, Math.floor(rect.y0));
  const endY = Math.min(frame.height, Math.ceil(rect.y1));

  for (let py = startY; py < endY; py++) {
    for (let px = startX; px < endX; px++) {
      const centerX = px + 0.5;
      const centerY = py + 0.5;
      if (centerX < rect.x0 || centerX > rect.x1 || centerY < rect.y0 || centerY > rect.y1) {
        continue;
      }

      const pixel = readPixel(frame, px, py);
      totalDarkness += pixel.darkness;
      if (pixel.alpha > 0) {
        accumulateColor(colors, pixel.r, pixel.g, pixel.b);
      }
      sampleCount++;
    }
  }

  if (sampleCount === 0) {
    const px = Math.max(0, Math.min(frame.width - 1, Math.floor((rect.x0 + rect.x1) / 2)));
    const py = Math.max(0, Math.min(frame.height - 1, Math.floor((rect.y0 + rect.y1) / 2)));
    const pixel = readPixel(frame, px, py);
    totalDarkness = pixel.darkness;
    if (pixel.alpha > 0) {
      accumulateColor(colors, pixel.r, pixel.g, pixel.b);
    }
    sampleCount = 1;
  }

  return {
    darkness: totalDarkness / sampleCount,
    color: averagedColor(colors),
  };
}

function sourceRectForTargetRect(
  frame: RgbaFrame,
  transform: FitTransform,
  tx0: number,
  ty0: number,
  tx1: number,
  ty1: number,
): SourceRect | undefined {
  const visibleX0 = Math.max(tx0, transform.offsetX);
  const visibleY0 = Math.max(ty0, transform.offsetY);
  const visibleX1 = Math.min(tx1, transform.offsetX + transform.drawWidth);
  const visibleY1 = Math.min(ty1, transform.offsetY + transform.drawHeight);

  if (visibleX0 >= visibleX1 || visibleY0 >= visibleY1) {
    return undefined;
  }

  const x0 = clampRange((visibleX0 - transform.offsetX) / transform.scaleX, 0, frame.width);
  const y0 = clampRange((visibleY0 - transform.offsetY) / transform.scaleY, 0, frame.height);
  const x1 = clampRange((visibleX1 - transform.offsetX) / transform.scaleX, 0, frame.width);
  const y1 = clampRange((visibleY1 - transform.offsetY) / transform.scaleY, 0, frame.height);

  if (x0 >= x1 || y0 >= y1) return undefined;
  return { x0, y0, x1, y1 };
}

function cellForSample(
  char: string,
  sample: RasterSample | undefined,
  colorMode: RasterGlyphColorMode,
  threshold: number,
): Cell {
  if (sample === undefined) return { char: ' ', empty: false };
  if (colorMode === 'none') return { char, empty: false };
  if (colorMode === 'fg') return colorCell(char, sample.color, undefined);

  return sample.darkness >= threshold
    ? colorCell(char, sample.color, undefined)
    : colorCell(char, undefined, sample.color);
}

function cellForAccumulatedColors(
  char: string,
  colorMode: RasterGlyphColorMode,
  colors: ColorAccumulator,
  darkColors: ColorAccumulator,
  lightColors: ColorAccumulator,
): Cell {
  if (colorMode === 'none') return { char, empty: false };
  if (colorMode === 'fg') return colorCell(char, averagedColor(colors), undefined);
  return colorCell(char, averagedColor(darkColors), averagedColor(lightColors));
}

function colorCell(
  char: string,
  fgRGB: readonly [number, number, number] | undefined,
  bgRGB: readonly [number, number, number] | undefined,
): Cell {
  const cell: Cell = { char, empty: false };
  if (fgRGB !== undefined) cell.fgRGB = fgRGB;
  if (bgRGB !== undefined) cell.bgRGB = bgRGB;
  return cell;
}

function accumulateSampleColors(
  sample: RasterSample | undefined,
  colors: ColorAccumulator,
  darkColors: ColorAccumulator,
  lightColors: ColorAccumulator,
  threshold: number,
): void {
  if (sample?.color === undefined) return;

  accumulateColor(colors, sample.color[0], sample.color[1], sample.color[2]);
  if (sample.darkness >= threshold) {
    accumulateColor(darkColors, sample.color[0], sample.color[1], sample.color[2]);
  } else {
    accumulateColor(lightColors, sample.color[0], sample.color[1], sample.color[2]);
  }
}

function readPixel(frame: RgbaFrame, x: number, y: number): {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly alpha: number;
  readonly darkness: number;
} {
  const offset = ((y * frame.width) + x) * 4;
  const r = byteAt(frame.data, offset);
  const g = byteAt(frame.data, offset + 1);
  const b = byteAt(frame.data, offset + 2);
  const alpha = byteAt(frame.data, offset + 3) / 255;
  const luma = ((0.2126 * r) + (0.7152 * g) + (0.0722 * b)) / 255;
  const brightness = ((1 - alpha) * 1) + (alpha * luma);
  return {
    r,
    g,
    b,
    alpha,
    darkness: 1 - brightness,
  };
}

function createColorAccumulator(): ColorAccumulator {
  return { r: 0, g: 0, b: 0, count: 0 };
}

function accumulateColor(accumulator: ColorAccumulator, r: number, g: number, b: number): void {
  accumulator.r += r;
  accumulator.g += g;
  accumulator.b += b;
  accumulator.count++;
}

function averagedColor(accumulator: ColorAccumulator): readonly [number, number, number] | undefined {
  if (accumulator.count === 0) return undefined;
  return [
    Math.round(accumulator.r / accumulator.count),
    Math.round(accumulator.g / accumulator.count),
    Math.round(accumulator.b / accumulator.count),
  ];
}

function validateRgbaFrame(frame: RgbaFrame): void {
  const width = sanitizeDimension(frame.width);
  const height = sanitizeDimension(frame.height);
  if (width <= 0 || height <= 0) {
    throw new RangeError('RGBA frame width and height must be positive integers.');
  }

  const requiredLength = width * height * 4;
  if (frame.data.length < requiredLength) {
    throw new RangeError(`RGBA frame data must contain at least ${requiredLength} values.`);
  }
}

function sanitizeDimension(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.floor(value);
}

function sanitizeCellAspectRatio(value: number | undefined): number {
  if (value === undefined) return DEFAULT_CELL_ASPECT_RATIO;
  if (!Number.isFinite(value) || value <= 0) return DEFAULT_CELL_ASPECT_RATIO;
  return value;
}

function byteAt(data: Uint8ClampedArray | readonly number[], index: number): number {
  const value = data[index];
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(255, Math.round(value)));
}

function clampUnit(value: number): number {
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

function clampRange(value: number, min: number, max: number): number {
  if (value <= min) return min;
  if (value >= max) return max;
  return value;
}
