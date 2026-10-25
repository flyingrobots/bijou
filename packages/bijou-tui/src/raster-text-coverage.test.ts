import { describe, expect, it } from 'vitest';
import { RasterFont, RasterFontGlyph, rasterizeText, rasterTextSurface } from './index.js';

function strokeFont(column: number, row?: number): RasterFont {
  const mask = new Uint8Array(8);
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      if ((row === undefined && x === column) || y === row) {
        const bit = y * 8 + x;
        mask[Math.floor(bit / 8)] = (mask[Math.floor(bit / 8)] ?? 0) | (1 << (bit % 8));
      }
    }
  }
  const glyph = new RasterFontGlyph({ advance: 8, left: 0, top: 0, width: 8, height: 8, columns: 8, rows: 8 }, mask);
  return new RasterFont({ family: 'Thin strokes', lineHeight: 8, glyphs: new Map([['l', glyph]]) });
}

describe('font minification preserves thin strokes', () => {
  it.each([0, 1, 2, 3, 4, 5, 6, 7])('preserves a vertical stem in atlas column %i', (column) => {
    const frame = rasterizeText('l', strokeFont(column), { height: 4 });
    for (let y = 0; y < 4; y++) {
      expect(frame.data[(y * frame.width + Math.floor(column / 2)) * 4 + 3]).toBe(255);
    }
    const inkColumns = Array.from({ length: frame.width }, (_, x) => frame.data[x * 4 + 3]);
    expect(inkColumns.filter((value) => value === 255)).toHaveLength(1);
  });

  it.each([0, 2, 4, 6])('preserves a horizontal stroke in atlas row %i', (row) => {
    const frame = rasterizeText('l', strokeFont(0, row), { height: 4 });
    for (let x = 0; x < frame.width; x++) {
      expect(frame.data[(Math.floor(row / 2) * frame.width + x) * 4 + 3]).toBe(255);
    }
  });

  it('carries the entire thin stem into the expected Braille dots', () => {
    const surface = rasterTextSurface('l', strokeFont(0), {
      columns: 2, rows: 1, renderer: { kind: 'braille' }, fit: 'stretch',
    });
    expect(surface.get(0, 0).char).toBe('⡇');
    expect(surface.get(1, 0).char).toBe('\u2800');
  });

  it('preserves a minified stem with negative bearings', () => {
    const mask = new Uint8Array(8).fill(1);
    const glyph = new RasterFontGlyph({ advance: 8, left: -2, top: -2, width: 8, height: 8, columns: 8, rows: 8 }, mask);
    const font = new RasterFont({ family: 'Overhang', lineHeight: 8, glyphs: new Map([['l', glyph]]) });
    const frame = rasterizeText('l', font, { height: 4 });
    for (let y = 0; y < 4; y++) expect(frame.data[y * frame.width * 4 + 3]).toBe(255);
  });

  it('bounds source-coverage work even when the output is tiny', () => {
    const glyph = new RasterFontGlyph({ advance: 8, left: 0, top: 0, width: 8, height: 8, columns: 2048, rows: 2048 }, new Uint8Array(524288));
    const font = new RasterFont({ family: 'Dense atlas', lineHeight: 8, glyphs: new Map([['l', glyph]]) });
    expect(() => rasterizeText('lllll', font, { height: 1 })).toThrow('work limit');
  });
});
