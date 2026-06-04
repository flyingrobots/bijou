import { describe, expect, it } from 'vitest';
import {
  RASTER_GLYPH_CHARSETS,
  rasterToGlyphSurface,
  validateRasterGlyphCharset,
  type RgbaFrame,
} from './raster-glyph.js';

function frame(width: number, height: number, pixels: readonly (readonly [number, number, number, number])[]): RgbaFrame {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let index = 0; index < pixels.length; index++) {
    const [r, g, b, a] = pixels[index]!;
    const offset = index * 4;
    data[offset] = r;
    data[offset + 1] = g;
    data[offset + 2] = b;
    data[offset + 3] = a;
  }
  return { width, height, data };
}

describe('rasterToGlyphSurface()', () => {
  it('renders a custom dark-to-light charset from synthetic RGBA luminance', () => {
    const surface = rasterToGlyphSurface(
      frame(2, 1, [
        [0, 0, 0, 255],
        [255, 255, 255, 255],
      ]),
      {
        columns: 2,
        rows: 1,
        renderer: {
          kind: 'charset',
          chars: RASTER_GLYPH_CHARSETS.launch,
          order: 'dark-to-light',
        },
      },
    );

    expect(surface.get(0, 0).char).toBe('/');
    expect(surface.get(1, 0).char).toBe(' ');
  });

  it('renders a custom light-to-dark charset in reverse density order', () => {
    const surface = rasterToGlyphSurface(
      frame(2, 1, [
        [255, 255, 255, 255],
        [0, 0, 0, 255],
      ]),
      {
        columns: 2,
        rows: 1,
        renderer: {
          kind: 'charset',
          chars: ' .#',
          order: 'light-to-dark',
        },
      },
    );

    expect(surface.get(0, 0).char).toBe(' ');
    expect(surface.get(1, 0).char).toBe('#');
  });

  it('rejects empty, multiline, and control-code charsets', () => {
    expect(() => validateRasterGlyphCharset('')).toThrow(/at least one/);
    expect(() => validateRasterGlyphCharset('ab\nc')).toThrow(/single-line/);
    expect(() => validateRasterGlyphCharset(`ab${String.fromCharCode(7)}c`)).toThrow(/control/);
  });

  it('renders Braille from 2x4 darkness samples', () => {
    const surface = rasterToGlyphSurface(
      frame(2, 4, [
        [0, 0, 0, 255],
        [255, 255, 255, 255],
        [255, 255, 255, 255],
        [255, 255, 255, 255],
        [255, 255, 255, 255],
        [255, 255, 255, 255],
        [255, 255, 255, 255],
        [255, 255, 255, 255],
      ]),
      {
        columns: 1,
        rows: 1,
        renderer: { kind: 'braille' },
      },
    );

    expect(surface.get(0, 0).char).toBe('\u2801');
  });

  it('renders quad masks from 2x2 darkness samples', () => {
    const surface = rasterToGlyphSurface(
      frame(2, 2, [
        [0, 0, 0, 255],
        [255, 255, 255, 255],
        [255, 255, 255, 255],
        [0, 0, 0, 255],
      ]),
      {
        columns: 1,
        rows: 1,
        renderer: { kind: 'quad' },
      },
    );

    expect(surface.get(0, 0).char).toBe('▚');
  });

  it('preserves sampled foreground color when requested', () => {
    const surface = rasterToGlyphSurface(
      frame(1, 1, [[0, 64, 128, 255]]),
      {
        columns: 1,
        rows: 1,
        colorMode: 'fg',
        renderer: {
          kind: 'charset',
          chars: ' #',
          order: 'light-to-dark',
        },
      },
    );

    expect(surface.get(0, 0).char).toBe('#');
    expect(surface.get(0, 0).fgRGB).toEqual([0, 64, 128]);
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
