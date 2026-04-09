/**
 * Scenario: paint with a rotating theme palette via surface.set().
 *
 * Exercises the legacy `surface.set({char, fg, bg})` path that most
 * components still use. Every set() call hex-parses the fg and bg
 * strings inline. This is the hypothesized hot path for the broad
 * RE-008 regression.
 *
 * The palette has ~5 colors rotating by (x + y + frame) % palette.length,
 * so the number of unique styles per frame is tiny (bounded by the
 * palette size) but every cell is a set() call.
 */

import { createSurface, type Surface } from '@flyingrobots/bijou';
import type { Scenario } from './types.js';

interface State {
  readonly surface: Surface;
  readonly cols: number;
  readonly rows: number;
}

const PALETTE_FG = ['#9ba9ff', '#c8c7ea', '#f4c389', '#f67f65', '#f2c572'];
const PALETTE_BG = ['#111320', '#151927', '#181d2d'];

export const paintThemeSet: Scenario<State> = {
  id: 'paint-theme-set',
  label: 'Paint: rotating theme palette via surface.set (220×58)',
  description:
    'Fills every cell of a 220×58 surface with a foreground + background picked from small rotating palettes, using the legacy surface.set({char, fg, bg}) API that hex-parses the colors inline. Unique style count per frame is ~15, but every cell pays the hex parse cost. Designed to measure the impact of inlineHexRGB on the paint path.',
  columns: 220,
  rows: 58,
  defaultWarmupFrames: 30,
  defaultMeasureFrames: 200,

  setup() {
    return {
      surface: createSurface(220, 58),
      cols: 220,
      rows: 58,
    };
  },

  frame(state, frameIndex) {
    const { surface, cols, rows } = state;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const fg = PALETTE_FG[(x + y + frameIndex) % PALETTE_FG.length]!;
        const bg = PALETTE_BG[(x + y * 2) % PALETTE_BG.length]!;
        surface.set(x, y, { char: '█', fg, bg, empty: false });
      }
    }
  },

  getDisplaySurface(state) {
    return state.surface;
  },
};
