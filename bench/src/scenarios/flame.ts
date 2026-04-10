/**
 * Scenario: doom flame — oldschool fire effect.
 *
 * A classic demoscene flame: value noise seeds the floor, heat
 * propagates upward with random lateral drift and decay. Every cell
 * is painted every frame with a full-color palette lookup. This is
 * the "every cell changes every frame, each with a unique-ish color"
 * worst case for the differ, and it looks spectacular in the soak
 * runner.
 *
 * Algorithm adapted from ertdfgcvb's play.ertdfgcvb.xyz doom flame.
 *
 * Exercises:
 * - Full-surface setRGB every frame (no unchanged cells)
 * - Per-cell palette lookup with fractional indexing
 * - Pseudo-random propagation (cache-unfriendly access patterns)
 * - Value noise evaluation per floor cell per frame
 */

import { createSurface, type PackedSurface } from '@flyingrobots/bijou';
import type { Scenario } from './types.js';
import { isPacked } from './_shared.js';

interface State {
  readonly surface: PackedSurface;
  readonly cols: number;
  readonly rows: number;
  readonly heat: Float64Array;
  readonly noise: (x: number, y: number) => number;
}

// Fire palette: black → purple → red → orange → gold → white.
// Each entry is [fgR, fgG, fgB, bgR, bgG, bgB].
const PALETTE: readonly (readonly [number, number, number, number, number, number])[] = [
  [0x00, 0x00, 0x00, 0x00, 0x00, 0x00], // 0 black
  [0x80, 0x00, 0x80, 0x20, 0x00, 0x20], // 1 purple
  [0x8b, 0x00, 0x00, 0x40, 0x00, 0x00], // 2 darkred
  [0xff, 0x00, 0x00, 0x8b, 0x00, 0x00], // 3 red
  [0xff, 0x45, 0x00, 0xcc, 0x20, 0x00], // 4 orangered
  [0xff, 0xd7, 0x00, 0xff, 0x8c, 0x00], // 5 gold
  [0xff, 0xfa, 0xcd, 0xff, 0xd7, 0x00], // 6 lemonchiffon
  [0xff, 0xff, 0xff, 0xff, 0xfa, 0xcd], // 7 white
];

// Flame column: maps heat intensity (0-25) to palette index (0-7).
// Lower indices = cooler (top of flame), higher = hotter (bottom).
const FLAME_MAP = [0, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 6, 6, 6, 6, 7];

// Fire display chars: blocks and shades for visual texture.
const FIRE_CHARS = [0x20, 0x2591, 0x2592, 0x2593, 0x2588, 0x2588, 0x2588, 0x2588]; // ' ░▒▓████'

/**
 * Value noise generator with permutation table.
 * Adapted from Scratchapixel's procedural noise tutorial.
 */
function createValueNoise(): (px: number, py: number) => number {
  const tableSize = 256;
  const r = new Float64Array(tableSize);
  const perm = new Uint16Array(tableSize * 2);

  // Deterministic seed for reproducibility across runs.
  let seed = 42;
  function rng(): number {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) / 0x100000000;
  }

  for (let k = 0; k < tableSize; k++) {
    r[k] = rng();
    perm[k] = k;
  }
  for (let k = tableSize - 1; k > 0; k--) {
    const i = (rng() * (k + 1)) | 0;
    const tmp = perm[k]!;
    perm[k] = perm[i]!;
    perm[i] = tmp;
    perm[k + tableSize] = perm[k]!;
  }
  perm[tableSize] = perm[0]!;

  return function noise(px: number, py: number): number {
    const xi = Math.floor(px);
    const yi = Math.floor(py);
    const tx = px - xi;
    const ty = py - yi;

    const rx0 = ((xi % tableSize) + tableSize) % tableSize;
    const rx1 = (rx0 + 1) % tableSize;
    const ry0 = ((yi % tableSize) + tableSize) % tableSize;
    const ry1 = (ry0 + 1) % tableSize;

    const c00 = r[perm[perm[rx0]! + ry0]!]!;
    const c10 = r[perm[perm[rx1]! + ry0]!]!;
    const c01 = r[perm[perm[rx0]! + ry1]!]!;
    const c11 = r[perm[perm[rx1]! + ry1]!]!;

    // Smoothstep interpolation.
    const sx = tx * tx * (3 - 2 * tx);
    const sy = ty * ty * (3 - 2 * ty);

    const nx0 = c00 + sx * (c10 - c00);
    const nx1 = c01 + sx * (c11 - c01);
    return nx0 + sy * (nx1 - nx0);
  };
}

/** Deterministic pseudo-random int in [a, b] inclusive, seeded by position. */
function rndi(a: number, b: number, seed: number): number {
  if (a > b) { const t = a; a = b; b = t; }
  const s = ((seed * 1664525 + 1013904223) & 0x7fffffff) / 0x80000000;
  return Math.floor(a + s * (b - a + 1));
}

export const flame: Scenario<State> = {
  id: 'flame',
  label: 'Flame: doom fire effect (220×58)',
  description:
    'Classic demoscene fire: value noise seeds the floor, heat propagates upward with random lateral drift and decay. Every cell painted every frame with palette lookup via setRGB. Worst case for the differ — zero unchanged cells, visually rich color distribution. Exercises setRGB, per-cell palette lookup, and pseudo-random access patterns.',
  columns: 220,
  rows: 58,
  defaultWarmupFrames: 30,
  defaultMeasureFrames: 200,

  setup(_ctx, columns = 220, rows = 58) {
    const surface = createSurface(columns, rows);
    if (!isPacked(surface)) {
      throw new Error('flame requires a PackedSurface');
    }
    return {
      surface,
      cols: columns,
      rows,
      heat: new Float64Array(columns * rows),
      noise: createValueNoise(),
    };
  },

  frame(state, frameIndex) {
    const { surface, cols, rows, heat, noise } = state;
    const t = frameIndex * 0.0015;

    // Seed the floor row with noise-driven heat.
    const last = cols * (rows - 1);
    for (let x = 0; x < cols; x++) {
      const val = Math.floor(noise(x * 0.05, t) * 45 + 5);
      heat[last + x] = Math.min(val, heat[last + x]! + 2);
    }

    // Propagate upward: each cell pulls heat from below with lateral drift and decay.
    for (let y = 0; y < rows - 1; y++) {
      for (let x = 0; x < cols; x++) {
        const drift = rndi(-1, 1, x * 7 + y * 13 + frameIndex * 3);
        const srcX = Math.max(0, Math.min(cols - 1, x + drift));
        const srcY = y + 1;
        const decay = rndi(0, 2, x * 11 + y * 17 + frameIndex * 7);
        heat[y * cols + x] = Math.max(0, heat[srcY * cols + srcX]! - decay);
      }
    }

    // Paint every cell based on heat value.
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const h = heat[y * cols + x]!;
        const idx = Math.min(FLAME_MAP.length - 1, Math.max(0, Math.round(h)));
        const paletteIdx = FLAME_MAP[idx]!;
        const [fgR, fgG, fgB, bgR, bgG, bgB] = PALETTE[paletteIdx]!;
        const ch = FIRE_CHARS[paletteIdx]!;
        surface.setRGB(x, y, ch, fgR, fgG, fgB, bgR, bgG, bgB);
      }
    }
  },

  getDisplaySurface(state) {
    return state.surface;
  },
};
