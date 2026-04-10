/**
 * Scenario: diff two identical surfaces.
 *
 * Paints a full surface in setup(). Each frame, calls renderDiff
 * against the same-content surface. The differ should find no
 * changes and emit nothing.
 *
 * Pre-II-1 (current state): the differ still walks every cell
 * doing byte comparisons to discover there's nothing to emit.
 * This is the cost of the scan itself.
 *
 * Post-II-1 (render-dirty bitmap): the differ should skip the
 * scan entirely via `dirtyWords` and return in near-zero time.
 *
 * This scenario is the "floor" reference for II-1's optimization.
 */

import {
  createSurface,
  renderDiff,
  type PackedSurface,
  type StylePort,
} from '@flyingrobots/bijou';
import type { Scenario } from './types.js';
import { CountingSink, isPacked, createSink, stubStyle } from './_shared.js';

interface State {
  readonly current: PackedSurface;
  readonly target: PackedSurface;
  readonly sink: CountingSink;
  readonly style: StylePort;
  readonly cols: number;
  readonly rows: number;
}


const BLOCK = 0x2588;

export const diffStatic: Scenario<State> = {
  id: 'diff-static',
  label: 'Diff: identical surfaces, zero changes (220×58)',
  description:
    'Paints a full surface in setup() then calls renderDiff against itself every frame. No cells change. Measures the cost of the scan itself. Post-II-1 (render-dirty bitmap) this should drop to near-zero because no cells are dirty-marked. Reference baseline for measuring the II-1 optimization.',
  columns: 220,
  rows: 58,
  defaultWarmupFrames: 30,
  defaultMeasureFrames: 300,

  setup(_ctx, columns = 220, rows = 58) {
    const current = createSurface(columns, rows);
    const target = createSurface(columns, rows);
    if (!isPacked(current) || !isPacked(target)) {
      throw new Error('diff-static requires PackedSurfaces');
    }

    // Paint both surfaces identically.
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        const r = ((x + y) * 7) & 0xff;
        const g = ((x + y * 2) * 13) & 0xff;
        const b = ((x * 3 + y) * 5) & 0xff;
        current.setRGB(x, y, BLOCK, r, g, b, 0x11, 0x13, 0x20);
        target.setRGB(x, y, BLOCK, r, g, b, 0x11, 0x13, 0x20);
      }
    }

    return { current, target, sink: createSink(), style: stubStyle, cols: columns, rows };
  },

  frame(state, _frameIndex) {
    const { current, target, sink, style } = state;
    renderDiff(current, target, sink, style);
    // Model the runtime swap+clear pattern: between frames, the
    // back buffer's renderDirtyWords gets reset by clear(). Without
    // this, the bitmap stays full forever and the diff-static
    // early-out (II-1) never triggers. Bench scenarios that don't
    // call this measure the pre-II-1 cost.
    target.markAllRenderClean();
    current.markAllRenderClean();
  },

  getDisplaySurface(state) {
    return state.target;
  },
};
