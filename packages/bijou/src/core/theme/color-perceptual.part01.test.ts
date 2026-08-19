import { describe, expect, it } from 'vitest';
import {
  deltaEOk,
  oklabToOklch,
  oklabToRgb,
  oklchToOklab,
  rgbToOklab,
} from './color.js';

function expectClose(actual: number, expected: number, precision = 6): void {
  expect(actual).toBeCloseTo(expected, precision);
}

describe('OKLAB conversion', () => {
  it('matches the published sRGB red reference', () => {
    const red = rgbToOklab([255, 0, 0]);
    expectClose(red.l, 0.627955361);
    expectClose(red.a, 0.224863061);
    expectClose(red.b, 0.125846299);
  });

  it('round-trips representative sRGB colors within one byte', () => {
    const samples = [
      [0, 0, 0],
      [255, 255, 255],
      [48, 114, 193],
      [242, 196, 93],
      [17, 24, 39],
    ] as const;
    for (const sample of samples) {
      const roundTrip = oklabToRgb(rgbToOklab([...sample]));
      roundTrip.forEach((channel, index) => {
        expect(Math.abs(channel - sample[index])).toBeLessThanOrEqual(1);
      });
    }
  });

  it('converts rectangular and cylindrical forms without moving lightness', () => {
    const lab = rgbToOklab([48, 114, 193]);
    const lch = oklabToOklch(lab);
    const roundTrip = oklchToOklab(lch);
    expectClose(lch.l, lab.l);
    expectClose(roundTrip.l, lab.l);
    expectClose(roundTrip.a, lab.a);
    expectClose(roundTrip.b, lab.b);
    expect(lch.h).toBeGreaterThanOrEqual(0);
    expect(lch.h).toBeLessThan(360);
  });

  it('uses Euclidean OKLAB distance', () => {
    const black = rgbToOklab([0, 0, 0]);
    const white = rgbToOklab([255, 255, 255]);
    expect(deltaEOk(black, black)).toBe(0);
    expectClose(deltaEOk(black, white), 1);
    expect(deltaEOk(black, white)).toBe(deltaEOk(white, black));
  });

  it('rejects invalid numeric channels instead of emitting invalid colors', () => {
    expect(() => rgbToOklab([Number.NaN, 0, 0])).toThrow('RGB channels must be finite numbers');
    expect(() => rgbToOklab([256, 0, 0])).toThrow('RGB channels must be between 0 and 255');
    expect(() => oklchToOklab({ l: 0.5, c: -0.1, h: 255 }))
      .toThrow('OKLCH chroma must be zero or greater');
  });
});
