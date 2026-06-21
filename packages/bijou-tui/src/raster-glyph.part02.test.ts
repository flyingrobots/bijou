import { describe, expect, it } from 'vitest';
import { rasterToGlyphSurface, type RgbaFrame } from './raster-glyph.js';

function frame(
  width: number,
  height: number,
  pixels: readonly (readonly [number, number, number, number])[],
): RgbaFrame {
  const data = new Uint8ClampedArray(width * height * 4);
  for (const [index, [r, g, b, a]] of pixels.entries()) {
    const offset = index * 4;
    data[offset] = r;
    data[offset + 1] = g;
    data[offset + 2] = b;
    data[offset + 3] = a;
  }
  return { width, height, data };
}

describe('rasterToGlyphSurface()', () => {
  it('applies contrast before selecting charset density glyphs', () => {
      const base = rasterToGlyphSurface(
        frame(1, 1, [[80, 80, 80, 255]]),
        {
          columns: 1,
          rows: 1,
          renderer: {
            kind: 'charset',
            chars: ' .#',
            order: 'light-to-dark',
          },
        },
      );
      const contrasted = rasterToGlyphSurface(
        frame(1, 1, [[80, 80, 80, 255]]),
        {
          columns: 1,
          rows: 1,
          contrast: 2,
          renderer: {
            kind: 'charset',
            chars: ' .#',
            order: 'light-to-dark',
          },
        },
      );
      expect(base.get(0, 0).char).toBe('.');
      expect(contrasted.get(0, 0).char).toBe('#');
    });

  it('applies ordered dithering to density decisions without dropping source color', () => {
      const surface = rasterToGlyphSurface(
        frame(2, 1, [
          [128, 128, 128, 255],
          [128, 128, 128, 255],
        ]),
        {
          columns: 2,
          rows: 1,
          colorMode: 'fg',
          dither: 'ordered',
          renderer: {
            kind: 'charset',
            chars: ' #',
            order: 'light-to-dark',
          },
        },
      );
      expect(surface.get(0, 0).char).toBe(' ');
      expect(surface.get(1, 0).char).toBe('#');
      expect(surface.get(0, 0).fgRGB).toEqual([128, 128, 128]);
      expect(surface.get(1, 0).fgRGB).toEqual([128, 128, 128]);
    });

  it('letterboxes contained frames into empty cells', () => {
      const surface = rasterToGlyphSurface(
        frame(1, 1, [[0, 0, 0, 255]]),
        {
          columns: 3,
          rows: 1,
          fit: 'contain',
          renderer: {
            kind: 'charset',
            chars: ' #',
            order: 'light-to-dark',
          },
        },
      );
      expect(surface.get(0, 0).char).toBe(' ');
      expect(surface.get(1, 0).char).toBe('#');
      expect(surface.get(2, 0).char).toBe(' ');
    });

  it('fit mode fills the target and crops horizontal overflow from the center', () => {
      const surface = rasterToGlyphSurface(
        frame(5, 1, [
          [255, 255, 255, 255],
          [255, 255, 255, 255],
          [0, 0, 0, 255],
          [255, 255, 255, 255],
          [255, 255, 255, 255],
        ]),
        {
          columns: 1,
          rows: 1,
          fit: 'fit',
          renderer: {
            kind: 'charset',
            chars: ' #',
            order: 'light-to-dark',
          },
        },
      );
      expect(surface.get(0, 0).char).toBe('#');
    });

  it('fit mode fills the target and crops vertical overflow from the center', () => {
      const surface = rasterToGlyphSurface(
        frame(1, 5, [
          [255, 255, 255, 255],
          [255, 255, 255, 255],
          [0, 0, 0, 255],
          [255, 255, 255, 255],
          [255, 255, 255, 255],
        ]),
        {
          columns: 1,
          rows: 1,
          fit: 'fit',
          renderer: {
            kind: 'charset',
            chars: ' #',
            order: 'light-to-dark',
          },
        },
      );
      expect(surface.get(0, 0).char).toBe('#');
    });
});
