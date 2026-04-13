/**
 * Scenario: soak — 1000-frame stability test.
 *
 * Exercises the differ over many frames with a realistic multi-region
 * workload. Each frame mutates ~15-20% of cells with rotating hotspots
 * across header / sidebar / body / footer regions. Every 100 frames a
 * simulated "resize" clears both surfaces and repaints from scratch.
 *
 * Designed to surface:
 * - Memory leaks (growing buffers, uncollected garbage)
 * - Performance degradation over time (cache pollution, buffer bloat)
 * - Frame-time stability (is frame 900 as fast as frame 10?)
 *
 * The high frame count (1000 measurement frames) means this scenario
 * runs slower than others (~20-30s). Use --scenario=soak explicitly.
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
}

// Region palette — matches dogfood-realistic for comparability.
const HEADER_FG: readonly [number, number, number] = [0xf2, 0xc5, 0x72];
const HEADER_BG: readonly [number, number, number] = [0x1b, 0x1d, 0x3a];
const SIDEBAR_FG: readonly [number, number, number] = [0xc8, 0xc7, 0xea];
const SIDEBAR_BG: readonly [number, number, number] = [0x11, 0x13, 0x20];
const BODY_FG: readonly [number, number, number]    = [0x9b, 0xa9, 0xff];
const BODY_BG: readonly [number, number, number]    = [0x17, 0x1a, 0x28];
const FOOTER_FG: readonly [number, number, number]  = [0x4b, 0x5d, 0x8a];
const FOOTER_BG: readonly [number, number, number]  = [0x10, 0x13, 0x1f];

const BLOCK = 0x2588;
const H_BAR = 0x2500;
const V_BAR = 0x2502;
const SHADE = 0x2592;

const COLS = 220;
const ROWS = 58;
const HEADER_ROWS = 2;
const SIDEBAR_COLS = 20;
const FOOTER_ROWS = 1;

/**
 * Paint the full base layout into a surface. Used on setup and on
 * simulated resize events.
 */
function paintBase(target: PackedSurface, cols: number, rows: number): void {
  // Header
  for (let x = 0; x < cols; x++) {
    target.setRGB(x, 0, H_BAR, HEADER_FG[0], HEADER_FG[1], HEADER_FG[2], HEADER_BG[0], HEADER_BG[1], HEADER_BG[2]);
    target.setRGB(x, 1, BLOCK, HEADER_FG[0], HEADER_FG[1], HEADER_FG[2], HEADER_BG[0], HEADER_BG[1], HEADER_BG[2]);
  }
  // Sidebar + divider
  for (let y = HEADER_ROWS; y < rows - FOOTER_ROWS; y++) {
    for (let x = 0; x < SIDEBAR_COLS; x++) {
      target.setRGB(x, y, BLOCK, SIDEBAR_FG[0], SIDEBAR_FG[1], SIDEBAR_FG[2], SIDEBAR_BG[0], SIDEBAR_BG[1], SIDEBAR_BG[2]);
    }
    target.setRGB(SIDEBAR_COLS, y, V_BAR, SIDEBAR_FG[0], SIDEBAR_FG[1], SIDEBAR_FG[2], BODY_BG[0], BODY_BG[1], BODY_BG[2]);
  }
  // Body
  const bodyStartX = SIDEBAR_COLS + 1;
  const bodyEndY = rows - FOOTER_ROWS - 1;
  for (let y = HEADER_ROWS + 1; y <= bodyEndY; y++) {
    for (let x = bodyStartX; x < cols; x++) {
      target.setRGB(x, y, SHADE, BODY_FG[0], BODY_FG[1], BODY_FG[2], BODY_BG[0], BODY_BG[1], BODY_BG[2]);
    }
  }
  // Footer
  for (let x = 0; x < cols; x++) {
    target.setRGB(x, rows - 1, BLOCK, FOOTER_FG[0], FOOTER_FG[1], FOOTER_FG[2], FOOTER_BG[0], FOOTER_BG[1], FOOTER_BG[2]);
  }
}

