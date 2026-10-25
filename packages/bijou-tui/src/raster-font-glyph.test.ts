import { describe, expect, it } from 'vitest';
import { RasterFontGlyph } from './raster-font-glyph.js';

describe('raster glyph construction boundary', () => {
  it.each(['advance', 'left', 'top', 'width', 'height', 'columns', 'rows'])(
    'rejects a required %s metric omitted by a JavaScript caller', (metric) => {
      const geometry = { advance: 2, left: 0, top: 0, width: 2, height: 2, columns: 2, rows: 2 };
      Reflect.deleteProperty(geometry, metric);
      expect(() => new RasterFontGlyph(geometry, new Uint8Array([9]))).toThrow();
    },
  );

  it('owns the supplied coverage and geometry', () => {
    const geometry = { advance: 2, left: 0, top: 0, width: 2, height: 2, columns: 2, rows: 2 };
    const mask = new Uint8Array([9]);
    const glyph = new RasterFontGlyph(geometry, mask);
    geometry.left = 10;
    mask.fill(0);
    expect(glyph.geometry.left).toBe(0);
    expect(glyph.sample(0.5, 0.5)).toBe(true);
    expect(Object.isFrozen(glyph.geometry)).toBe(true);
  });
});
