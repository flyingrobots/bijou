// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// After "038 x raised to y mod n" by Saneef Ansari (Observable), itself after original work by Martin
// Kleppe: a square grid of cells, each lit when (x ^ y) % n is 0. The `^` is JavaScript's bitwise XOR,
// so the picture is Kleppe's XOR pattern. The original is still; here the grid drifts across the plane.
import { createSurface } from '@flyingrobots/bijou';
import { defineDemo, type Demo } from '../contract.js';
import { stampPanel } from '../panel.js';
import { nextRandom } from '../random.js';
import { paintPixels, type Rgb } from './pixels.js';

export interface XorModState {
  readonly seed: number;
  /** The original's n, from 1 to 101. */
  readonly base: number;
  /** Cells in a row, from 10 to 500 in steps of 10. */
  readonly cells: number;
  /** How far the grid has drifted, in cells, and its drift in cells per second. */
  readonly offset: readonly [number, number];
  readonly heading: readonly [number, number];
  readonly hideUI: boolean;
}

const MIN_BASE = 1;
const MAX_BASE = 101;
const MIN_CELLS = 10;
const MAX_CELLS = 500;
/** The original's slider defaults are n 9 and 250 cells; 250 cells is finer than a pane's pixels, so start at 80. */
const DEFAULT_BASE = 9;
const DEFAULT_CELLS = 80;
/** Drift speed in cells per second. */
const DRIFT = 1.5;
/** Offsets wrap here so the XOR stays inside 32-bit integers. */
const WRAP = 1 << 24;
/** The original's colours: hsl(0, 0%, 5%) ground and hsl(0, 0%, 95%) cells. */
const BG: Rgb = [13, 13, 13];
const FG: Rgb = [242, 242, 242];
const TAU = Math.PI * 2;

/** The original's activate(x, y). */
export const activate = (x: number, y: number, base: number): boolean => ((x ^ y) % base) === 0;

/** A new composition: n from 2 to 24, a drift heading and a starting place in the plane. */
export function roll(seed: number, keep: Pick<XorModState, 'cells' | 'hideUI'>): XorModState {
  const [a, s1] = nextRandom(seed);
  const [b, s2] = nextRandom(s1);
  const [c, s3] = nextRandom(s2);
  const [d, s4] = nextRandom(s3);
  return {
    ...keep, seed: s4,
    base: 2 + Math.floor(a * 23),
    offset: [Math.floor(c * 1024), Math.floor(d * 1024)],
    heading: [Math.cos(b * TAU) * DRIFT, Math.sin(b * TAU) * DRIFT],
  };
}

/**
 * The colour of picture pixel (x, y) in a w by h picture. The original spaces cell centres `size / (cells - 1)`
 * apart from edge to edge (linspace with its end point) and draws each `size / cells` wide, centred on its point,
 * so edge cells are half clipped and hairline gaps run between cells. This keeps both.
 */
export function xorPixel(state: XorModState, w: number, h: number) {
  const size = Math.min(w, h);
  const left = (w - size) / 2;
  const top = (h - size) / 2;
  const span = Math.max(1, state.cells - 1);
  const half = span / (2 * state.cells);
  const [ox, oy] = state.offset;
  return (x: number, y: number): Rgb => {
    if (x < left || y < top || x > left + size || y > top + size) return BG;
    const cx = ((x - left) / size) * span + ox;
    const cy = ((y - top) / size) * span + oy;
    const i = Math.round(cx);
    const j = Math.round(cy);
    if (Math.abs(cx - i) > half || Math.abs(cy - j) > half) return BG;
    return activate(i, j, state.base) ? FG : BG;
  };
}

const wrap = (v: number): number => ((v % WRAP) + WRAP) % WRAP;

export const xorMod: Demo<XorModState> = {
  id: 'xor-mod-n',
  name: 'x ^ y mod n',
  description: 'Cells lit where (x XOR y) mod n is zero, drifting across the plane, after Saneef Ansari',
  keys: 'r new composition, + and - n, [ and ] cells, h hides the panel, space pause',
  init: (seed) => ({ ...roll(seed, { cells: DEFAULT_CELLS, hideUI: false }), base: DEFAULT_BASE }),
  update(msg, state) {
    if (msg.type === 'pulse') {
      const [ox, oy] = state.offset;
      const [hx, hy] = state.heading;
      return { ...state, offset: [wrap(ox + hx * msg.dt), wrap(oy + hy * msg.dt)] };
    }
    if (msg.type !== 'key') return state;
    if (msg.key === 'r') return roll(state.seed, state);
    if (msg.key === '+' || msg.key === '=') return { ...state, base: Math.min(MAX_BASE, state.base + 1) };
    if (msg.key === '-') return { ...state, base: Math.max(MIN_BASE, state.base - 1) };
    if (msg.key === ']') return { ...state, cells: Math.min(MAX_CELLS, state.cells + 10) };
    if (msg.key === '[') return { ...state, cells: Math.max(MIN_CELLS, state.cells - 10) };
    return msg.key === 'h' ? { ...state, hideUI: !state.hideUI } : state;
  },
  view(state, { width, height, ctx }) {
    const surface = createSurface(width, height);
    paintPixels(surface, xorPixel(state, width, height * 2), 2);
    if (!state.hideUI) {
      stampPanel(surface, [
        '  ***  X ^ Y MOD N  ***  ',
        '─',
        `  n ${String(state.base)}, ${String(state.cells)} cells in a row`,
        '  - R     : New composition',
        '  - + / - : n',
        '  - [ / ] : Cells',
        '  - H     : Hide panel',
      ], ctx, (free) => ({ x: Math.max(0, Math.min(2, free.x - 2)), y: Math.max(0, free.y - 1) }));
    }
    return surface;
  },
};

export const xorModDemo = defineDemo(xorMod);
