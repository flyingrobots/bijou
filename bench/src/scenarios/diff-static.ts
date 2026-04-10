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
  type WritePort,
  type Surface,
} from '@flyingrobots/bijou';
import type { Scenario } from './types.js';

interface State {
  readonly current: PackedSurface;
  readonly target: PackedSurface;
  readonly sink: CountingSink;
  readonly style: StylePort;
}

interface CountingSink extends WritePort {
  writes: number;
  bytesWritten: number;
}

function isPacked(s: Surface): s is PackedSurface {
  return 'buffer' in (s as { buffer?: unknown }) && (s as { buffer?: unknown }).buffer instanceof Uint8Array;
}

function createSink(): CountingSink {
  return {
    writes: 0,
    bytesWritten: 0,
    write(text: string) {
      this.writes += 1;
      this.bytesWritten += text.length;
    },
    writeBytes(_buf: Uint8Array, len: number) {
      this.writes += 1;
      this.bytesWritten += len;
    },
    writeError() {},
  };
}

const stubStyle: StylePort = {
  styled(_token: unknown, text: string): string {
    return text;
  },
} as unknown as StylePort;

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

  setup() {
    const current = createSurface(220, 58);
    const target = createSurface(220, 58);
    if (!isPacked(current) || !isPacked(target)) {
      throw new Error('diff-static requires PackedSurfaces');
    }

    // Paint both surfaces identically.
    for (let y = 0; y < 58; y++) {
      for (let x = 0; x < 220; x++) {
        const r = ((x + y) * 7) & 0xff;
        const g = ((x + y * 2) * 13) & 0xff;
        const b = ((x * 3 + y) * 5) & 0xff;
        current.setRGB(x, y, BLOCK, r, g, b, 0x11, 0x13, 0x20);
        target.setRGB(x, y, BLOCK, r, g, b, 0x11, 0x13, 0x20);
      }
    }

    return { current, target, sink: createSink(), style: stubStyle };
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
