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
  it('fit mode accounts for terminal cell aspect ratio when choosing the centered crop', () => {
      const surface = rasterToGlyphSurface(
        frame(3, 1, [
          [0, 0, 0, 255],
          [255, 255, 255, 255],
          [0, 0, 0, 255],
        ]),
        {
          columns: 2,
          rows: 1,
          fit: 'fit',
          cellAspectRatio: 0.5,
          renderer: {
            kind: 'charset',
            chars: ' #',
            order: 'light-to-dark',
          },
        },
      );
      expect(surface.get(0, 0).char).toBe(' ');
      expect(surface.get(1, 0).char).toBe(' ');
    });

  it('contain mode uses terminal cell aspect ratio for letterboxing', () => {
      const surface = rasterToGlyphSurface(
        frame(1, 1, [[0, 0, 0, 255]]),
        {
          columns: 5,
          rows: 1,
          fit: 'contain',
          cellAspectRatio: 0.5,
          renderer: {
            kind: 'charset',
            chars: ' #',
            order: 'light-to-dark',
          },
        },
      );
      expect(surface.get(0, 0).char).toBe(' ');
      expect(surface.get(1, 0).char).toBe('#');
      expect(surface.get(2, 0).char).toBe('#');
      expect(surface.get(3, 0).char).toBe('#');
      expect(surface.get(4, 0).char).toBe(' ');
    });

  it('zooms contained frames around the viewport center', () => {
      const surface = rasterToGlyphSurface(
        frame(3, 1, [
          [255, 255, 255, 255],
          [0, 0, 0, 255],
          [255, 255, 255, 255],
        ]),
        {
          columns: 1,
          rows: 1,
          fit: 'contain',
          zoom: 3,
          renderer: {
            kind: 'charset',
            chars: ' #',
            order: 'light-to-dark',
          },
        },
      );
      expect(surface.get(0, 0).char).toBe('#');
    });

  it('pans zoomed contained frames horizontally', () => {
      const surface = rasterToGlyphSurface(
        frame(3, 1, [
          [0, 0, 0, 255],
          [255, 255, 255, 255],
          [255, 255, 255, 255],
        ]),
        {
          columns: 1,
          rows: 1,
          fit: 'contain',
          zoom: 3,
          panX: 1,
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
