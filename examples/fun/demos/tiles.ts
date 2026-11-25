// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// After "033 Directional Tiles" by Saneef Ansari (Observable): a grid of square
// tiles, each a fan of wedges blending ink into paper, turned by a noise field.
import { createSurface } from '@flyingrobots/bijou';
import { defineDemo, type Demo } from '../contract.js';
import { stampPanel } from '../panel.js';
import { nextRandom } from '../random.js';
import { createNoise3 } from './noise.js';
import { INKS, PAPERS } from './palettes.js';
import { contrast, hex, mix, paintPixels, type Rgb } from './pixels.js';

export interface TilesState {
  readonly seed: number;
  readonly cells: number;
  readonly segments: number;
  readonly ink: string;
  readonly paper: string;
  readonly hideUI: boolean;
}

const MIN_CELLS = 2;
const MAX_CELLS = 12;
const TAU = Math.PI * 2;
/** The original's margin slider default: half of a third of the shorter side. */
const MARGIN = 0.5 / 3;
/** How fast the noise field drifts, in noise units per second. */
const DRIFT = 0.08;

/** A new composition from the seed: an ink, a paper it reads against, a cell count and a segment count. */
export function roll(seed: number, hideUI = false): TilesState {
  const [a, s1] = nextRandom(seed);
  const [b, s2] = nextRandom(s1);
  const [c, s3] = nextRandom(s2);
  const [d, s4] = nextRandom(s3);
  const ink = INKS[Math.floor(a * INKS.length)] ?? '#0078bf';
  const offset = Math.floor(b * PAPERS.length);
  const papers = PAPERS.map((_, i) => PAPERS[(i + offset) % PAPERS.length] ?? '#f8f3e8');
  const paper = papers.find((p) => contrast(hex(ink), hex(p)) > 4.5) ?? papers[0] ?? '#f8f3e8';
  return {
    seed: s4, ink, paper, hideUI,
    cells: MIN_CELLS + 1 + Math.floor(c * 6),
    segments: 6 + Math.floor(d * 18),
  };
}

/** The colour of picture pixel (x, y) in a w by h picture at time t. */
export function tilesPixel(state: TilesState, noise: (x: number, y: number, z: number) => number, w: number, h: number, t: number) {
  const paper = hex(state.paper);
  const ink = hex(state.ink);
  const colours: Rgb[] = Array.from({ length: state.segments }, (_, i) => mix(ink, paper, state.segments === 1 ? 0 : i / (state.segments - 1)));
  const shorter = Math.min(w, h);
  const size = shorter - 2 * MARGIN * shorter;
  const left = (w - size) / 2;
  const top = (h - size) / 2;
  const cell = size / state.cells;
  const step = TAU / state.segments;
  const angles = Array.from({ length: state.cells * state.cells }, (_, k) => {
    const u = state.cells === 1 ? 0 : (k % state.cells) / (state.cells - 1);
    const v = state.cells === 1 ? 0 : Math.floor(k / state.cells) / (state.cells - 1);
    return TAU * noise(u, v, t * DRIFT);
  });
  return (x: number, y: number): Rgb => {
    const gx = Math.floor((x - left) / cell);
    const gy = Math.floor((y - top) / cell);
    if (gx < 0 || gy < 0 || gx >= state.cells || gy >= state.cells) return paper;
    const dx = x - (left + (gx + 0.5) * cell);
    const dy = y - (top + (gy + 0.5) * cell);
    const turned = Math.atan2(dy, dx) - (angles[gy * state.cells + gx] ?? 0);
    const wedge = Math.floor((((turned % TAU) + TAU) % TAU) / step);
    return colours[Math.min(state.segments - 1, wedge)] ?? paper;
  };
}

export const tiles: Demo<TilesState> = {
  id: 'directional-tiles',
  name: 'Directional Tiles',
  description: 'Fans of ink-to-paper wedges in a grid, turned by a drifting noise field, after Saneef Ansari',
  keys: 'r new composition, + and - cells, h hides the panel, space pause',
  init: (seed) => roll(seed),
  update(msg, state) {
    if (msg.type !== 'key') return state;
    if (msg.key === 'r') return roll(state.seed, state.hideUI);
    if (msg.key === '+' || msg.key === '=') return { ...state, cells: Math.min(MAX_CELLS, state.cells + 1) };
    if (msg.key === '-') return { ...state, cells: Math.max(MIN_CELLS, state.cells - 1) };
    return msg.key === 'h' ? { ...state, hideUI: !state.hideUI } : state;
  },
  view(state, { width, height, elapsed, ctx }) {
    const surface = createSurface(width, height);
    const noise = createNoise3(state.seed);
    paintPixels(surface, tilesPixel(state, (x, y, z) => noise(x, y, z) / 3, width, height * 2, elapsed), 2);
    if (!state.hideUI) {
      stampPanel(surface, [
        '  ***  DIRECTIONAL TILES  ***  ',
        `  ${String(state.cells)} x ${String(state.cells)} tiles, ${String(state.segments)} segments`,
        `  ink ${state.ink} on ${state.paper}`,
        '  - R     : New composition',
        '  - + / - : Cells',
        '  - H     : Hide panel',
      ], ctx, (free) => ({ x: Math.max(0, Math.min(2, free.x - 2)), y: Math.max(0, free.y - 1) }));
    }
    return surface;
  },
};

export const tilesDemo = defineDemo(tiles);
