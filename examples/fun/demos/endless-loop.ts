// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// After "Genuary 2023 - Day 1 - Endless Loop" by cdr6934 (Observable): a stack of
// squares at the centre, each growing and turning, one more joining every ten frames.
import { createSurface } from '@flyingrobots/bijou';
import { defineDemo, type Demo } from '../contract.js';
import { stampPanel } from '../panel.js';
import { nextRandom } from '../random.js';
import { SEAMLESS_COLORS } from './palettes.js';
import { hex, paintPixels, type Rgb } from './pixels.js';

export interface LoopState {
  readonly seed: number;
  /** 60 Hz frames since the loop began, the original's `cnt`. */
  readonly frames: number;
  /** How many squares join the stack, the original's Number Iterations. */
  readonly count: number;
  readonly background: string;
  /** The original's five-colour palette; square `i` takes colour `i % 5`. */
  readonly palette: readonly string[];
  readonly hideUI: boolean;
}

/** The original's canvas side and its squares' smallest side, growth per frame and reset size. */
const CANVAS = 1000;
const START = 50;
const GROWTH = 6;
const LIMIT = 1000;
/** Frames from a square's first side of 50 back to 50: 50 + 6 * 159 = 1004 is the last size before the reset. */
const PERIOD = Math.ceil((LIMIT - START) / GROWTH) + 1;
/** A new square joins every this many frames. */
const JOIN = 10;
const MIN_COUNT = 10;
const MAX_COUNT = 300;
const TAU = Math.PI * 2;

function pick(seed: number): readonly [string, number] {
  const [a, next] = nextRandom(seed);
  return [SEAMLESS_COLORS[Math.floor(a * SEAMLESS_COLORS.length)] ?? '#3d485d', next];
}

/** New colours as the original's getColor: a background and five palette colours, each any of the thirty. */
export function roll(seed: number, keep: Pick<LoopState, 'frames' | 'count' | 'hideUI'>): LoopState {
  const [background, s0] = pick(seed);
  const palette: string[] = [];
  let s = s0;
  for (let i = 0; i < 5; i += 1) {
    const [colour, next] = pick(s);
    palette.push(colour);
    s = next;
  }
  return { ...keep, seed: s, background, palette };
}

interface Square {
  readonly half: number;
  readonly cos: number;
  readonly sin: number;
  readonly colour: Rgb;
}

/** The squares drawn at frame `f`, bottom first, in picture pixels of `scale` per canvas unit. */
export function squaresAt(state: LoopState, f: number, scale: number): Square[] {
  const fills = state.palette.map(hex);
  const out: Square[] = [];
  for (let n = 0; n < state.count; n += 1) {
    const age = f - (JOIN * n + 1);
    if (age < 0) break;
    const side = START + GROWTH * (age % PERIOD);
    const angle = TAU * (n * 0.01) * (f / 360);
    out.push({ half: (side * scale) / 2, cos: Math.cos(angle), sin: Math.sin(angle), colour: fills[n % 5] ?? [0, 0, 0] });
  }
  return out;
}

export const endlessLoop: Demo<LoopState> = {
  id: 'endless-loop',
  name: 'Endless Loop',
  description: 'Squares that grow, turn and reset at the centre, one joining every ten frames, after cdr6934',
  keys: 'r new colours, + and - squares, c restart the loop, h hides the panel, space pause',
  init: (seed) => roll(seed, { frames: 0, count: 100, hideUI: false }),
  update(msg, state) {
    if (msg.type === 'pulse') return { ...state, frames: state.frames + msg.dt * 60 };
    if (msg.type !== 'key') return state;
    if (msg.key === 'r') return roll(state.seed, state);
    if (msg.key === 'c') return { ...state, frames: 0 };
    if (msg.key === '+' || msg.key === '=') return { ...state, count: Math.min(MAX_COUNT, state.count + 10) };
    if (msg.key === '-') return { ...state, count: Math.max(MIN_COUNT, state.count - 10) };
    return msg.key === 'h' ? { ...state, hideUI: !state.hideUI } : state;
  },
  view(state, { width, height, ctx }) {
    const surface = createSurface(width, height);
    const w = width;
    const h = height * 2;
    const cx = w / 2;
    const cy = h / 2;
    const ground = hex(state.background);
    const squares = squaresAt(state, state.frames, Math.min(w, h) / CANVAS);
    paintPixels(surface, (x, y) => {
      const dx = x - cx;
      const dy = y - cy;
      // The last square drawn is on top, so the first hit from the top of the stack wins.
      for (let i = squares.length - 1; i >= 0; i -= 1) {
        const sq = squares[i];
        if (sq === undefined) continue;
        const u = dx * sq.cos + dy * sq.sin;
        const v = dy * sq.cos - dx * sq.sin;
        if (Math.abs(u) <= sq.half && Math.abs(v) <= sq.half) return sq.colour;
      }
      return ground;
    }, 2);
    if (!state.hideUI) {
      const shown = squares.length;
      stampPanel(surface, [
        '  ***  ENDLESS LOOP  ***  ',
        '─',
        `  ${String(shown)} of ${String(state.count)} squares`,
        `  ${state.palette.join(' ')}`,
        `  on ${state.background}`,
        '  - R     : New colours',
        '  - + / - : Squares',
        '  - C     : Restart the loop',
        '  - H     : Hide panel',
      ], ctx, (free) => ({ x: Math.max(0, Math.min(2, free.x - 2)), y: Math.max(0, free.y - 1) }));
    }
    return surface;
  },
};

export const endlessLoopDemo = defineDemo(endlessLoop);
