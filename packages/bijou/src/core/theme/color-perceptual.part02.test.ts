import { describe, expect, it } from 'vitest';
import {
  gamutMapOklch,
  gamutRelativeOklch,
  interpolateHue,
  isOklchInSrgb,
  maxSrgbChroma,
} from './color.js';

describe('OKLCH sRGB gamut', () => {
  it('distinguishes in-gamut and impossible chroma requests', () => {
    expect(isOklchInSrgb({ l: 0.7, c: 0.08, h: 255 })).toBe(true);
    expect(isOklchInSrgb({ l: 0.7, c: 0.4, h: 255 })).toBe(false);
  });

  it('maps by reducing chroma while holding lightness and hue', () => {
    const requested = { l: 0.7, c: 0.4, h: 255 };
    const mapped = gamutMapOklch(requested);
    expect(isOklchInSrgb(mapped)).toBe(true);
    expect(mapped.l).toBeCloseTo(requested.l, 10);
    expect(mapped.h).toBeCloseTo(requested.h, 10);
    expect(mapped.c).toBeLessThan(requested.c);
  });

  it('finds the measured sapphire gamut shell near its cusp', () => {
    expect(maxSrgbChroma(0.62, 255)).toBeCloseTo(0.204, 2);
  });

  it('expresses chroma as a monotonic fraction of the local shell', () => {
    const neutral = gamutRelativeOklch(0.62, 0, 255);
    const half = gamutRelativeOklch(0.62, 0.5, 255);
    const shell = gamutRelativeOklch(0.62, 1, 255);
    expect(neutral.c).toBe(0);
    expect(half.c).toBeCloseTo(shell.c / 2, 8);
    expect(shell.c).toBeGreaterThan(half.c);
    expect(isOklchInSrgb(shell)).toBe(true);
  });

  it('leaves an already in-gamut request unchanged', () => {
    const color = { l: 0.7, c: 0.08, h: 255 };
    expect(gamutMapOklch(color)).toEqual(color);
  });

  it('clamps finite range inputs and rejects non-finite coordinates', () => {
    expect(gamutRelativeOklch(0.62, 2, 255).c)
      .toBeCloseTo(maxSrgbChroma(0.62, 255), 8);
    expect(() => gamutRelativeOklch(0.62, Number.NaN, 255))
      .toThrow('Gamut-relative OKLCH coordinates must use finite numbers');
    expect(() => maxSrgbChroma(Number.POSITIVE_INFINITY, 255))
      .toThrow('OKLCH gamut coordinates must use finite numbers');
  });
});

describe('circular hue interpolation', () => {
  it('takes the shorter arc through zero degrees', () => {
    expect(interpolateHue(350, 10, 0.5, 'shorter')).toBeCloseTo(0, 8);
  });

  it('takes the longer arc through 180 degrees', () => {
    expect(interpolateHue(350, 10, 0.5, 'longer')).toBeCloseTo(180, 8);
  });

  it('takes one full turn when longer-path endpoints normalize to the same hue', () => {
    expect(interpolateHue(20, 380, 0.25, 'longer')).toBeCloseTo(110, 8);
    expect(interpolateHue(20, 380, 0.5, 'longer')).toBeCloseTo(200, 8);
  });

  it('clamps interpolation progress', () => {
    expect(interpolateHue(20, 80, -1)).toBe(20);
    expect(interpolateHue(20, 80, 2)).toBe(80);
  });

  it('rejects non-finite interpolation coordinates', () => {
    expect(() => interpolateHue(20, 80, Number.NaN))
      .toThrow('Hue interpolation coordinates must use finite numbers');
  });
});
