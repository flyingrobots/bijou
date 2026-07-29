/**
 * Scenario: doom flame — oldschool fire effect.
 *
 * Value noise seeds the floor, heat propagates upward with random
 * drift and decay, and every cell gets a smooth palette color.
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
import { createFlameNoise, sampleFlamePalette } from './flame-field.js';

interface State {
  readonly surface: PackedSurface;
  readonly cols: number;
  readonly rows: number;
  readonly heat: Float64Array;
  readonly noise: (x: number, y: number) => number;
}

/** Background brightness factor for depth effect. */
const BG_FACTOR = 0.4;

// Block char for the fire. We use █ everywhere and let color do the work.
const BLOCK = 0x2588;

// Max heat value — higher = taller flames.
const MAX_HEAT = 50;

export const flame: Scenario<State> = {
  id: 'flame',
  label: 'Flame: doom fire effect (220×58)',
  tags: ['paint', 'setRGB', 'gradient', 'dense-diff', 'noise'],
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
      noise: createFlameNoise(),
    };
  },

  frame(state, frameIndex) {
    const { surface, cols, rows, heat, noise } = state;
    const t = frameIndex * 0.002;

    // Seed the floor row with noise-driven heat.
    const last = cols * (rows - 1);
    for (let x = 0; x < cols; x++) {
      const val = noise(x * 0.04, t) * MAX_HEAT * 0.9 + MAX_HEAT * 0.1;
      heat[last + x] = Math.min(MAX_HEAT, Math.max(heat[last + x] ?? 0, val));
    }

    // Propagate upward: each cell pulls heat from below with random
    // lateral drift and decay. Math.random() gives organic motion.
    for (let y = 0; y < rows - 1; y++) {
      for (let x = 0; x < cols; x++) {
        const drift = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
        const srcX = Math.max(0, Math.min(cols - 1, x + drift));
        const srcY = y + 1;
        const decay = Math.random() * 1.8;
        heat[y * cols + x] = Math.max(
          0,
          (heat[srcY * cols + srcX] ?? 0) - decay,
        );
      }
    }

    // Paint every cell: smooth palette interpolation from heat value.
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const h = heat[y * cols + x] ?? 0;
        const heatNorm = h / MAX_HEAT;
        const [r, g, b] = sampleFlamePalette(heatNorm);
        const bgR = Math.round(r * BG_FACTOR);
        const bgG = Math.round(g * BG_FACTOR);
        const bgB = Math.round(b * BG_FACTOR);
        surface.setRGB(x, y, BLOCK, r, g, b, bgR, bgG, bgB);
      }
    }
  },

  getDisplaySurface(state) {
    return state.surface;
  },
};
