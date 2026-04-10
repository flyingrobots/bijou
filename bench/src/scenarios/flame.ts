/**
 * Scenario: doom flame — oldschool fire effect.
 *
 * A classic demoscene flame: value noise seeds the floor, heat
 * propagates upward with random lateral drift and decay. Every cell
 * is painted every frame with smooth gradient interpolation between
 * palette stops. This is the "every cell changes every frame, each
 * with a unique color" worst case for the differ, and it looks
 * spectacular in the soak runner.
 *
 * Algorithm adapted from ertdfgcvb's play.ertdfgcvb.xyz doom flame.
 *
 * Exercises:
 * - Full-surface setRGB every frame (no unchanged cells)
 * - Per-cell smooth palette interpolation (hundreds of effective colors)
 * - Random propagation (Math.random for organic motion)
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

// Palette stops for smooth interpolation.
// Each stop is [r, g, b] at a normalized position along the heat range.
const STOPS: readonly { pos: number; r: number; g: number; b: number }[] = [
  { pos: 0.00, r: 0x00, g: 0x00, b: 0x00 }, // black
  { pos: 0.10, r: 0x30, g: 0x00, b: 0x30 }, // deep purple
  { pos: 0.25, r: 0x8b, g: 0x00, b: 0x00 }, // darkred
  { pos: 0.40, r: 0xff, g: 0x00, b: 0x00 }, // red
  { pos: 0.55, r: 0xff, g: 0x45, b: 0x00 }, // orangered
  { pos: 0.70, r: 0xff, g: 0xd7, b: 0x00 }, // gold
  { pos: 0.85, r: 0xff, g: 0xfa, b: 0xcd }, // lemonchiffon
  { pos: 1.00, r: 0xff, g: 0xff, b: 0xff }, // white
];

/** Lerp between palette stops for a smooth continuous gradient. */
function samplePalette(t: number): [number, number, number] {
  const clamped = Math.max(0, Math.min(1, t));
  // Find the two stops we're between.
  let lo = STOPS[0]!;
  let hi = STOPS[STOPS.length - 1]!;
  for (let i = 0; i < STOPS.length - 1; i++) {
    if (clamped >= STOPS[i]!.pos && clamped <= STOPS[i + 1]!.pos) {
      lo = STOPS[i]!;
      hi = STOPS[i + 1]!;
      break;
    }
  }
  const range = hi.pos - lo.pos;
  const f = range === 0 ? 0 : (clamped - lo.pos) / range;
  return [
    Math.round(lo.r + f * (hi.r - lo.r)),
    Math.round(lo.g + f * (hi.g - lo.g)),
    Math.round(lo.b + f * (hi.b - lo.b)),
  ];
}

// Block char for the fire. We use █ everywhere and let color do the work.
const BLOCK = 0x2588;

// Max heat value — higher = taller flames.
const MAX_HEAT = 50;

/**
 * Value noise generator with permutation table.
 * Adapted from Scratchapixel's procedural noise tutorial.
 */
function createValueNoise(): (px: number, py: number) => number {
  const tableSize = 256;
  const r = new Float64Array(tableSize);
  const perm = new Uint16Array(tableSize * 2);

  // Deterministic seed for reproducibility of the noise field shape.
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

export const flame: Scenario<State> = {
  id: 'flame',
  label: 'Flame: doom fire effect (220×58)',
  description:
    'Classic demoscene fire: value noise seeds the floor, heat propagates upward with random lateral drift and decay. Every cell painted every frame with smooth gradient interpolation via setRGB. Worst case for the differ — zero unchanged cells, hundreds of effective colors. Exercises setRGB, per-cell interpolation, and random access patterns.',
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
    const t = frameIndex * 0.002;

    // Seed the floor row with noise-driven heat.
    const last = cols * (rows - 1);
    for (let x = 0; x < cols; x++) {
      const val = noise(x * 0.04, t) * MAX_HEAT * 0.9 + MAX_HEAT * 0.1;
      heat[last + x] = Math.min(MAX_HEAT, Math.max(heat[last + x]!, val));
    }

    // Propagate upward: each cell pulls heat from below with random
    // lateral drift and decay. Math.random() gives organic motion.
    for (let y = 0; y < rows - 1; y++) {
      for (let x = 0; x < cols; x++) {
        const drift = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
        const srcX = Math.max(0, Math.min(cols - 1, x + drift));
        const srcY = y + 1;
        const decay = Math.random() * 1.8;
        heat[y * cols + x] = Math.max(0, heat[srcY * cols + srcX]! - decay);
      }
    }

    // Paint every cell: smooth palette interpolation from heat value.
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const h = heat[y * cols + x]!;
        const t = h / MAX_HEAT;
        const [r, g, b] = samplePalette(t);
        // Bg is a slightly darker version for depth.
        const bgF = 0.4;
        const bgR = Math.round(r * bgF);
        const bgG = Math.round(g * bgF);
        const bgB = Math.round(b * bgF);
        surface.setRGB(x, y, BLOCK, r, g, b, bgR, bgG, bgB);
      }
    }
  },

  getDisplaySurface(state) {
    return state.surface;
  },
};
