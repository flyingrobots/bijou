/**
 * Scenario: diff two surfaces with per-cell unique RGB.
 *
 * Paints a gradient into a target surface via setRGB, then runs
 * renderDiff against a blank current surface. This is the sgrCache
 * worst case on the diff side: every cell is different, every cell
 * has a unique style, so the cache saturates with thousands of
 * entries that each get used exactly once per frame.
 *
 * The paint step is outside the measurement if we only time the diff,
 * but for this scenario we intentionally time paint+diff together
 * because that is what a real frame looks like. To measure diff in
 * isolation later, we can add a variant that pre-builds the target
 * surface in setup() and only times renderDiff().
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
  readonly cols: number;
  readonly rows: number;
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

/**
 * Minimal StylePort stub. The packed differ bypasses StylePort for
 * the byte path, but the interface is still required. This stub
 * returns the input unchanged.
 */
const stubStyle: StylePort = {
  styled(_token: unknown, text: string): string {
    return text;
  },
} as unknown as StylePort;

const BLOCK = 0x2588;

export const diffGradient: Scenario<State> = {
  id: 'diff-gradient',
  label: 'Diff: per-cell unique RGB gradient (220×58)',
  description:
    'Paints a full-screen cosine-derived RGB gradient into a target surface via setRGB, then runs renderDiff against a fixed current surface. Every cell differs; every cell has a unique style. This is the sgrCache stress test. Measures paint + diff combined, which matches a real frame shape.',
  columns: 220,
  rows: 58,
  defaultWarmupFrames: 30,
  defaultMeasureFrames: 100,

  setup() {
    const current = createSurface(220, 58);
    const target = createSurface(220, 58);
    if (!isPacked(current) || !isPacked(target)) {
      throw new Error('diff-gradient requires PackedSurfaces');
    }
    return {
      current,
      target,
      sink: createSink(),
      style: stubStyle,
      cols: 220,
      rows: 58,
    };
  },

  frame(state, frameIndex) {
    const { current, target, sink, style, cols, rows } = state;
    const f = frameIndex * 0.05;
    // Paint the target surface
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const phase = (col + row * 0.5) * 0.08;
        const r1 = ((Math.cos(phase + f) + 1) * 127.5) | 0;
        const g1 = ((Math.cos(phase * 1.3 + f + 2) + 1) * 127.5) | 0;
        const b1 = ((Math.cos(phase * 0.7 + f + 4) + 1) * 127.5) | 0;
        const r2 = ((Math.cos(phase * 0.9 + f + 1) + 1) * 127.5) | 0;
        const g2 = ((Math.cos(phase * 1.1 + f + 3) + 1) * 127.5) | 0;
        const b2 = ((Math.cos(phase * 1.5 + f + 5) + 1) * 127.5) | 0;
        target.setRGB(col, row, BLOCK, r1, g1, b1, r2, g2, b2);
      }
    }
    // Run the diff
    renderDiff(current, target, sink, style);
  },

  getDisplaySurface(state) {
    return state.target;
  },
};
