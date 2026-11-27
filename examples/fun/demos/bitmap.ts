// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// After "Pseudo Random Multi-color Bitmap Generator" by an unnamed author (Observable
// notebook d/7966ab0627e1b412): a grid of squares, each channel drawn from its own range.
import { createSurface } from '@flyingrobots/bijou';
import { defineDemo, type Demo } from '../contract.js';
import { stampPanel } from '../panel.js';
import { nextRandom } from '../random.js';
import { mix, paintPixels, type Rgb } from './pixels.js';

/** A channel's range, from and to, 0–255 inclusive. */
export type ChannelRange = readonly [number, number];

export interface BitmapState {
  readonly seed: number;
  readonly red: ChannelRange;
  readonly green: ChannelRange;
  readonly blue: ChannelRange;
  /** Squares per row, the original's Width. */
  readonly across: number;
  readonly hideUI: boolean;
}

const MIN_ACROSS = 4;
const MAX_ACROSS = 64;
/** Each square draws a fresh colour about this often, in seconds, at its own phase. */
const REDRAW_SECONDS = 4;
/** The part of each redraw period spent fading from the old colour to the new. */
const FADE = 0.3;

/** The original's getRandomIntInclusive: a whole number from `min` to `max`, from a uniform `u` in [0, 1). */
const inclusive = (u: number, min: number, max: number): number => Math.floor(u * (max - min + 1) + min);

/** A range as the original's sliders start: `from` anywhere in 0–255, `to` anywhere from `from` to 255. */
function range(seed: number): readonly [ChannelRange, number] {
  const [a, s1] = nextRandom(seed);
  const [b, s2] = nextRandom(s1);
  const from = inclusive(a, 0, 255);
  return [[from, inclusive(b, from, 255)], s2];
}

/** New colour ranges for all three channels. */
export function roll(seed: number, keep: Pick<BitmapState, 'across' | 'hideUI'>): BitmapState {
  const [red, s1] = range(seed);
  const [green, s2] = range(s1);
  const [blue, s3] = range(s2);
  return { ...keep, seed: s3, red, green, blue };
}

/** A seed for square (x, y) in its `version`th colour: the demo's seed mixed with the square's place and version. */
function cellSeed(seed: number, x: number, y: number, version: number): number {
  return (seed ^ Math.imul(x + 1, 0x9e3779b1) ^ Math.imul(y + 1, 0x85ebca77) ^ Math.imul(version + 7, 0xc2b2ae3d)) >>> 0;
}

/** The original's getRandomColor, as p5's random(from, to) per channel; opacity stays at its default of 255. */
export function cellColour(state: BitmapState, x: number, y: number, version: number): Rgb {
  const [, warm] = nextRandom(cellSeed(state.seed, x, y, version));
  const [r, s1] = nextRandom(warm);
  const [g, s2] = nextRandom(s1);
  const [b] = nextRandom(s2);
  const at = ([from, to]: ChannelRange, u: number): number => from + (to - from) * u;
  return [at(state.red, r), at(state.green, g), at(state.blue, b)];
}

/** Square (x, y)'s colour at time t: its current draw, fading into the next near the end of its period. */
function colourAt(state: BitmapState, x: number, y: number, t: number): Rgb {
  const [phase] = nextRandom(cellSeed(state.seed, x, y, -1));
  const clock = t / REDRAW_SECONDS + phase;
  const version = Math.floor(clock);
  const into = clock - version;
  const now = cellColour(state, x, y, version);
  if (into < 1 - FADE) return now;
  const k = (into - (1 - FADE)) / FADE;
  return mix(now, cellColour(state, x, y, version + 1), k * k * (3 - 2 * k));
}

const label = (name: string, [from, to]: ChannelRange): string => `${name} ${String(from).padStart(3)}–${String(to).padEnd(3)}`;

export const bitmap: Demo<BitmapState> = {
  id: 'bitmap-generator',
  name: 'Random Bitmap',
  description: 'A grid of squares, each channel picked from its own random range, slowly redrawing',
  keys: 'r new colour ranges, + and - squares per row, h hides the panel, space pause',
  init: (seed) => roll(seed, { across: 20, hideUI: false }),
  update(msg, state) {
    if (msg.type !== 'key') return state;
    if (msg.key === 'r') return roll(state.seed, state);
    if (msg.key === '+' || msg.key === '=') return { ...state, across: Math.min(MAX_ACROSS, state.across + 2) };
    if (msg.key === '-') return { ...state, across: Math.max(MIN_ACROSS, state.across - 2) };
    return msg.key === 'h' ? { ...state, hideUI: !state.hideUI } : state;
  },
  view(state, { width, height, elapsed, ctx }) {
    const surface = createSurface(width, height);
    const size = width / state.across;
    const down = Math.ceil((height * 2) / size);
    const colours: Rgb[] = [];
    for (let y = 0; y < down; y += 1) {
      for (let x = 0; x < state.across; x += 1) colours.push(colourAt(state, x, y, elapsed));
    }
    paintPixels(surface, (px, py) => {
      const x = Math.min(state.across - 1, Math.floor(px / size));
      const y = Math.min(down - 1, Math.floor(py / size));
      return colours[y * state.across + x] ?? [0, 0, 0];
    }, 2);
    if (!state.hideUI) {
      stampPanel(surface, [
        '  ***  RANDOM BITMAP  ***  ',
        '─',
        `  ${String(state.across)} x ${String(down)} squares`,
        `  ${label('R', state.red)}  ${label('G', state.green)}  ${label('B', state.blue)}`,
        '  - R     : New colour ranges',
        '  - + / - : Squares per row',
        '  - H     : Hide panel',
      ], ctx, (free) => ({ x: Math.max(0, Math.min(2, free.x - 2)), y: Math.max(0, free.y - 1) }));
    }
    return surface;
  },
};

export const bitmapDemo = defineDemo(bitmap);
