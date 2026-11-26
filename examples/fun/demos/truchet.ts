// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// After "012 Truchet tiles" by Saneef Ansari (Observable): a square of Truchet tiles,
// each turned one of two ways by a biased coin; here a tile is re-tossed now and then.
import { createSurface } from '@flyingrobots/bijou';
import { defineDemo, type Demo } from '../contract.js';
import { stampPanel } from '../panel.js';
import { nextRandom } from '../random.js';
import { dotGrid, paintBraille } from './line-braille.js';
import { hex } from './pixels.js';
import { drawTruchet } from './truchet-raster.js';

export interface TruchetState {
  readonly seed: number;
  /** Tiles across and down, the original's Grid Width. */
  readonly grid: number;
  /** From -1 (every tile one way) to 1 (every tile the other), the original's Bias. */
  readonly bias: number;
  readonly scheme: number;
  readonly stroke: number;
  /** Each tile's way round, 0 or 1, row by row. */
  readonly tiles: readonly number[];
  /** Re-toss one tile every `TOSS_SECONDS`. */
  readonly auto: boolean;
  readonly sinceToss: number;
  readonly hideUI: boolean;
}

/** The original's colour schemes, from Color Claim by Tobias van Schneider. */
const SCHEMES = [
  { name: 'No. 76', bg: '#dd705c', main: '#674b7c' },
  { name: 'No. 58', bg: '#abcee2', main: '#eaeaea' },
  { name: 'B & W', bg: '#ffffff', main: '#000000' },
] as const;
const STROKES = [1, 4, 8, 12, 20] as const;
const MIN_GRID = 1;
const MAX_GRID = 60;
const TOSS_SECONDS = 0.2;

/** One toss as the original makes it: way 0 when the draw is at most the bias mapped to [0, 1]. */
function toss(seed: number, bias: number): readonly [number, number] {
  const [r, next] = nextRandom(seed);
  return [r <= (bias + 1) / 2 ? 0 : 1, next];
}

/** Toss every tile afresh. */
export function retile(state: Omit<TruchetState, 'tiles'>): TruchetState {
  const tiles: number[] = [];
  let seed = state.seed;
  for (let i = 0; i < state.grid * state.grid; i += 1) {
    const [way, next] = toss(seed, state.bias);
    tiles.push(way);
    seed = next;
  }
  return { ...state, seed, tiles };
}

/** Re-toss one tile chosen at random. */
function retoss(state: TruchetState): TruchetState {
  const [pick, s1] = nextRandom(state.seed);
  const [way, seed] = toss(s1, state.bias);
  const at = Math.floor(pick * state.tiles.length);
  return { ...state, seed, tiles: state.tiles.map((old, i) => (i === at ? way : old)) };
}

const round2 = (value: number): number => Math.round(value * 100) / 100;

export const truchet: Demo<TruchetState> = {
  id: 'truchet-tiles',
  name: 'Truchet Tiles',
  description: 'Quarter-circle Truchet tiles turned by a biased coin, re-tossed one by one, after Saneef Ansari',
  keys: 'r retile, + and - grid, [ and ] bias, c colours, s stroke, a auto, h hides the panel, space pause',
  init: (seed) => retile({ seed, grid: 16, bias: 0, scheme: 0, stroke: 4, auto: true, sinceToss: 0, hideUI: false }),
  update(msg, state) {
    if (msg.type === 'pulse') {
      if (!state.auto) return state;
      let next: TruchetState = { ...state, sinceToss: state.sinceToss + msg.dt };
      for (let i = 0; i < 8 && next.sinceToss >= TOSS_SECONDS; i += 1) next = { ...retoss(next), sinceToss: next.sinceToss - TOSS_SECONDS };
      return { ...next, sinceToss: Math.min(next.sinceToss, TOSS_SECONDS) };
    }
    if (msg.type !== 'key') return state;
    if (msg.key === 'r') return retile(state);
    if (msg.key === '+' || msg.key === '=') return retile({ ...state, grid: Math.min(MAX_GRID, state.grid + 1) });
    if (msg.key === '-') return retile({ ...state, grid: Math.max(MIN_GRID, state.grid - 1) });
    if (msg.key === ']') return retile({ ...state, bias: round2(Math.min(1, state.bias + 0.05)) });
    if (msg.key === '[') return retile({ ...state, bias: round2(Math.max(-1, state.bias - 0.05)) });
    if (msg.key === 'c') return { ...state, scheme: (state.scheme + 1) % SCHEMES.length };
    if (msg.key === 's') return { ...state, stroke: STROKES[(STROKES.findIndex((s) => s === state.stroke) + 1) % STROKES.length] ?? 4 };
    if (msg.key === 'a') return { ...state, auto: !state.auto, sinceToss: 0 };
    return msg.key === 'h' ? { ...state, hideUI: !state.hideUI } : state;
  },
  view(state, { width, height, ctx }) {
    const surface = createSurface(width, height);
    const scheme = SCHEMES[state.scheme] ?? SCHEMES[0];
    const grid = dotGrid(surface);
    drawTruchet(grid, state.tiles, state.grid, state.stroke);
    paintBraille(surface, grid, hex(scheme.main), hex(scheme.bg));
    if (!state.hideUI) {
      stampPanel(surface, [
        '  ***  TRUCHET TILES  ***  ',
        '─',
        `  ${String(state.grid)} x ${String(state.grid)}, bias ${state.bias.toFixed(2)}, stroke ${String(state.stroke)}`,
        `  scheme ${scheme.name}, auto ${state.auto ? 'on' : 'off'}`,
        '  - R : Retile    - + / - : Grid',
        '  - C : Colours   - [ / ] : Bias',
        '  - S : Stroke    - A     : Auto',
        '  - H : Hide panel',
      ], ctx, (free) => ({ x: Math.max(0, Math.min(2, free.x - 2)), y: Math.max(0, free.y - 1) }));
    }
    return surface;
  },
};

export const truchetDemo = defineDemo(truchet);
