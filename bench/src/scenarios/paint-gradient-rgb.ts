/**
 * Scenario: per-cell unique RGB via setRGB, full screen.
 *
 * Exercises the worst case for the packed differ's sgrCache: every
 * cell has a unique fg + bg combination, so the SGR sequence for each
 * cell cannot be reused across cells. In real apps this is rare, but
 * it is the stress test that originally surfaced the RE-008 perf
 * regression in the gradient mode of the perf-gradient example.
 *
 * Uses `setRGB` directly — no hex string parsing — so this scenario
 * measures the pure byte-pack paint cost plus whatever the differ
 * is doing with the resulting cells.
 */

import { createSurface, type PackedSurface } from '@flyingrobots/bijou';
import type { Scenario } from './types.js';
import { isPacked } from './_shared.js';

interface State {
  readonly surface: PackedSurface;
  readonly cols: number;
  readonly rows: number;
}


const BLOCK = 0x2588; // █

export const paintGradientRgb: Scenario<State> = {
  id: 'paint-gradient-rgb',
  label: 'Paint: per-cell unique RGB via setRGB (220×58)',
  description:
    'Fills every cell of a 220×58 surface with a cosine-derived RGB foreground and background via setRGB(). No string hex parsing. Designed to stress the packed-cell paint path and, downstream, the sgrCache worst case in the differ. In real apps the unique-style count saturates at ~30-50; here it is ~12,760 per frame.',
  columns: 220,
  rows: 58,
  defaultWarmupFrames: 30,
  defaultMeasureFrames: 200,

  setup(_ctx, columns = 220, rows = 58) {
    const surface = createSurface(columns, rows);
    if (!isPacked(surface)) {
      throw new Error('paint-gradient-rgb requires a PackedSurface');
    }
    return { surface, cols: columns, rows };
  },

  frame(state, frameIndex) {
    const { surface, cols, rows } = state;
    const f = frameIndex * 0.05;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const phase = (col + row * 0.5) * 0.08;
        const r1 = Math.max(0, Math.min(255, ((Math.cos(phase + f) + 1) * 127.5) | 0));
        const g1 = Math.max(0, Math.min(255, ((Math.cos(phase * 1.3 + f + 2) + 1) * 127.5) | 0));
        const b1 = Math.max(0, Math.min(255, ((Math.cos(phase * 0.7 + f + 4) + 1) * 127.5) | 0));
        const r2 = Math.max(0, Math.min(255, ((Math.cos(phase * 0.9 + f + 1) + 1) * 127.5) | 0));
        const g2 = Math.max(0, Math.min(255, ((Math.cos(phase * 1.1 + f + 3) + 1) * 127.5) | 0));
        const b2 = Math.max(0, Math.min(255, ((Math.cos(phase * 1.5 + f + 5) + 1) * 127.5) | 0));
        surface.setRGB(col, row, BLOCK, r1, g1, b1, r2, g2, b2);
      }
    }
  },

  getDisplaySurface(state) {
    return state.surface;
  },
};
