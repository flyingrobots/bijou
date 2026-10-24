import type { RasterFontGlyph } from './raster-font-glyph.js';

interface CoverageTarget {
  readonly width: number;
  readonly height: number;
  readonly data: Uint8ClampedArray;
}

/** Project covered atlas texels onto every output pixel they overlap. */
export function paintMinifiedGlyph(
  glyph: RasterFontGlyph, originX: number, originY: number, scale: number,
  target: CoverageTarget, spend: (samples: number) => void,
): void {
  const g = glyph.geometry;
  const texelWidth = g.width / g.columns;
  const texelHeight = g.height / g.rows;
  for (let sy = 0; sy < g.rows; sy++) {
    const top = g.top + sy * texelHeight;
    for (let sx = 0; sx < g.columns; sx++) {
      const left = g.left + sx * texelWidth;
      if (!glyph.sample(left + texelWidth / 2, top + texelHeight / 2)) continue;
      const x0 = Math.max(0, Math.floor((originX + left) * scale));
      const x1 = Math.min(target.width, Math.ceil((originX + left + texelWidth) * scale));
      const y0 = Math.max(0, Math.floor((originY + top) * scale));
      const y1 = Math.min(target.height, Math.ceil((originY + top + texelHeight) * scale));
      spend(Math.max(0, x1 - x0) * Math.max(0, y1 - y0));
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) target.data[(y * target.width + x) * 4 + 3] = 255;
      }
    }
  }
}
