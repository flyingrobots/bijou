// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// Seed patterns for Lenia, the continuous cellular automaton of Bert Chan. The Orbium cells are the published
// pattern (R 13, T 10, mu 0.15, sigma 0.015), embedded so the demo fetches nothing.
import { nextRandom } from '../random.js';

/** The Orbium as published: a 20 by 20 patch of states in [0, 1]. */
export const ORBIUM: readonly (readonly number[])[] = [
  [0, 0, 0, 0, 0, 0, 0.1, 0.14, 0.1, 0, 0, 0.03, 0.03, 0, 0, 0.3, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0.08, 0.24, 0.3, 0.3, 0.18, 0.14, 0.15, 0.16, 0.15, 0.09, 0.2, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0.15, 0.34, 0.44, 0.46, 0.38, 0.18, 0.14, 0.11, 0.13, 0.19, 0.18, 0.45, 0, 0, 0],
  [0, 0, 0, 0, 0.06, 0.13, 0.39, 0.5, 0.5, 0.37, 0.06, 0, 0, 0, 0.02, 0.16, 0.68, 0, 0, 0],
  [0, 0, 0, 0.11, 0.17, 0.17, 0.33, 0.4, 0.38, 0.28, 0.14, 0, 0, 0, 0, 0, 0.18, 0.42, 0, 0],
  [0, 0, 0.09, 0.18, 0.13, 0.06, 0.08, 0.26, 0.32, 0.32, 0.27, 0, 0, 0, 0, 0, 0, 0.82, 0, 0],
  [0.27, 0, 0.16, 0.12, 0, 0, 0, 0.25, 0.38, 0.44, 0.45, 0.34, 0, 0, 0, 0, 0, 0.22, 0.17, 0],
  [0, 0.07, 0.2, 0.02, 0, 0, 0, 0.31, 0.48, 0.57, 0.6, 0.57, 0, 0, 0, 0, 0, 0, 0.49, 0],
  [0, 0.59, 0.19, 0, 0, 0, 0, 0.2, 0.57, 0.69, 0.76, 0.76, 0.49, 0, 0, 0, 0, 0, 0.36, 0],
  [0, 0.58, 0.19, 0, 0, 0, 0, 0, 0.67, 0.83, 0.9, 0.92, 0.87, 0.12, 0, 0, 0, 0, 0.22, 0.07],
  [0, 0, 0.46, 0, 0, 0, 0, 0, 0.7, 0.93, 1, 1, 1, 0.61, 0, 0, 0, 0, 0.18, 0.11],
  [0, 0, 0.82, 0, 0, 0, 0, 0, 0.47, 1, 1, 0.98, 1, 0.96, 0.27, 0, 0, 0, 0.19, 0.1],
  [0, 0, 0.46, 0, 0, 0, 0, 0, 0.25, 1, 1, 0.84, 0.92, 0.97, 0.54, 0.14, 0.04, 0.1, 0.21, 0.05],
  [0, 0, 0, 0.4, 0, 0, 0, 0, 0.09, 0.8, 1, 0.82, 0.8, 0.85, 0.63, 0.31, 0.18, 0.19, 0.2, 0.01],
  [0, 0, 0, 0.36, 0.1, 0, 0, 0, 0.05, 0.54, 0.86, 0.79, 0.74, 0.72, 0.6, 0.39, 0.28, 0.24, 0.13, 0],
  [0, 0, 0, 0.01, 0.3, 0.07, 0, 0, 0.08, 0.36, 0.64, 0.7, 0.64, 0.6, 0.51, 0.39, 0.29, 0.19, 0.04, 0],
  [0, 0, 0, 0, 0.1, 0.24, 0.14, 0.1, 0.15, 0.29, 0.45, 0.53, 0.52, 0.46, 0.4, 0.31, 0.21, 0.08, 0, 0],
  [0, 0, 0, 0, 0, 0.08, 0.21, 0.21, 0.22, 0.29, 0.36, 0.39, 0.37, 0.33, 0.26, 0.18, 0.09, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0.03, 0.13, 0.19, 0.22, 0.24, 0.24, 0.23, 0.18, 0.13, 0.05, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0.02, 0.06, 0.08, 0.09, 0.07, 0.05, 0.01, 0, 0, 0, 0, 0],
];

