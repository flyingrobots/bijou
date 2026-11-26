// Licensed under the Apache License, Version 2.0, like the rest of this repository.
import { nextRandom } from '../random.js';

/** A seeded 3D gradient noise in [-1, 1]: the same seed gives the same field. */
export type Noise3 = (x: number, y: number, z: number) => number;

const GRADIENTS: readonly (readonly [number, number, number])[] = [
  [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0], [1, 0, 1], [-1, 0, 1],
  [1, 0, -1], [-1, 0, -1], [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1],
];

const fade = (t: number): number => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Perlin's improved noise over a permutation shuffled from `seed`. */
export function createNoise3(seed: number): Noise3 {
  const perm = Array.from({ length: 256 }, (_, i) => i);
  let rng = seed;
  for (let i = 255; i > 0; i -= 1) {
    const [r, next] = nextRandom(rng);
    rng = next;
    const j = Math.floor(r * (i + 1));
    [perm[i], perm[j]] = [perm[j] ?? 0, perm[i] ?? 0];
  }
  const p = (i: number): number => perm[i & 255] ?? 0;
  const grad = (hash: number, x: number, y: number, z: number): number => {
    const [gx, gy, gz] = GRADIENTS[hash % 12] ?? [0, 0, 0];
    return gx * x + gy * y + gz * z;
  };
  return (x, y, z) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const zi = Math.floor(z);
    const xf = x - xi;
    const yf = y - yi;
    const zf = z - zi;
    const u = fade(xf);
    const v = fade(yf);
    const w = fade(zf);
    const h = (dx: number, dy: number, dz: number): number => p(p(p(xi + dx) + yi + dy) + zi + dz);
    const corner = (dx: number, dy: number, dz: number): number => grad(h(dx, dy, dz), xf - dx, yf - dy, zf - dz);
    return lerp(
      lerp(lerp(corner(0, 0, 0), corner(1, 0, 0), u), lerp(corner(0, 1, 0), corner(1, 1, 0), u), v),
      lerp(lerp(corner(0, 0, 1), corner(1, 0, 1), u), lerp(corner(0, 1, 1), corner(1, 1, 1), u), v),
      w,
    );
  };
}
