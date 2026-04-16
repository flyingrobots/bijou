/**
 * Scenario: dogfood-realistic — multi-region composition.
 *
 * Simulates one frame of a real TUI application: a header bar
 * across the top, a left sidebar, a main content region, and a
 * footer. Each region is painted with different theme tokens,
 * representing the kind of workload that components like boxes,
 * menus, and body text produce collectively.
 *
 * This is the cross-component regression gate for RE-017's
 * Part II work. Synthetic scenarios (`paint-set-hex-palette`,
 * `diff-gradient`, etc.) exercise one code path at a time;
 * `dogfood-realistic` exercises the composition.
 *
 * The scenario paints the entire frame each tick, and the diff
 * is against a fresh blank `current` surface — so every frame
 * is a full repaint. That's the "first frame after scroll"
 * worst case, not the steady-state. For steady-state, use
 * `diff-sparse` instead.
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


// Pre-defined theme palette for the four regions. Fixed bytes,
// no hex parsing at frame time.
const HEADER_FG: readonly [number, number, number] = [0xf2, 0xc5, 0x72];
const HEADER_BG: readonly [number, number, number] = [0x1b, 0x1d, 0x3a];
const SIDEBAR_FG: readonly [number, number, number] = [0xc8, 0xc7, 0xea];
const SIDEBAR_BG: readonly [number, number, number] = [0x11, 0x13, 0x20];
const BODY_FG: readonly [number, number, number]    = [0x9b, 0xa9, 0xff];
const BODY_BG: readonly [number, number, number]    = [0x17, 0x1a, 0x28];
const FOOTER_FG: readonly [number, number, number]  = [0x4b, 0x5d, 0x8a];
const FOOTER_BG: readonly [number, number, number]  = [0x10, 0x13, 0x1f];

const BLOCK = 0x2588;
const H_BAR = 0x2500; // ─
const V_BAR = 0x2502; // │

export const dogfoodRealistic: Scenario<State> = {
  id: 'dogfood-realistic',
  label: 'Dogfood-realistic: header+sidebar+body+footer (220×58)',
  tags: ['diff', 'compose', 'dogfood', 'realistic', 're017-gate'],
  description:
    'Multi-region composition simulating a real TUI frame: header bar (2 rows) + left sidebar (20 cols) + main body + footer bar (1 row). Each region painted with different theme bytes via setRGB. Cross-component regression gate. Full repaint per frame — worst-case scroll/resize shape, not steady-state.',
  columns: 220,
  rows: 58,
  defaultWarmupFrames: 30,
  defaultMeasureFrames: 120,

  setup(_ctx, columns = 220, rows = 58) {
    const cols = Math.max(22, columns); // sidebar (20) + divider + 1
    const rws = Math.max(4, rows);     // header (2) + footer (1) + 1
    const current = createSurface(cols, rws);
    const target = createSurface(cols, rws);
    if (!isPacked(current) || !isPacked(target)) {
      throw new Error('dogfood-realistic requires PackedSurfaces');
    }
    return { current, target, sink: createSink(), style: stubStyle, cols, rows: rws };
  },

  frame(state, frameIndex) {
    const { current, target, sink, style, cols, rows } = state;

    const headerRows = 2;
    const sidebarCols = 20;
    const footerRows = 1;
    const bodyStartX = sidebarCols + 1;
    const bodyStartY = headerRows + 1;
    const bodyEndY = rows - footerRows - 1;

    // Header bar (full width, top 2 rows)
    for (let x = 0; x < cols; x++) {
      target.setRGB(x, 0, H_BAR, HEADER_FG[0], HEADER_FG[1], HEADER_FG[2], HEADER_BG[0], HEADER_BG[1], HEADER_BG[2]);
      target.setRGB(x, 1, BLOCK, HEADER_FG[0], HEADER_FG[1], HEADER_FG[2], HEADER_BG[0], HEADER_BG[1], HEADER_BG[2]);
    }

    // Sidebar (left column group)
    for (let y = headerRows; y < rows - footerRows; y++) {
      for (let x = 0; x < sidebarCols; x++) {
        target.setRGB(x, y, BLOCK, SIDEBAR_FG[0], SIDEBAR_FG[1], SIDEBAR_FG[2], SIDEBAR_BG[0], SIDEBAR_BG[1], SIDEBAR_BG[2]);
      }
      // Vertical divider
      target.setRGB(sidebarCols, y, V_BAR, SIDEBAR_FG[0], SIDEBAR_FG[1], SIDEBAR_FG[2], BODY_BG[0], BODY_BG[1], BODY_BG[2]);
    }

    // Main body (right side)
    for (let y = bodyStartY; y <= bodyEndY; y++) {
      for (let x = bodyStartX; x < cols; x++) {
        // Simple animated body content
        const ch = ((x + y + frameIndex) % 8 === 0) ? BLOCK : 0x2592; // ▒
        target.setRGB(x, y, ch, BODY_FG[0], BODY_FG[1], BODY_FG[2], BODY_BG[0], BODY_BG[1], BODY_BG[2]);
      }
    }

    // Footer bar
    for (let x = 0; x < cols; x++) {
      target.setRGB(x, rows - 1, BLOCK, FOOTER_FG[0], FOOTER_FG[1], FOOTER_FG[2], FOOTER_BG[0], FOOTER_BG[1], FOOTER_BG[2]);
    }

    // Diff against the blank current surface (full repaint case).
    renderDiff(current, target, sink, style);
    // Model the runtime swap+clear: reset bitmaps so each frame
    // only carries the dirty bits we just set.
    target.markAllRenderClean();
    current.markAllRenderClean();
  },

  getDisplaySurface(state) {
    return state.target;
  },
};
