/**
 * Scenario: diff with ~10% dirty cells per frame.
 *
 * The most realistic representation of a real TUI frame. A full
 * surface is painted once in setup(). Each frame, a 10% slice of
 * cells is mutated with new theme-driven content, and renderDiff
 * runs against the prior surface.
 *
 * This is the common case: users interact with an app, a small
 * region updates (a cursor moves, a progress bar advances, a
 * notification appears). Most cells are unchanged. The differ
 * should emit bytes only for the changed cells.
 *
 * Expected behavior:
 * - Pre-II-1: walks every cell with byte compare, emits for the
 *   ~1,280 dirty cells. Most time in the scan.
 * - Post-II-1 (render-dirty bitmap): walks only the ~1,280
 *   marked cells. Big speedup on this scenario.
 * - Post-II-4 (byte pipeline): no string allocation per frame.
 */

import {
  createSurface,
  renderDiff,
  type PackedSurface,
  type StylePort,
} from '@flyingrobots/bijou';
import type { Scenario } from './types.js';
import { type CountingSink, isPacked, createSink, stubStyle } from './_shared.js';

interface State {
  readonly current: PackedSurface;
  readonly target: PackedSurface;
  readonly sink: CountingSink;
  readonly style: StylePort;
  readonly cols: number;
  readonly rows: number;
  readonly dirtyIndices: readonly number[];
}

const BLOCK = 0x2588;
const PALETTE: readonly [number, number, number][] = [
  [0x9b, 0xa9, 0xff],
  [0xc8, 0xc7, 0xea],
  [0xf4, 0xc3, 0x89],
  [0xf6, 0x7f, 0x65],
  [0xf2, 0xc5, 0x72],
];

export const diffSparse: Scenario<State> = {
  id: 'diff-sparse',
  label: 'Diff: sparse ~10% dirty (220×58)',
  tags: ['diff', 'sparse-diff', 'partial-update', 'interactive'],
  description:
    'Most realistic representation of a real TUI frame. A full surface is painted in setup. Each frame, ~10% of cells (pseudo-random but deterministic by position + frame index) are re-written with new theme-driven content, and renderDiff runs against the prior current surface. Targets the common case of partial interactive updates.',
  columns: 220,
  rows: 58,
  defaultWarmupFrames: 30,
  defaultMeasureFrames: 150,

  setup(_ctx, columns = 220, rows = 58) {
    const current = createSurface(columns, rows);
    const target = createSurface(columns, rows);
    if (!isPacked(current) || !isPacked(target)) {
      throw new Error('diff-sparse requires PackedSurfaces');
    }

    // Paint a base pattern into BOTH surfaces so they start matching.
    const cols = columns;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const [r, g, b] = PALETTE[(x + y) % PALETTE.length]!;
        current.setRGB(x, y, BLOCK, r, g, b, 0x11, 0x13, 0x20);
        target.setRGB(x, y, BLOCK, r, g, b, 0x11, 0x13, 0x20);
      }
    }

    // Pre-compute the 10% set of cell indices that will be dirtied
    // each frame. Deterministic so every sample sees the same work.
    const total = cols * rows;
    const dirtyCount = total > 0 ? Math.max(1, Math.floor(total * 0.10)) : 0;
    const dirtyIndices: number[] = [];
    // Distribute them evenly across the surface using a stride.
    const stride = Math.floor(total / dirtyCount);
    for (let i = 0; i < dirtyCount; i++) {
      dirtyIndices.push((i * stride) % total);
    }

    return { current, target, sink: createSink(), style: stubStyle, cols, rows, dirtyIndices };
  },

  frame(state, frameIndex) {
    const { current, target, sink, style, cols, dirtyIndices } = state;

    // Mutate the ~10% dirty cells with a new theme-driven color.
    // Animation via frame index so cells actually change between frames.
    const phase = frameIndex % PALETTE.length;
    for (let i = 0; i < dirtyIndices.length; i++) {
      const idx = dirtyIndices[i]!;
      const x = idx % cols;
      const y = (idx / cols) | 0;
      const [r, g, b] = PALETTE[(i + phase) % PALETTE.length]!;
      target.setRGB(x, y, BLOCK, r, g, b, 0x11, 0x13, 0x20);
    }

    // Diff target against current.
    renderDiff(current, target, sink, style);

    // Model the runtime swap+clear pattern: reset both bitmaps so
    // the next frame's diff sees only the cells we mutate this
    // frame, not the accumulation of every cell ever touched.
    // Without this, the bitmap saturates over time and the II-1
    // dirty-skip win disappears.
    target.markAllRenderClean();
    current.markAllRenderClean();
  },

  getDisplaySurface(state) {
    return state.target;
  },
};
