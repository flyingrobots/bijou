// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// After "Line Integral Convolution" by stwind (Observable): the sketch's vector fields, its
// hash functions ("Hash without Sine" by David Hoskins) and its viridis colour map (by Sean Kelley).

/** A 2D vector. */
export type Vec2 = readonly [number, number];

/** One of the original's fields: a vector at field point (x, y), its step `h` and the speed range its colour map spans. */
export interface LicField {
  readonly name: string;
  /** The integration step in pixels per field unit, for a picture `aspect` wide per unit of height. */
  readonly h: (aspect: number) => number;
  readonly range: (aspect: number) => Vec2;
  readonly at: (x: number, y: number) => Vec2;
}

const fixed = (value: number) => (): number => value;
const span = (lo: number, hi: number) => (): Vec2 => [lo, hi];

/** The original's seven fields, in its order. */
export const LIC_FIELDS: readonly LicField[] = [
  { name: 'circle', h: (a) => 1 / (5 * a), range: (a) => [0, Math.hypot(5 * a, 5) * 0.7], at: (x, y) => [-y, x] },
  {
    name: 'vortex', h: fixed(0.4944), range: span(0, 2.3776),
    at(x, y) {
      const RADIUS = 2;
      const PULL = 0.25;
      const sqSum = x * x + y * y;
      if (sqSum === 0) return [0, 0];
      const divisor = 1 / Math.sqrt(sqSum);
      const factor = Math.exp(-sqSum / RADIUS);
      return [y * factor * divisor - PULL * x, -x * factor * divisor - PULL * y];
    },
  },
  {
    name: 'twirls', h: fixed(0.5003), range: span(0.0086, 2.3036),
    at: (x, y) => [Math.cos(x) + Math.cos(y * 2.5), Math.sin(2 * x) * Math.cos(0.5 * y + 1.5) - 0.5],
  },
  { name: 'circulate', h: fixed(1), range: span(0.0131, 1.414), at: (x, y) => [Math.cos(y), Math.sin(x)] },
  { name: 'swirls', h: fixed(1), range: span(0.02189, 1.414), at: (x, y) => [Math.sin(x + y), Math.cos(x - y)] },
  { name: 'churn', h: fixed(1), range: span(0.0082, 1.414), at: (x, y) => [Math.cos(Math.hypot(x, y)), Math.cos(x - y)] },
  { name: 'lines', h: fixed(1), range: span(0, 1.414), at: (x) => [1, Math.sin(x)] },
];

/** The field the original opens on. */
export const DEFAULT_FIELD = 1;

const fract = (v: number): number => v - Math.floor(v);

/** Hash without Sine: a value in [0, 1) from a 3D point. */
export function hash13(x: number, y: number, z: number): number {
  let a = fract(x * 0.1031);
  let b = fract(y * 0.1031);
  let c = fract(z * 0.1031);
  const d = a * (c + 31.32) + b * (b + 31.32) + c * (a + 31.32);
  a += d;
  b += d;
  c += d;
  return fract((a + b) * c);
}

/** Hash without Sine: two values in [0, 1) from a 3D point. */
export function hash23(x: number, y: number, z: number): Vec2 {
  let a = fract(x * 0.1031);
  let b = fract(y * 0.103);
  let c = fract(z * 0.0973);
  const d = a * (b + 33.33) + b * (c + 33.33) + c * (a + 33.33);
  a += d;
  b += d;
  c += d;
  return [fract((a + b) * c), fract((a + c) * b)];
}

const VIRIDIS: readonly (readonly [number, number, number])[] = [
  [0.2777273272234177, 0.005407344544966578, 0.3340998053353061],
  [0.1050930431085774, 1.404613529898575, 1.384590162594685],
  [-0.3308618287255563, 0.214847559468213, 0.09509516302823659],
  [-4.634230498983486, -5.799100973351585, -19.33244095627987],
  [6.228269936347081, 14.17993336680509, 56.69055260068105],
  [4.776384997670288, -13.74514537774601, -65.35303263337234],
  [-5.435455855934631, 4.645852612178535, 26.3124352495832],
];

/** The viridis colour map as a polynomial, 0–1 channels for t in [0, 1]. */
export function viridis(t: number): readonly [number, number, number] {
  const channel = (k: 0 | 1 | 2): number => VIRIDIS.reduceRight((acc, c) => (c[k]) + t * acc, 0);
  return [channel(0), channel(1), channel(2)];
}

/** The original's `fit`: x mapped from [a, b] onto [c, d], clamped. */
export function fit(x: number, a: number, b: number, c: number, d: number): number {
  const t = Math.min(1, Math.max(0, (x - b) / (a - b)));
  return d + (c - d) * t;
}
