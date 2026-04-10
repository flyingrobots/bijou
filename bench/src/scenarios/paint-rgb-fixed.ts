/**
 * Scenario: paint every cell with a FIXED RGB value via setRGB.
 *
 * No math, no animation, no hex parsing. The same 6 constant RGB
 * bytes go into every cell. This is the purest possible measurement
 * of the setRGB path cost — just the byte-pack write, nothing else.
 *
 * Compared against `paint-theme-set` (same painting, but via
 * `surface.set({fg, bg})` with hex strings), the delta is the cost
 * of hex parsing + char encoding + modifier encoding in the
 * legacy set() path.
 *
 * Compared against `paint-ascii` (same painting, but no colors at
 * all), the delta is the cost of writing RGB bytes.
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

export const paintRgbFixed: Scenario<State> = {
  id: 'paint-rgb-fixed',
  label: 'Paint: fixed RGB via setRGB, no math (220×58)',
  description:
    'Fills every cell of a 220×58 surface with a constant RGB fg + bg via setRGB(). No math, no animation, no hex parsing. The purest measurement of the setRGB byte-pack path. Compare against paint-theme-set for the hex-parse overhead, and against paint-ascii for the color-write overhead alone.',
  columns: 220,
  rows: 58,
  defaultWarmupFrames: 30,
  defaultMeasureFrames: 200,

  setup() {
    const surface = createSurface(220, 58);
    if (!isPacked(surface)) {
      throw new Error('paint-rgb-fixed requires a PackedSurface');
    }
    return { surface, cols: 220, rows: 58 };
  },

  frame(state, _frameIndex) {
    const { surface, cols, rows } = state;
    // Fixed bytes. Matches a theme token like '#9ba9ff' on '#111320'.
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        surface.setRGB(col, row, BLOCK, 0x9b, 0xa9, 0xff, 0x11, 0x13, 0x20);
      }
    }
  },

  getDisplaySurface(state) {
    return state.surface;
  },
};
