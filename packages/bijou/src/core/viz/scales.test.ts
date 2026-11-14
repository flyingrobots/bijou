import { describe, expect, it } from 'vitest';
import {
  scaleBand,
  scaleLinear,
  scaleLog,
  scaleOklch,
} from './index.js';

describe('scaleLinear', () => {
  it('maps domain values linearly into the target range', () => {
    const s = scaleLinear([0, 100], [0, 50]);
    expect(s(0)).toBe(0);
    expect(s(50)).toBe(25);
    expect(s(100)).toBe(50);
  });

  it('supports invert() as the exact inverse of forward mapping', () => {
    const s = scaleLinear([10, 90], [0, 160]);
    for (const val of [10, 25, 50, 77.5, 90]) {
      expect(s.invert(s(val))).toBeCloseTo(val, 8);
    }
  });

  it('clamps out-of-domain inputs when clamp(true) is enabled', () => {
    const s = scaleLinear([0, 10], [0, 100]).clamp(true);
    expect(s(-5)).toBe(0);
    expect(s(25)).toBe(100);
    expect(s.invert(-20)).toBe(0);
    expect(s.invert(150)).toBe(10);
  });

  it('guards against zero-span domains without NaN or Infinity', () => {
    const s = scaleLinear([42, 42], [10, 30]);
    expect(s(42)).toBe(20);
    expect(s(NaN)).toBe(20);
    expect(s(Infinity)).toBe(20);
  });

  it('expands domains cleanly with nice() and generates readable ticks()', () => {
    const s = scaleLinear([0.12, 96.4], [0, 100]).nice(5);
    const [d0, d1] = s.domain();
    expect(d0).toBe(0);
    expect(d1).toBe(100);
    const ticks = s.ticks(5);
    expect(ticks).toEqual([0, 20, 40, 60, 80, 100]);
  });
});

describe('scaleLog', () => {
  it('maps exponential decades linearly into the range and inverts cleanly', () => {
    const s = scaleLog([1, 1000], [0, 300]);
    expect(s(1)).toBeCloseTo(0, 6);
    expect(s(10)).toBeCloseTo(100, 6);
    expect(s(100)).toBeCloseTo(200, 6);
    expect(s(1000)).toBeCloseTo(300, 6);
    expect(s.invert(200)).toBeCloseTo(100, 6);
  });

  it('guards against non-positive inputs without throwing or returning NaN', () => {
    const s = scaleLog([1, 100], [0, 10]);
    expect(Number.isFinite(s(0))).toBe(true);
    expect(Number.isFinite(s(-10))).toBe(true);
    expect(Number.isFinite(s(NaN))).toBe(true);
  });
});

describe('scaleBand', () => {
  it('positions discrete keys evenly with bandwidth and step', () => {
    const s = scaleBand(['api', 'db', 'cache'], [0, 90], 0);
    expect(s.step()).toBeCloseTo(30, 6);
    expect(s.bandwidth()).toBeCloseTo(30, 6);
    expect(s('api')).toBeCloseTo(0, 6);
    expect(s('db')).toBeCloseTo(30, 6);
    expect(s('cache')).toBeCloseTo(60, 6);
    expect(s('missing')).toBeUndefined();
  });
});

describe('scaleOklch', () => {
  it('interpolates lightness, chroma, and circular hue in OKLCH space', () => {
    const s = scaleOklch(
      [0, 100],
      [
        { l: 0.5, c: 0.12, h: 250 },
        { l: 0.8, c: 0.16, h: 30 },
      ],
    );
    const lo = s(0);
    const mid = s(50);
    const hi = s(100);
    expect(lo.oklch.l).toBeCloseTo(0.5, 5);
    expect(mid.oklch.l).toBeCloseTo(0.65, 5);
    expect(hi.oklch.l).toBeCloseTo(0.8, 5);
    expect(mid.hex).toMatch(/^#[0-9a-f]{6}$/);
    expect(mid.rgb.every((ch) => ch >= 0 && ch <= 255)).toBe(true);
  });
});
