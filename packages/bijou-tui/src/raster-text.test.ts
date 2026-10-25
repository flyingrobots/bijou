import { describe, expect, it } from 'vitest';
import { RasterFontGlyph, RasterFont, layoutRasterText, rasterizeText, rasterTextSurface } from './index.js';

const GEOMETRY = { advance: 3, left: 0, top: 0, width: 2, height: 2, columns: 2, rows: 2 };
const GLYPH = new RasterFontGlyph(GEOMETRY, new Uint8Array([9]));
const FONT = new RasterFont({ family: 'Fixture', lineHeight: 3, glyphs: new Map([['A', GLYPH]]) });

describe('raster font text', () => {
  it('lays out advances and newlines and rasterizes the exact bitmap coverage', () => {
    const layout = layoutRasterText('A\nA', FONT);
    expect(layout.glyphs.map(({ x, y }) => [x, y])).toEqual([[0, 0], [0, 3]]);
    expect([layout.width, layout.height, layout.advance]).toEqual([3, 5, 3]);
    const frame = rasterizeText('A\nA', FONT, { height: 5 });
    expect([frame.width, frame.height]).toEqual([3, 5]);
    const covered: number[] = [];
    for (let i = 0; i < frame.width * frame.height; i++) {
      if (frame.data[i * 4 + 3] === 255) covered.push(i);
    }
    expect(covered).toEqual([0, 4, 9, 13]);
  });

  it('preserves negative bearings rather than clipping overhangs', () => {
    const glyph = new RasterFontGlyph({ ...GEOMETRY, left: -1, top: -2 }, new Uint8Array([9]));
    const font = new RasterFont({ family: 'Overhang', lineHeight: 3, glyphs: new Map([['A', glyph]]) });
    const layout = layoutRasterText('A', font);
    expect([layout.left, layout.top, layout.width, layout.height]).toEqual([-1, -2, 4, 2]);
    const frame = rasterizeText('A', font, { height: 2 });
    expect(frame.data[3]).toBe(255);
    expect(frame.data[(frame.width + 1) * 4 + 3]).toBe(255);
  });

  it('supports explicit zero advances for overlaid glyphs', () => {
    const glyph = new RasterFontGlyph({ ...GEOMETRY, advance: 0 }, new Uint8Array([9]));
    const font = new RasterFont({ family: 'Overlay', lineHeight: 3, glyphs: new Map([['A', glyph]]) });
    const layout = layoutRasterText('AA', font);
    expect(layout.glyphs.map(({ x }) => x)).toEqual([0, 0]);
    expect([layout.width, layout.advance]).toEqual([2, 0]);
  });

  it('uses existing Braille packing and caller colors', () => {
    const surface = rasterTextSurface('A', FONT, {
      columns: 3, rows: 1, fit: 'stretch', renderer: { kind: 'braille' }, fg: '#f7685f', bg: '#1c1716',
    });
    expect([surface.get(0, 0).char, surface.get(1, 0).char, surface.get(2, 0).char]).toEqual(['⠛', '⣤', '\u2800']);
    expect(surface.get(0, 0).fg).toBe('#f7685f');
    expect(surface.get(2, 0).bg).toBe('#1c1716');
  });

  it.each([{ kind: 'quad' }, { kind: 'charset', chars: ' #' }] as const)('supports the %s renderer', (renderer) => {
    const surface = rasterTextSurface('A', FONT, { columns: 6, rows: 4, renderer });
    const chars = Array.from({ length: 24 }, (_, i) => surface.get(i % 6, Math.floor(i / 6)).char).join('');
    expect(chars.trim().length).toBeGreaterThan(0);
    expect(chars).not.toMatch(/[\u2800-\u28ff]/u);
  });

  it('owns the font lookup and explicitly handles missing code points and empty text', () => {
    const lookup = new Map([['A', GLYPH], ['😀', GLYPH]]);
    const font = new RasterFont({ family: 'Owned', lineHeight: 3, glyphs: lookup, fallback: 'A' });
    lookup.clear();
    expect(layoutRasterText('😀', font).glyphs).toHaveLength(1);
    expect(font.glyph('?')).toBe(GLYPH);
    expect(() => FONT.glyph('?')).toThrow('no glyph');
    expect(rasterizeText('', FONT, { height: 20 }).data).toEqual(new Uint8ClampedArray(4));
    const empty = rasterTextSurface('', FONT, { columns: 4, rows: 2, bg: '#1c1716' });
    expect(empty.width).toBe(4);
    expect(empty.get(0, 0).empty).toBe(false);
    expect(empty.get(0, 0).bg).toBe('#1c1716');
  });

  it('rejects invalid metrics and bounds allocation and overlapping-glyph work', () => {
    expect(() => new RasterFont({ family: 'Bad', lineHeight: Infinity, glyphs: new Map([['A', GLYPH]]) })).toThrow();
    expect(() => rasterizeText('A', FONT, { height: 4096 })).toThrow('allocation limit');
    expect(() => rasterizeText('A', FONT, { height: NaN })).toThrow();
    expect(() => layoutRasterText('A'.repeat(20001), FONT)).toThrow();
    expect(() => rasterTextSurface('A', FONT, { columns: 4096, rows: 1024 })).toThrow('budget');
    const glyph = new RasterFontGlyph({ ...GEOMETRY, advance: 0.000001 }, new Uint8Array([9]));
    const font = new RasterFont({ family: 'Overlapping', lineHeight: 3, glyphs: new Map([['A', glyph]]) });
    expect(() => rasterizeText('A'.repeat(100), font, { height: 512 })).toThrow('work limit');
  });
});
