/**
 * Scenario: paint plain ASCII with no colors.
 *
 * The baseline "no hex parsing, no SGR" paint scenario. Every cell
 * is a plain char with no fg/bg. This should be the fastest possible
 * paint path and lets us isolate "how much does char encoding cost
 * on its own" from hex parsing and modifier encoding.
 *
 * If this scenario shows a large regression between pre-RE-008 and
 * post-RE-008, the regression is in the char encoding path
 * (encodeChar, encodeModifiers, or the byte-pack bookkeeping), not
 * in hex parsing.
 */

import { createSurface, type Surface } from '@flyingrobots/bijou';
import type { Scenario } from './types.js';

interface State {
  readonly surface: Surface;
  readonly cols: number;
  readonly rows: number;
}

export const paintAscii: Scenario<State> = {
  id: 'paint-ascii',
  label: 'Paint: plain ASCII, no colors (220×58)',
  description:
    'Fills every cell of a 220×58 surface with a plain ASCII char via surface.set({char}). No fg, no bg, no modifiers, no hex parsing. The baseline "how much does char encoding alone cost" measurement. Isolates the encodeChar path from hex parsing.',
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
    // Simple animated ASCII pattern
    const offset = frameIndex % 26;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const ch = String.fromCharCode(65 + ((x + y + offset) % 26));
        surface.set(x, y, { char: ch, empty: false });
      }
    }
  },

  getDisplaySurface(state) {
    return state.surface;
  },
};
