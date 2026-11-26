// Licensed under the Apache License, Version 2.0, like the rest of this repository.
import { createSurface } from '@flyingrobots/bijou';
import { defineDemo, type Demo } from '../contract.js';
import { stampPanel } from '../panel.js';
import { doyle, doyleDiscs, type DoyleRoot } from './doyle-math.js';
import { hslToRgb } from './hsl.js';
import { paintPixels, type Rgb } from './pixels.js';

export interface DoyleState {
  readonly p: number;
  readonly q: number;
  readonly root: DoyleRoot;
  readonly hideUI: boolean;
}

/** The notebook's defaults. */
const START_P = 9;
const START_Q = 24;
/** Turns per second of the spiral's rotation. */
const SPIN = 0.02;
const SUPERSAMPLE = 2;
const BLACK: Rgb = [0, 0, 0];

/** Move to (p, q) when the spiral exists there; otherwise stay. */
function retune(state: DoyleState, p: number, q: number): DoyleState {
  if (p < 1 || p > 20 || q < 3 || q > 30) return state;
  const root = doyle(p, q);
  return root === null ? state : { ...state, p, q, root };
}

/** Each picture sub-pixel's arm, painted disc by disc in the original's order, so later arms cover earlier ones. */
function rasterize(state: DoyleState, turn: number, w: number, h: number): Int16Array {
  const arms = new Int16Array(w * h).fill(-1);
  const scale = w / 4;
  for (const disc of doyleDiscs(state.root, state.p, turn)) {
    const cx = w / 2 + disc.x * scale;
    const cy = h / 2 + disc.y * scale;
    const r = disc.r * scale;
    if (r < 0.35) continue;
    const x0 = Math.max(0, Math.floor(cx - r));
    const x1 = Math.min(w - 1, Math.ceil(cx + r));
    const y0 = Math.max(0, Math.floor(cy - r));
    const y1 = Math.min(h - 1, Math.ceil(cy + r));
    for (let y = y0; y <= y1; y += 1) {
      for (let x = x0; x <= x1; x += 1) {
        if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r) arms[y * w + x] = disc.arm;
      }
    }
  }
  return arms;
}

export const doyleSpiral: Demo<DoyleState> = {
  id: 'doyle-spiral',
  name: 'Doyle Spiral',
  description: 'A Möbius-mapped Doyle spiral of touching circles, one hue per arm, after Robin Houston',
  keys: '[ and ] arms (p), , and . steps (q), h hides the panel, space pause',
  init: () => ({ p: START_P, q: START_Q, root: doyle(START_P, START_Q) ?? { a: [1, 0], b: [1, 0], r: 0 }, hideUI: false }),
  update(msg, state) {
    if (msg.type !== 'key') return state;
    if (msg.key === '[') return retune(state, state.p - 1, state.q);
    if (msg.key === ']') return retune(state, state.p + 1, state.q);
    if (msg.key === ',') return retune(state, state.p, state.q - 1);
    if (msg.key === '.') return retune(state, state.p, state.q + 1);
    return msg.key === 'h' ? { ...state, hideUI: !state.hideUI } : state;
  },
  view(state, { width, height, elapsed, ctx }) {
    const surface = createSurface(width, height);
    const w = width * SUPERSAMPLE;
    const h = height * 2 * SUPERSAMPLE;
    const arms = rasterize(state, elapsed * SPIN, w, h);
    const hues: Rgb[] = Array.from({ length: state.p }, (_, i) => {
      const { r, g, b } = hslToRgb((i / state.p) * 360, 50, 50);
      return [r, g, b];
    });
    paintPixels(surface, (x, y) => {
      const arm = arms[Math.floor(y * SUPERSAMPLE) * w + Math.floor(x * SUPERSAMPLE)] ?? -1;
      return arm < 0 ? BLACK : (hues[arm] ?? BLACK);
    }, SUPERSAMPLE);
    if (!state.hideUI) {
      stampPanel(surface, [
        '  ***  DOYLE SPIRAL  ***  ',
        '─',
        `  p = ${String(state.p)} arms, q = ${String(state.q)}`,
        '  - [ / ] : Arms (p)',
        '  - , / . : Steps (q)',
        '  - H     : Hide panel',
      ], ctx, (free) => ({ x: Math.max(0, Math.min(2, free.x - 2)), y: Math.max(0, free.y - 1) }));
    }
    return surface;
  },
};

export const doyleDemo = defineDemo(doyleSpiral);
