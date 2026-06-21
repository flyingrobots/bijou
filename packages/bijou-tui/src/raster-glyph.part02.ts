import { createSurface } from '@flyingrobots/bijou';

import type { Surface } from '@flyingrobots/bijou';

import { DEFAULT_RASTER_GLYPH_CHARSET, DEFAULT_RENDERER, DEFAULT_THRESHOLD } from './raster-glyph.part01.js';

import type { FitTransform, RasterGlyphAdjustments, RasterGlyphCharsetRenderer, RasterGlyphColorMode, RasterToGlyphSurfaceOptions, RgbaFrame } from './raster-glyph.part01.js';

import { glyphForDarkness, renderBraille, renderQuad } from './raster-glyph.part03.js';

import { adjustSample, createFitTransform } from './raster-glyph.part04.js';

import { cellForSample, sampleTargetRect } from './raster-glyph.part05.js';

import { sanitizeDimension, validateRgbaFrame } from './raster-glyph.part06.js';

import { sanitizeCellAspectRatio, sanitizeContrast, sanitizeDitherMode, sanitizePan, sanitizeZoom } from './raster-glyph.part07.js';
export const QUAD_CHARS = [
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
  const zoom = sanitizeZoom(options.zoom);
  const panX = sanitizePan(options.panX);
  const panY = sanitizePan(options.panY);
  const colorMode = options.colorMode ?? 'none';
  const renderer = options.renderer ?? DEFAULT_RENDERER;
  const adjustments: RasterGlyphAdjustments = {
    contrast: sanitizeContrast(options.contrast),
    dither: sanitizeDitherMode(options.dither),
  };
  const transform = createFitTransform(frame, columns, rows, fit, cellAspectRatio, zoom, panX, panY);

  switch (renderer.kind) {
    case 'charset':
      renderCharset(surface, frame, transform, renderer, colorMode, adjustments);
      break;
    case 'braille':
      renderBraille(surface, frame, transform, renderer.threshold, colorMode, adjustments);
      break;
    case 'quad':
      renderQuad(surface, frame, transform, renderer.threshold, colorMode, adjustments);
      break;
  }

  return surface;
}
export function renderCharset(
  surface: Surface,
  frame: RgbaFrame,
  transform: FitTransform,
  renderer: RasterGlyphCharsetRenderer,
  colorMode: RasterGlyphColorMode,
  adjustments: RasterGlyphAdjustments,
): void {
  const glyphs = validateRasterGlyphCharset(renderer.chars ?? DEFAULT_RASTER_GLYPH_CHARSET);
  const order = renderer.order ?? 'light-to-dark';

  for (let y = 0; y < surface.height; y++) {
    for (let x = 0; x < surface.width; x++) {
      const sample = sampleTargetRect(frame, transform, x, y, x + 1, y + 1);
      const adjustedSample = adjustSample(sample, x, y, adjustments);
      const char = adjustedSample === undefined
        ? ' '
        : glyphForDarkness(adjustedSample.darkness, glyphs, order);
      surface.set(x, y, cellForSample(char, adjustedSample, colorMode, DEFAULT_THRESHOLD));
    }
  }
}
