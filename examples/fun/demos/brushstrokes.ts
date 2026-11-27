// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// After "Oil painting brushstrokes" by akngs (Observable): a hundred hairy strokes of black, grey, pale grey and red,
// painted one at a time with a light edge and a dark edge. Here a finished canvas rests, then a new one begins.
import { createSurface } from '@flyingrobots/bijou';
import { defineDemo, type Demo } from '../contract.js';
import { stampPanel } from '../panel.js';
import { blankCanvas, planStrokes, withStrokes, type Canvas, type StrokeSpec } from './brushstrokes-paint.js';
import { hex, paintPixels, type Rgb } from './pixels.js';

export interface BrushstrokesState {
  /** Seeds the next canvas. */
  readonly seed: number;
  /** The original's colours, or the red, yellow, green and blue it leaves commented out. */
  readonly colourSet: number;
  readonly strokes: readonly StrokeSpec[];
  readonly count: number;
  readonly drawn: number;
  /** Seconds since this canvas began. */
  readonly clock: number;
  readonly canvas: Canvas;
  readonly hideUI: boolean;
}

const COLOUR_SETS: readonly { readonly name: string; readonly colours: readonly Rgb[] }[] = [
  { name: 'black, grey, red', colours: ['#000000', '#333333', '#cccccc', '#ff0000'].map(hex) },
  { name: 'red, yellow, green, blue', colours: ['#ff0000', '#ffff00', '#008000', '#0000ff'].map(hex) },
];
const START_STROKES = 100;
const MIN_STROKES = 25;
const MAX_STROKES = 300;
const STROKE_STEP = 25;
/** Strokes painted per second, and seconds a finished canvas rests before the next. */
const RATE = 20;
const REST = 4;
const SUPERSAMPLE = 2;

/** A canvas of sub-pixels for a pane, before the first resize an 80 by 24 one. */
const canvasFor = (width: number, height: number): Canvas => blankCanvas(width * SUPERSAMPLE, height * 2 * SUPERSAMPLE);

/** A new, empty canvas with its strokes planned, the size of `size`. */
export function roll(seed: number, keep: Pick<BrushstrokesState, 'colourSet' | 'count' | 'hideUI'>, size: Canvas): BrushstrokesState {
  const colours = COLOUR_SETS[keep.colourSet]?.colours ?? [];
  const [strokes, next] = planStrokes(seed, MAX_STROKES, colours);
  return { ...keep, seed: next, strokes, drawn: 0, clock: 0, canvas: blankCanvas(size.width, size.height) };
}

/** Paint on with the clock, or start again once the finished canvas has rested. */
function tick(state: BrushstrokesState, dt: number): BrushstrokesState {
  const clock = state.clock + dt;
  if (state.drawn >= state.count && clock >= state.count / RATE + REST) return roll(state.seed, state, state.canvas);
  const target = Math.min(state.count, Math.floor(clock * RATE));
  if (target <= state.drawn) return { ...state, clock };
  return { ...state, clock, drawn: target, canvas: withStrokes(state.canvas, state.strokes.slice(state.drawn, target)) };
}

/** The same strokes on a canvas of another size, or fewer of them, painted again from blank. */
function repaint(state: BrushstrokesState, canvas: Canvas, drawn: number): BrushstrokesState {
  return { ...state, drawn, canvas: withStrokes(canvas, state.strokes.slice(0, drawn)) };
}

export const brushstrokes: Demo<BrushstrokesState> = {
  id: 'oil-brushstrokes',
  name: 'Oil Brushstrokes',
  description: 'Hairy oil-paint strokes with light and dark edges, painted one by one, after akngs',
  keys: 'r new canvas, + and - strokes, c colours, h hides the panel, space pause',
  init: (seed) => roll(seed, { colourSet: 0, count: START_STROKES, hideUI: false }, canvasFor(80, 24)),
  update(msg, state) {
    if (msg.type === 'pulse') return tick(state, msg.dt);
    if (msg.type === 'resize') {
      const size = canvasFor(msg.width, msg.height);
      if (size.width === state.canvas.width && size.height === state.canvas.height) return state;
      return repaint(state, size, state.drawn);
    }
    if (msg.type !== 'key') return state;
    if (msg.key === 'r') return roll(state.seed, state, state.canvas);
    if (msg.key === 'c') return roll(state.seed, { ...state, colourSet: (state.colourSet + 1) % COLOUR_SETS.length }, state.canvas);
    if (msg.key === '+' || msg.key === '=') return { ...state, count: Math.min(MAX_STROKES, state.count + STROKE_STEP) };
    if (msg.key === '-') {
      const count = Math.max(MIN_STROKES, state.count - STROKE_STEP);
      const lowered = { ...state, count };
      return state.drawn > count ? repaint(lowered, blankCanvas(state.canvas.width, state.canvas.height), count) : lowered;
    }
    return msg.key === 'h' ? { ...state, hideUI: !state.hideUI } : state;
  },
  view(state, { width, height, ctx }) {
    const surface = createSurface(width, height);
    const { canvas } = state;
    paintPixels(surface, (x, y): Rgb => {
      const cx = Math.min(canvas.width - 1, Math.floor((x / width) * canvas.width));
      const cy = Math.min(canvas.height - 1, Math.floor((y / (height * 2)) * canvas.height));
      const i = (cy * canvas.width + cx) * 3;
      return [canvas.rgb[i] ?? 255, canvas.rgb[i + 1] ?? 255, canvas.rgb[i + 2] ?? 255];
    }, SUPERSAMPLE);
    if (!state.hideUI) {
      stampPanel(surface, [
        '  ***  OIL BRUSHSTROKES  ***  ',
        '─',
        `  ${String(state.drawn)} of ${String(state.count)} strokes`,
        `  ${COLOUR_SETS[state.colourSet]?.name ?? ''}`,
        '  - R     : New canvas',
        '  - + / - : Strokes',
        '  - C     : Colours',
        '  - H     : Hide panel',
      ], ctx, (free) => ({ x: Math.max(0, Math.min(2, free.x - 2)), y: Math.max(0, free.y - 1) }));
    }
    return surface;
  },
};

export const brushstrokesDemo = defineDemo(brushstrokes);
