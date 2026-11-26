// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// After "016 Some Triangles" by Saneef Ansari (Observable), after Manfred Mohr's
// "Programme 45 - Third Dimension in Flatland" (1969). The proportion breathes slowly.
import { createSurface } from '@flyingrobots/bijou';
import { defineDemo, type Demo } from '../contract.js';
import { stampPanel } from '../panel.js';
import { nextRandom } from '../random.js';
import { dotGrid, paintBraille } from './line-braille.js';
import { hex } from './pixels.js';
import { drawTriangles } from './triangles-geometry.js';

export interface TrianglesState {
  readonly seed: number;
  /** From 1 to 2, the original's Proportion. */
  readonly ratio: number;
  /** The original's Vertices: half as many steps, four peaks a step. */
  readonly divisions: number;
  readonly scheme: number;
  /** Swing the proportion about its set value. */
  readonly breathe: boolean;
  readonly phase: number;
  readonly hideUI: boolean;
}

/** The original's schemes: its custom pair first, then white on black and black on white. */
const SCHEMES = [
  { name: 'Custom', bg: '#f5efe3', fg: '#414143' },
  { name: 'White on black', bg: '#000000', fg: '#ffffff' },
  { name: 'Black on white', bg: '#ffffff', fg: '#000000' },
] as const;
const MIN_DIVISIONS = 2;
const MAX_DIVISIONS = 360;
/** Radians of breath per second, and how far the breath swings the ratio's exponent. */
const BREATH_SPEED = 0.35;
const BREATH_DEPTH = 0.5;

/** The proportion drawn now: the set ratio raised to a power that swings about 1. */
export function liveRatio(state: TrianglesState): number {
  if (!state.breathe) return state.ratio;
  return Math.min(2, Math.max(1, state.ratio ** (1 + BREATH_DEPTH * Math.sin(state.phase))));
}

const round3 = (value: number): number => Math.round(value * 1000) / 1000;

/** A new composition: a proportion in [1.05, 2) and an even vertex count from 6 to 64. */
export function roll(state: TrianglesState): TrianglesState {
  const [a, s1] = nextRandom(state.seed);
  const [b, seed] = nextRandom(s1);
  return { ...state, seed, ratio: round3(1.05 + a * 0.95), divisions: 6 + 2 * Math.floor(b * 30) };
}

export const triangles: Demo<TrianglesState> = {
  id: 'some-triangles',
  name: 'Some Triangles',
  description: 'Triangles on one base, peaks crowding along a circle, after Saneef Ansari and Manfred Mohr',
  keys: 'r new composition, + and - vertices, [ and ] proportion, c colours, a breathe, h hides the panel, space pause',
  init: (seed) => ({ seed, ratio: 1.333, divisions: 27, scheme: 0, breathe: true, phase: 0, hideUI: false }),
  update(msg, state) {
    if (msg.type === 'pulse') return state.breathe ? { ...state, phase: (state.phase + msg.dt * BREATH_SPEED) % (Math.PI * 2) } : state;
    if (msg.type !== 'key') return state;
    if (msg.key === 'r') return roll(state);
    if (msg.key === '+' || msg.key === '=') return { ...state, divisions: Math.min(MAX_DIVISIONS, state.divisions + 2) };
    if (msg.key === '-') return { ...state, divisions: Math.max(MIN_DIVISIONS, state.divisions - 2) };
    if (msg.key === ']') return { ...state, ratio: round3(Math.min(2, state.ratio + 0.05)) };
    if (msg.key === '[') return { ...state, ratio: round3(Math.max(1, state.ratio - 0.05)) };
    if (msg.key === 'c') return { ...state, scheme: (state.scheme + 1) % SCHEMES.length };
    if (msg.key === 'a') return { ...state, breathe: !state.breathe };
    return msg.key === 'h' ? { ...state, hideUI: !state.hideUI } : state;
  },
  view(state, { width, height, ctx }) {
    const surface = createSurface(width, height);
    const scheme = SCHEMES[state.scheme] ?? SCHEMES[0];
    const grid = dotGrid(surface);
    const ratio = liveRatio(state);
    drawTriangles(grid, ratio, state.divisions);
    paintBraille(surface, grid, hex(scheme.fg), hex(scheme.bg));
    if (!state.hideUI) {
      stampPanel(surface, [
        '  ***  SOME TRIANGLES  ***  ',
        '─',
        `  1:${ratio.toFixed(3)} (set 1:${state.ratio.toFixed(3)}), ${String(state.divisions)} vertices`,
        `  ${scheme.name}, breathe ${state.breathe ? 'on' : 'off'}`,
        '  - R : New         - + / - : Vertices',
        '  - C : Colours     - [ / ] : Proportion',
        '  - A : Breathe     - H     : Hide panel',
      ], ctx, (free) => ({ x: Math.max(0, Math.min(2, free.x - 2)), y: Math.max(0, free.y - 1) }));
    }
    return surface;
  },
};

export const trianglesDemo = defineDemo(triangles);
