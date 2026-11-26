// Licensed under the Apache License, Version 2.0, like the rest of this repository.
import { createSurface } from '@flyingrobots/bijou';
import { defineDemo, type Demo } from '../contract.js';
import { stampPanel } from '../panel.js';
import { nextRandom } from '../random.js';
import { QUAD_PALETTES } from './palettes.js';
import { hex, mix, paintPixels, type Rgb } from './pixels.js';
import { divide, insideDepth, type Quad } from './rects-geometry.js';

export interface RectsState {
  readonly seed: number;
  readonly palette: number;
  readonly passes: number;
  readonly skewness: number;
  readonly stroke: boolean;
  readonly quads: readonly Quad[];
  /** Recompose on its own every `AUTO_SECONDS`. */
  readonly auto: boolean;
  readonly sinceRoll: number;
  readonly hideUI: boolean;
}

const AUTO_SECONDS = 5;
const MIN_PASSES = 1;
const MAX_PASSES = 10;
const SUPERSAMPLE = 2;
const WHITE: Rgb = [255, 255, 255];
/** A soft band of light sweeps across the picture, one pass every this many seconds. */
const SHINE_SECONDS = 4;

/** How much light the sweeping band adds at picture pixel (x, y) of a w by h picture at time t: 0 to 0.22. */
function shine(x: number, y: number, w: number, h: number, t: number): number {
  const span = w + h;
  const at = (((t / SHINE_SECONDS) % 1) * span * 1.6) - span * 0.3;
  const d = Math.abs(x + y - at) / (span * 0.06);
  return d >= 1 ? 0 : 0.22 * (1 - d * d);
}

function rebuild(state: Omit<RectsState, 'quads'>): RectsState {
  const fills = QUAD_PALETTES[state.palette]?.colors.length ?? 1;
  const [quads] = divide(state.seed, state.passes, state.skewness, fills);
  return { ...state, quads };
}

/** A new composition, as the original's Randomize: palette, skewness in [0.1, 0.7), 4–9 passes, stroke or not. */
export function roll(seed: number, keep: Pick<RectsState, 'auto' | 'hideUI'> = { auto: true, hideUI: false }): RectsState {
  const [a, s1] = nextRandom(seed);
  const [b, s2] = nextRandom(s1);
  const [c, s3] = nextRandom(s2);
  const [d, s4] = nextRandom(s3);
  return rebuild({
    ...keep, seed: s4, sinceRoll: 0,
    palette: Math.floor(a * QUAD_PALETTES.length),
    skewness: 0.1 + b * 0.6,
    passes: 4 + Math.floor(c * 6),
    stroke: d < 0.5,
  });
}

/** Each picture sub-pixel's fill index, or -2 for a stroke and -1 for the ground, quad by quad over its bounds. */
function rasterize(state: RectsState, w: number, h: number): Int16Array {
  const out = new Int16Array(w * h).fill(-1);
  const shorter = Math.min(w, h);
  const margin = shorter / 15;
  const size = shorter - 2 * margin;
  const left = (w - size) / 2;
  const top = (h - size) / 2;
  const line = state.stroke ? 1.25 * SUPERSAMPLE : 0;
  for (const quad of state.quads) {
    const xs = quad.corners.map(([u]) => left + u * size);
    const ys = quad.corners.map(([, v]) => top + v * size);
    const x0 = Math.max(0, Math.floor(Math.min(...xs)));
    const x1 = Math.min(w - 1, Math.ceil(Math.max(...xs)));
    const y0 = Math.max(0, Math.floor(Math.min(...ys)));
    const y1 = Math.min(h - 1, Math.ceil(Math.max(...ys)));
    const px: Quad = { ...quad, corners: [[xs[0] ?? 0, ys[0] ?? 0], [xs[1] ?? 0, ys[1] ?? 0], [xs[2] ?? 0, ys[2] ?? 0], [xs[3] ?? 0, ys[3] ?? 0]] };
    for (let y = y0; y <= y1; y += 1) {
      for (let x = x0; x <= x1; x += 1) {
        const depth = insideDepth(px, [x + 0.5, y + 0.5]);
        if (depth >= 0) out[y * w + x] = depth < line ? -2 : quad.fill;
      }
    }
  }
  return out;
}

export const rects: Demo<RectsState> = {
  id: 'deformed-rectangles',
  name: 'Deformed Rectangles',
  description: 'A square split again and again at uneven ratios into skewed quads, after Saneef Ansari and Okazz',
  keys: 'r recompose, + and - levels, s stroke, a auto, h hides the panel, space pause',
  init: (seed) => roll(seed),
  update(msg, state) {
    if (msg.type === 'pulse') {
      if (!state.auto) return state;
      const sinceRoll = state.sinceRoll + msg.dt;
      return sinceRoll >= AUTO_SECONDS ? roll(state.seed, state) : { ...state, sinceRoll };
    }
    if (msg.type !== 'key') return state;
    if (msg.key === 'r') return roll(state.seed, state);
    if (msg.key === '+' || msg.key === '=') return rebuild({ ...state, passes: Math.min(MAX_PASSES, state.passes + 1) });
    if (msg.key === '-') return rebuild({ ...state, passes: Math.max(MIN_PASSES, state.passes - 1) });
    if (msg.key === 's') return { ...state, stroke: !state.stroke };
    if (msg.key === 'a') return { ...state, auto: !state.auto, sinceRoll: 0 };
    return msg.key === 'h' ? { ...state, hideUI: !state.hideUI } : state;
  },
  view(state, { width, height, elapsed, ctx }) {
    const surface = createSurface(width, height);
    const palette = QUAD_PALETTES[state.palette] ?? QUAD_PALETTES[0];
    const ground: Rgb = hex(palette?.background ?? '#000000');
    const stroke: Rgb = hex(palette?.stroke ?? '#000000');
    const fills = (palette?.colors ?? []).map(hex);
    const w = width * SUPERSAMPLE;
    const h = height * 2 * SUPERSAMPLE;
    const raster = rasterize(state, w, h);
    paintPixels(surface, (x, y) => {
      const at = raster[Math.floor(y * SUPERSAMPLE) * w + Math.floor(x * SUPERSAMPLE)] ?? -1;
      const base = at === -1 ? ground : at === -2 ? stroke : (fills[at] ?? ground);
      const light = shine(x, y, width, height * 2, elapsed);
      return light === 0 ? base : mix(base, WHITE, light);
    }, SUPERSAMPLE);
    if (!state.hideUI) {
      stampPanel(surface, [
        '  ***  DEFORMED RECTANGLES  ***  ',
        '─',
        `  ${String(state.quads.length)} quads, ${String(state.passes)} levels, palette ${palette?.name ?? ''}`,
        `  auto ${state.auto ? 'on' : 'off'}, stroke ${state.stroke ? 'on' : 'off'}`,
        '  - R : Recompose   - + / - : Levels',
        '  - S : Stroke      - A     : Auto',
        '  - H : Hide panel',
      ], ctx, (free) => ({ x: Math.max(0, Math.min(2, free.x - 2)), y: Math.max(0, free.y - 1) }));
    }
    return surface;
  },
};

export const rectsDemo = defineDemo(rects);
