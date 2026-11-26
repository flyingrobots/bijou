// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// The rings of "Generating SVGs /10" by makio135 (Observable): ring i has radius 20 + 8i, bulged by one noise loop
// that grows with (i / n)^3, a stroke from 5 to 11 wide and a random dash pattern; ring 0 is filled.
import { nextRandom } from '../random.js';
import { randInt } from './makio-palette.js';
import type { Noise3 } from './noise.js';
import type { Rgb } from './pixels.js';

const TAU = Math.PI * 2;
/** The original's path has a vertex for every degree. */
export const VERTICES = 360;
const DASH_ENTRIES = 200;

export interface Ring {
  /** Index into the palette's inks. */
  readonly ink: number;
  readonly base: number;
  readonly strokeWidth: number;
  /** The dash pattern's cumulative ends, dash then gap, in the original's pixels; empty for the solid ring 0. */
  readonly ends: readonly number[];
}

/** The rings for `n`, drawn from the seed as the original draws them. */
export function makeRings(seed: number, n: number, inks: number): readonly Ring[] {
  let s = seed;
  const rings: Ring[] = [];
  for (let i = 0; i < n; i += 1) {
    const [ink, s1] = randInt(s, Math.max(1, inks));
    s = s1;
    const ends: number[] = [];
    let total = 0;
    for (let j = 0; i > 0 && j < DASH_ENTRIES; j += 1) {
      let length: number;
      if (j % 2 === 1) {
        [length, s] = randInt(s, 5, i);
      } else {
        const [r, s2] = nextRandom(s);
        [length, s] = r > i / n ? randInt(s2, 200) : randInt(s2, 3, 10);
      }
      total += length;
      ends.push(total);
    }
    const strokeWidth = 5 + Math.max(0, Math.min(1, (i - 20) / Math.max(1, n - 20))) * 6;
    rings.push({ ink, base: 20 + i * 8, strokeWidth, ends });
  }
  return rings;
}

/** The bulge at every vertex, in [0, 1]: the original's noise3D(cos, sin, seed) * .5 + .5, the seed here drifting. */
export function bulges(noise: Noise3, z: number): Float64Array {
  const out = new Float64Array(VERTICES + 1);
  for (let j = 0; j <= VERTICES; j += 1) {
    const a = (j / VERTICES) * TAU;
    out[j] = Math.max(0, Math.min(1, noise(Math.cos(a), Math.sin(a), z) * 0.7 + 0.5));
  }
  return out;
}

const radius = (ring: Ring, i: number, n: number, bulge: number): number => ring.base * (1 + bulge * (i / n) ** 3);

/** Each ring's arc length at every vertex, so a dash pattern can be laid along it. */
export function arcLengths(rings: readonly Ring[], bulge: Float64Array): readonly Float64Array[] {
  return rings.map((ring, i) => {
    const out = new Float64Array(VERTICES + 1);
    let px = radius(ring, i, rings.length, bulge[0] ?? 0);
    let py = 0;
    for (let j = 1; j <= VERTICES; j += 1) {
      const a = (j / VERTICES) * TAU;
      const r = radius(ring, i, rings.length, bulge[j] ?? 0);
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      out[j] = (out[j - 1] ?? 0) + Math.hypot(x - px, y - py);
      px = x;
      py = y;
    }
    return out;
  });
}

/** Whether position `at` along a ring is inked: on a dash, or within half a stroke of one (square caps). */
function dashed(ends: readonly number[], at: number, half: number): boolean {
  const total = ends[ends.length - 1] ?? 0;
  if (ends.length === 0 || total <= 0) return true;
  const pos = ((at % total) + total) % total;
  let lo = 0;
  let hi = ends.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if ((ends[mid] ?? 0) > pos) hi = mid;
    else lo = mid + 1;
  }
  if (lo % 2 === 0) return true;
  return pos - (ends[lo - 1] ?? 0) < half || (ends[lo] ?? 0) - pos < half;
}

export interface RingsFrame {
  readonly rings: readonly Ring[];
  readonly inks: readonly Rgb[];
  readonly ground: Rgb;
  /** The centre and the picture's scale, in the original's pixels. */
  readonly cx: number;
  readonly cy: number;
  readonly scale: number;
  readonly bulge: Float64Array;
  readonly arcs: readonly Float64Array[];
  /** How far the dashes have crept along their rings, in the original's pixels. */
  readonly creep: number;
}

/** The colour at picture pixel (x, y): the topmost ring whose stroke covers it, else the ground. */
export function ringsPixel(f: RingsFrame): (x: number, y: number) => Rgb {
  const n = f.rings.length;
  return (x, y) => {
    const dx = x * f.scale - f.cx;
    const dy = y * f.scale - f.cy;
    const d = Math.hypot(dx, dy);
    const v = ((((Math.atan2(dy, dx) / TAU) % 1) + 1) % 1) * VERTICES;
    const j = Math.min(VERTICES - 1, Math.floor(v));
    const t = v - j;
    const bulge = (f.bulge[j] ?? 0) * (1 - t) + (f.bulge[j + 1] ?? 0) * t;
    let lo = -1;
    let hi = n - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      const ring = f.rings[mid];
      if (ring !== undefined && radius(ring, mid, n, bulge) <= d) lo = mid;
      else hi = mid - 1;
    }
    for (let i = Math.min(n - 1, lo + 1); i >= Math.max(0, lo - 1); i -= 1) {
      const ring = f.rings[i];
      if (ring === undefined) continue;
      const r = radius(ring, i, n, bulge);
      const half = ring.strokeWidth / 2;
      if (i === 0) {
        if (d <= r + half) return f.inks[ring.ink] ?? f.ground;
        continue;
      }
      if (Math.abs(d - r) > half) continue;
      const arc = f.arcs[i];
      const along = ((arc?.[j] ?? 0) * (1 - t) + (arc?.[j + 1] ?? 0) * t) + f.creep * (i % 2 === 0 ? 1 : -1);
      if (dashed(ring.ends, along, half)) return f.inks[ring.ink] ?? f.ground;
    }
    return f.ground;
  };
}