export const soak: Scenario<State> = {
  id: 'soak',
  label: 'Soak: 1000-frame stability (220×58)',
  tags: ['diff', 'compose', 'soak', 'nightly', 'long-run'],
  description:
    'Multi-region composition with rotating partial updates (~15-20% dirty/frame) over 1000 measurement frames. Cycles header/sidebar/body/footer hotspots. Simulates a resize clear+repaint every 100 frames. Designed to surface memory leaks, cache pollution, and frame-time degradation.',
  columns: COLS,
  rows: ROWS,
  defaultWarmupFrames: 50,
  defaultMeasureFrames: 1000,

  setup(_ctx, columns = COLS, rows = ROWS) {
    const current = createSurface(columns, rows);
    const target = createSurface(columns, rows);
    if (!isPacked(current) || !isPacked(target)) {
      throw new Error('soak requires PackedSurfaces');
    }
    // Paint the initial base layout into both surfaces so the first
    // frame diff starts from a realistic "already rendered" state.
    paintBase(target, columns, rows);
    paintBase(current, columns, rows);
    target.markAllRenderClean();
    current.markAllRenderClean();
    return { current, target, sink: createSink(), style: stubStyle, cols: columns, rows };
  },

  frame(state, frameIndex) {
    const { current, target, sink, style, cols, rows } = state;

    // Every 100 frames, simulate a resize: clear both surfaces and
    // repaint from scratch. This tests buffer reallocation paths and
    // ensures the differ handles the "everything changed" case cleanly
    // under sustained load.
    if (frameIndex > 0 && frameIndex % 100 === 0) {
      target.clear();
      current.clear();
      paintBase(target, cols, rows);
      renderDiff(current, target, sink, style);
      target.markAllRenderClean();
      current.markAllRenderClean();
      return;
    }

    // Rotate the "hot" region: 0=header, 1=sidebar, 2=body, 3=footer.
    // The hot region gets ~40% cell mutation; others get ~5%.
    const hotRegion = frameIndex % 4;
    const phase = frameIndex % 8;

    // Header mutations
    const headerDensity = hotRegion === 0 ? 0.4 : 0.05;
    for (let x = 0; x < cols; x++) {
      if (((x * 7 + frameIndex * 3) % 100) < headerDensity * 100) {
        const ch = phase < 4 ? H_BAR : BLOCK;
        target.setRGB(x, 0, ch, HEADER_FG[0], HEADER_FG[1], HEADER_FG[2], HEADER_BG[0], HEADER_BG[1], HEADER_BG[2]);
      }
    }

    // Sidebar mutations
    const sidebarDensity = hotRegion === 1 ? 0.4 : 0.05;
    for (let y = HEADER_ROWS; y < rows - FOOTER_ROWS; y++) {
      for (let x = 0; x < SIDEBAR_COLS; x++) {
        if (((x * 11 + y * 7 + frameIndex * 5) % 100) < sidebarDensity * 100) {
          const ch = ((x + y + phase) % 3 === 0) ? V_BAR : BLOCK;
          target.setRGB(x, y, ch, SIDEBAR_FG[0], SIDEBAR_FG[1], SIDEBAR_FG[2], SIDEBAR_BG[0], SIDEBAR_BG[1], SIDEBAR_BG[2]);
        }
      }
    }

    // Body mutations — the largest region, most realistic
    const bodyDensity = hotRegion === 2 ? 0.4 : 0.05;
    const bodyStartX = SIDEBAR_COLS + 1;
    const bodyEndY = rows - FOOTER_ROWS - 1;
    for (let y = HEADER_ROWS + 1; y <= bodyEndY; y++) {
      for (let x = bodyStartX; x < cols; x++) {
        if (((x * 13 + y * 11 + frameIndex * 7) % 100) < bodyDensity * 100) {
          const ch = ((x + y + phase) % 5 === 0) ? BLOCK : SHADE;
          target.setRGB(x, y, ch, BODY_FG[0], BODY_FG[1], BODY_FG[2], BODY_BG[0], BODY_BG[1], BODY_BG[2]);
        }
      }
    }

    // Footer mutations
    const footerDensity = hotRegion === 3 ? 0.4 : 0.05;
    for (let x = 0; x < cols; x++) {
      if (((x * 17 + frameIndex * 11) % 100) < footerDensity * 100) {
        target.setRGB(x, rows - 1, BLOCK, FOOTER_FG[0], FOOTER_FG[1], FOOTER_FG[2], FOOTER_BG[0], FOOTER_BG[1], FOOTER_BG[2]);
      }
    }

    // Diff + swap model
    renderDiff(current, target, sink, style);
    target.markAllRenderClean();
    current.markAllRenderClean();
  },

  getDisplaySurface(state) {
    return state.target;
  },
};
