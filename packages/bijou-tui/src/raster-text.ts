import { createSurface, type ColorRef, type Surface } from '@flyingrobots/bijou';
import { rasterToGlyphSurface, type RasterToGlyphSurfaceOptions, type RgbaFrame } from './raster-glyph.js';
import { layoutRasterText, type RasterFont, type RasterTextLayout } from './raster-font.js';
import { paintMinifiedGlyph } from './raster-text-coverage.js';

/** Output ink height in pixels. Coverage is opaque black on transparent background. */
export interface RasterizeTextOptions { readonly height: number }

export interface RasterTextSurfaceOptions extends Omit<RasterToGlyphSurfaceOptions, 'colorMode'> {
  readonly fg?: ColorRef;
  readonly bg?: ColorRef;
}

/** Render precompiled font coverage to RGBA for the existing raster pipeline. */
export function rasterizeText(text: string, font: RasterFont, options: RasterizeTextOptions): RgbaFrame {
  const height = options.height;
  if (!Number.isInteger(height) || height < 1 || height > 4096) throw new RangeError('Raster text height must be 1..4096 pixels.');
  const layout = layoutRasterText(text, font);
  if (layout.glyphs.length === 0) return { width: 1, height: 1, data: new Uint8ClampedArray(4) };
  const scale = height / layout.height;
  const width = Math.ceil(layout.width * scale);
  if (!Number.isSafeInteger(width) || width < 1 || width * height > 1048576) {
    throw new RangeError('Raster text exceeds the 1048576-pixel allocation limit.');
  }
  const data = new Uint8ClampedArray(width * height * 4);
  paintCoverage(layout, scale, width, height, data);
  return { width, height, data };
}

function paintCoverage(layout: RasterTextLayout, scale: number, width: number, height: number, data: Uint8ClampedArray): void {
  const boxes = layout.glyphs.map((positioned) => {
    const { glyph, x: penX, y: penY } = positioned;
    const g = glyph.geometry;
    const left = Math.max(0, Math.floor((penX + g.left - layout.left) * scale));
    const top = Math.max(0, Math.floor((penY + g.top - layout.top) * scale));
    const right = Math.min(width, Math.ceil((penX + g.left + g.width - layout.left) * scale));
    const bottom = Math.min(height, Math.ceil((penY + g.top + g.height - layout.top) * scale));
    return { glyph, penX, penY, left, top, right, bottom };
  });
  if (boxes.reduce((sum, box) => sum + (box.right - box.left) * (box.bottom - box.top), 0) > 16777216) {
    throw new RangeError('Raster text exceeds the 16777216-sample work limit.');
  }
  const sourceWork = boxes.reduce((sum, box) => {
    const g = box.glyph.geometry;
    return sum + (g.width * scale < g.columns || g.height * scale < g.rows
      ? g.columns * g.rows : (box.right - box.left) * (box.bottom - box.top));
  }, 0);
  if (sourceWork > 16777216) throw new RangeError('Raster text exceeds the 16777216-sample work limit.');
  let work = 0;
  const spend = (samples: number): void => {
    work += samples;
    if (work > 16777216) throw new RangeError('Raster text exceeds the 16777216-sample work limit.');
  };
  const target = { width, height, data };
  for (const { glyph, penX, penY, left, top, right, bottom } of boxes) {
    const g = glyph.geometry;
    if (g.width * scale < g.columns || g.height * scale < g.rows) {
      spend(g.columns * g.rows);
      paintMinifiedGlyph(glyph, penX - layout.left, penY - layout.top, scale, target, spend);
      continue;
    }
    spend((right - left) * (bottom - top));
    for (let y = top; y < bottom; y++) {
      for (let x = left; x < right; x++) {
        if (glyph.sample((x + 0.5) / scale + layout.left - penX, (y + 0.5) / scale + layout.top - penY)) {
          data[(y * width + x) * 4 + 3] = 255;
        }
      }
    }
  }
}

/** Font geometry to Braille, quadrant blocks or a custom charset, using rasterToGlyphSurface. */
export function rasterTextSurface(text: string, font: RasterFont, options: RasterTextSurfaceOptions): Surface {
  const { columns, rows } = options;
  if (!Number.isInteger(columns) || !Number.isInteger(rows) || columns < 0 || rows < 0
    || columns > 4096 || rows > 1024 || columns * rows > 131072) {
    throw new RangeError('Raster text surface exceeds its dimension or cell budget.');
  }
  if (columns === 0 || rows === 0) return createSurface(columns, rows);
  const frame = rasterizeText(text, font, { height: rows * 4 });
  const surface = rasterToGlyphSurface(frame, {
    ...options, colorMode: 'none', fit: options.fit ?? 'contain', cellAspectRatio: options.cellAspectRatio ?? 0.5,
  });
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      const cell = surface.get(x, y);
      surface.set(x, y, { ...cell, fg: options.fg ?? cell.fg, bg: options.bg ?? cell.bg });
    }
  }
  return surface;
}
