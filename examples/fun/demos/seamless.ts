// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// After "(Day 8 of 30) Seamless Patterns in P5.js" by cdr6934 (Observable): rows of
// squares in two colour ramps, turning one way on even rows and the other on odd.
import { createSurface } from '@flyingrobots/bijou';
import { defineDemo, type Demo } from '../contract.js';
import { stampPanel } from '../panel.js';
import { nextRandom } from '../random.js';
import { SEAMLESS_COLORS } from './palettes.js';
import { hex, paintPixels, type Rgb } from './pixels.js';
import { CANVAS_WIDTH, placeSquares, rasterize, rowsFor } from './seamless-geometry.js';

export interface SeamlessState {
  readonly seed: number;
  /** The ground, then the original's c1 to c4. */
  readonly colours: readonly [string, string, string, string, string];
  /** Square side in canvas units, the original's Rect Size. */
  readonly size: number;
  /** Phase added per 60 Hz frame, the original's Osc Speed. */
  readonly osc: number;
  /** The original's `j`. */
  readonly phase: number;
  readonly hideUI: boolean;
}

const SUPERSAMPLE = 2;
const MIN_SIZE = 4;
const MAX_SIZE = 100;
const SIZE_STEP = 4;
const MAX_OSC = 1;
const OSC_STEP = 0.01;

/** Five colours from the original's list, as its five getColor() cells: c1 to c4, then the ground. */
export function roll(seed: number, keep: Pick<SeamlessState, 'size' | 'osc' | 'phase' | 'hideUI'>): SeamlessState {
  const picks: string[] = [];
  let next = seed;
  for (let i = 0; i < 5; i += 1) {
    const [value, after] = nextRandom(next);
    next = after;
    picks.push(SEAMLESS_COLORS[Math.floor(value * SEAMLESS_COLORS.length)] ?? '#f9f9f5');
  }
  const [c1 = '#6cb59d', c2 = '#e7c558', c3 = '#dd5c4e', c4 = '#365a5e', ground = '#f9f9f5'] = picks;
  return { ...keep, seed: next, colours: [ground, c1, c2, c3, c4] };
}

const round2 = (value: number): number => Math.round(value * 100) / 100;

export const seamless: Demo<SeamlessState> = {
  id: 'seamless-squares',
  name: 'Seamless Squares',
  description: 'Rows of squares in two colour ramps, turning and rocking on a sine wave, after cdr6934',
  keys: 'r new colours, + and - square size, [ and ] speed, h hides the panel, space pause',
  init: (seed) => roll(seed, { size: 40, osc: 0.02, phase: 1, hideUI: false }),
  update(msg, state) {
    if (msg.type === 'pulse') return { ...state, phase: state.phase + state.osc * msg.dt * 60 };
    if (msg.type !== 'key') return state;
    if (msg.key === 'r') return roll(state.seed, state);
    if (msg.key === '+' || msg.key === '=') return { ...state, size: Math.min(MAX_SIZE, state.size + SIZE_STEP) };
    if (msg.key === '-') return { ...state, size: Math.max(MIN_SIZE, state.size - SIZE_STEP) };
    if (msg.key === ']') return { ...state, osc: round2(Math.min(MAX_OSC, state.osc + OSC_STEP)) };
    if (msg.key === '[') return { ...state, osc: round2(Math.max(0, state.osc - OSC_STEP)) };
    return msg.key === 'h' ? { ...state, hideUI: !state.hideUI } : state;
  },
  view(state, { width, height, ctx }) {
    const surface = createSurface(width, height);
    const w = width * SUPERSAMPLE;
    const h = height * 2 * SUPERSAMPLE;
    const scale = w / CANVAS_WIDTH;
    const [ground, c1, c2, c3, c4] = state.colours.map(hex);
    const back: Rgb = ground ?? [249, 249, 245];
    const squares = placeSquares(rowsFor(h / scale), state.phase, [c1 ?? back, c2 ?? back, c3 ?? back, c4 ?? back]);
    const raster = rasterize(squares, state.size, scale, w, h);
    paintPixels(surface, (x, y) => {
      const at = raster[Math.floor(y * SUPERSAMPLE) * w + Math.floor(x * SUPERSAMPLE)] ?? -1;
      return at < 0 ? back : (squares[at]?.colour ?? back);
    }, SUPERSAMPLE);
    if (!state.hideUI) {
      stampPanel(surface, [
        '  ***  SEAMLESS SQUARES  ***  ',
        `  size ${String(state.size)}, speed ${state.osc.toFixed(2)}`,
        `  ${state.colours.slice(1).join(' ')}`,
        `  on ${state.colours[0]}`,
        '  - R     : New colours',
        '  - + / - : Square size',
        '  - [ / ] : Speed',
        '  - H     : Hide panel',
      ], ctx, (free) => ({ x: Math.max(0, Math.min(2, free.x - 2)), y: Math.max(0, free.y - 1) }));
    }
    return surface;
  },
};

export const seamlessDemo = defineDemo(seamless);
