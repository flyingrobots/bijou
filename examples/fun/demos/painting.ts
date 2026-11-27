// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// After "Generative Painting" by Karim Douieb (Observable), a recreation of the watercolour
// technique Tyler Hobbs described in "How to Hack a Painting": shapes grown from layer upon layer
// of faint random triangles. Here the layers go on a few at a time, so the painting builds up.
import { createSurface } from '@flyingrobots/bijou';
import { defineDemo, type Demo } from '../contract.js';
import { stampPanel } from '../panel.js';
import { nextRandom } from '../random.js';
import { NICE_PALETTES } from './palettes.js';
import { bandPasses, blobPasses, brush, DEFAULT_LAYERS, drawLayer, paintEdges, type CoreEar, type Pass, type Stroke } from './painting-geometry.js';
import { blankCanvas, canvasAt, copyCanvas, fillPolygon, fillTriangle, type Canvas } from './painting-raster.js';
import { hex, paintPixels } from './pixels.js';

export type PaintingMode = 'bands' | 'blob';

export interface PaintingState {
  readonly seed: number;
  readonly mode: PaintingMode;
  readonly palette: number;
  readonly layers: number;
  /** The seed the brush starts the composition from, so a resize repaints the same painting. */
  readonly composition: number;
  readonly canvas: Canvas;
  readonly passes: readonly Pass[];
  /** The pass being painted; `passes.length` once the painting is done. */
  readonly pass: number;
  /** The current pass's core ears, or null before its base and core are down. */
  readonly cores: readonly CoreEar[] | null;
  readonly layer: number;
  readonly brushSeed: number;
  /** Units of work owed: a pass's base and core, or one layer. */
  readonly owed: number;
  /** Seconds the finished painting has been on show. */
  readonly shown: number;
  readonly hideUI: boolean;
}

const BLOB_COLOUR = '#1fffc7';
const BLOB_GROUND = '#e5eaef';
const BAND_GROUND = '#ffffff';
const SCALE = 2;
const LAYER_STEP = 10;
/** Layers painted per second, and at most per pulse. */
const RATE = 150;
const MAX_UNITS = 12;
/** A finished painting stays this long before the next one starts. */
const SHOW_SECONDS = 5;

/** Start painting the composition from a blank canvas `w` by `h` pixels. */
function begin(state: Omit<PaintingState, 'canvas' | 'passes'>, w: number, h: number): PaintingState {
  const blob = state.mode === 'blob';
  const palette = NICE_PALETTES[state.palette] ?? NICE_PALETTES[0] ?? [BLOB_COLOUR];
  return {
    ...state, pass: 0, cores: null, layer: 0, brushSeed: state.composition, owed: 0, shown: 0,
    canvas: blankCanvas(w, h, SCALE, hex(blob ? BLOB_GROUND : BAND_GROUND)),
    passes: blob ? blobPasses(BLOB_COLOUR, w, h) : bandPasses(palette, w, h),
  };
}

/** A new composition: a palette and a brush seed drawn from the seed, as the original's "Draw new painting". */
function compose(state: Omit<PaintingState, 'canvas' | 'passes'>, w: number, h: number): PaintingState {
  const [a, s1] = nextRandom(state.seed);
  const [composition, seed] = nextRandom(s1);
  return begin({ ...state, seed, palette: Math.floor(a * NICE_PALETTES.length), composition: Math.floor(composition * 0x100000000) }, w, h);
}

/** Paint the units of work `dt` seconds owe, on a copy of the canvas. */
function advance(state: PaintingState, dt: number): PaintingState {
  const { width: w, height: h } = state.canvas;
  if (state.pass >= state.passes.length) {
    const shown = state.shown + dt;
    return shown >= SHOW_SECONDS ? compose(state, w, h) : { ...state, shown };
  }
  const owed = state.owed + Math.max(0, dt) * RATE;
  let units = Math.min(MAX_UNITS, Math.floor(owed));
  const canvas = copyCanvas(state.canvas);
  const rng = brush(state.brushSeed);
  let { pass, cores, layer } = state;
  while (units > 0 && pass < state.passes.length) {
    const current = state.passes[pass];
    if (current === undefined) break;
    const colour = hex(current.colour);
    const stroke: Stroke = (triangle, alpha) => { fillTriangle(canvas, triangle, colour, alpha); };
    if (cores === null) {
      fillPolygon(canvas, current.base, colour, 1);
      cores = paintEdges(rng, current, stroke);
      layer = 0;
      units -= 1;
    } else if (layer < state.layers) {
      for (const ear of cores) drawLayer(rng, ear, stroke);
      layer += 1;
      units -= 1;
    } else {
      pass += 1;
      cores = null;
    }
  }
  return { ...state, canvas, pass, cores, layer, brushSeed: rng.seed(), owed: owed - Math.floor(owed) };
}

export const painting: Demo<PaintingState> = {
  id: 'generative-painting',
  name: 'Generative Painting',
  description: 'Watercolour bands built from layer upon layer of faint random triangles, after Karim Douieb',
  keys: 'r new painting, + and - layers, m bands or one shape, h hides the panel, space pause',
  init: (seed) => compose({
    seed, mode: 'bands', palette: 0, layers: DEFAULT_LAYERS, composition: 0, pass: 0, cores: null, layer: 0,
    brushSeed: 0, owed: 0, shown: 0, hideUI: false,
  }, 80, 48),
  update(msg, state) {
    const { width, height } = state.canvas;
    if (msg.type === 'resize') return begin(state, Math.max(1, msg.width), Math.max(1, msg.height * 2));
    if (msg.type === 'pulse') return advance(state, msg.dt);
    if (msg.type !== 'key') return state;
    if (msg.key === 'r') return compose(state, width, height);
    if (msg.key === 'm') return compose({ ...state, mode: state.mode === 'bands' ? 'blob' : 'bands' }, width, height);
    if (msg.key === '+' || msg.key === '=') return begin({ ...state, layers: Math.min(DEFAULT_LAYERS, state.layers + LAYER_STEP) }, width, height);
    if (msg.key === '-') return begin({ ...state, layers: Math.max(LAYER_STEP, state.layers - LAYER_STEP) }, width, height);
    return msg.key === 'h' ? { ...state, hideUI: !state.hideUI } : state;
  },
  view(state, { width, height, ctx }) {
    const surface = createSurface(width, height);
    const { canvas } = state;
    paintPixels(surface, (x, y) => canvasAt(canvas, (x * canvas.width) / width, (y * canvas.height) / (height * 2)), SCALE);
    if (!state.hideUI) {
      const done = state.pass >= state.passes.length;
      stampPanel(surface, [
        '  ***  GENERATIVE PAINTING  ***  ',
        '─',
        `  ${state.mode === 'bands' ? `palette ${String(state.palette + 1)}` : `one shape in ${BLOB_COLOUR}`}, ${String(state.layers)} layers`,
        done ? '  finished: a new one soon' : `  colour ${String(state.pass + 1)} of ${String(state.passes.length)}, layer ${String(state.layer)}`,
        '  - R     : New painting',
        '  - + / - : Layers',
        '  - M     : Bands or one shape',
        '  - H     : Hide panel',
      ], ctx, (free) => ({ x: Math.max(0, Math.min(2, free.x - 2)), y: Math.max(0, free.y - 1) }));
    }
    return surface;
  },
};

export const paintingDemo = defineDemo(painting);