/** A seed scene: a name for the panel, the growth settings it starts with and a way to fill a grid. */
export interface Scene {
  readonly name: string;
  readonly mu: number;
  readonly sigma: number;
  fill(world: Float32Array, width: number, height: number, seed: number): number;
}

/**
 * Stamp an Orbium centred at (cx, cy), keeping the brighter of the old and new state, turned by `turn` quarter turns
 * and mirrored when `flip` is set, so the creature can set off in any of eight directions.
 */
export function stampOrbium(world: Float32Array, width: number, height: number, cx: number, cy: number, turn: number, flip: boolean): void {
  const size = ORBIUM.length;
  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      const v = ORBIUM[r]?.[c] ?? 0;
      if (v === 0) continue;
      const fc = flip ? size - 1 - c : c;
      const quarter = ((turn % 4) + 4) % 4;
      const [dx, dy] = quarter === 0 ? [fc, r] : quarter === 1 ? [size - 1 - r, fc] : quarter === 2 ? [size - 1 - fc, size - 1 - r] : [r, size - 1 - fc];
      const x = (((Math.round(cx) + dx - size / 2) % width) + width) % width;
      const y = (((Math.round(cy) + dy - size / 2) % height) + height) % height;
      const i = y * width + x;
      world[i] = Math.max(world[i] ?? 0, v);
    }
  }
}

function lone(world: Float32Array, width: number, height: number, seed: number): number {
  const [t, next] = nextRandom(seed);
  stampOrbium(world, width, height, width / 2, height / 2, Math.floor(t * 4), t > 0.5);
  return next;
}

/**
 * A convoy: Orbia on a jittered lattice, one per 40-cell square, all facing the same way so they glide side by side
 * instead of colliding; a collision melts creatures into an amorphous mass.
 */
function flock(world: Float32Array, width: number, height: number, seed: number): number {
  const [t, first] = nextRandom(seed);
  let s = first;
  const cols = Math.max(1, Math.floor(width / 40));
  const rows = Math.max(1, Math.floor(height / 40));
  for (let k = 0; k < cols * rows; k += 1) {
    const [u, s1] = nextRandom(s);
    const [v, s2] = nextRandom(s1);
    s = s2;
    const cx = ((k % cols) + 0.35 + u * 0.3) * (width / cols);
    const cy = (Math.floor(k / cols) + 0.35 + v * 0.3) * (height / rows);
    stampOrbium(world, width, height, cx, cy, Math.floor(t * 4), t > 0.5);
  }
  return s;
}

/** Two Orbia on a collision course: they meet head on, and one swallows the other or both melt. */
function collision(world: Float32Array, width: number, height: number, seed: number): number {
  const gap = Math.min(24, width / 4);
  stampOrbium(world, width, height, width / 2 - gap, height / 2, 0, false);
  stampOrbium(world, width, height, width / 2 + gap, height / 2, 0, true);
  return nextRandom(seed)[1];
}

/**
 * A primordial soup: five discs of uniform noise. Under the soup's own growth settings most of it settles into a
 * slow coral, and now and then a disc condenses into a lone Orbium that glides away.
 */
function soup(world: Float32Array, width: number, height: number, seed: number): number {
  let s = seed;
  const radius = 12;
  for (let k = 0; k < 5; k += 1) {
    const [u, s1] = nextRandom(s);
    const [v, s2] = nextRandom(s1);
    s = s2;
    const cx = Math.floor(u * width);
    const cy = Math.floor(v * height);
    for (let dy = -radius; dy <= radius; dy += 1) {
      for (let dx = -radius; dx <= radius; dx += 1) {
        const [n, s3] = nextRandom(s);
        s = s3;
        if (Math.hypot(dx, dy) > radius) continue;
        const i = ((((cy + dy) % height) + height) % height) * width + ((((cx + dx) % width) + width) % width);
        world[i] = Math.min(1, (world[i] ?? 0) + n);
      }
    }
  }
  return s;
}

/** The scenes `s` cycles through. */
export const SCENES: readonly Scene[] = [
  { name: 'Orbium', mu: 0.15, sigma: 0.015, fill: lone },
  { name: 'Orbium convoy', mu: 0.15, sigma: 0.015, fill: flock },
  { name: 'Collision', mu: 0.15, sigma: 0.015, fill: collision },
  { name: 'Primordial soup', mu: 0.14, sigma: 0.016, fill: soup },
];
