// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// After "Testing seed button" by Saneef Ansari (Observable): a square grid of short
// needles, each turned by a seeded noise field, light on near black. The original is
// static and redraws when its seed button rolls a new seed; here the field also drifts.
import { createSurface } from '@flyingrobots/bijou';
import { defineDemo, type Demo } from '../contract.js';
import { brailleMask, stampPanel } from '../panel.js';
import { nextRandom } from '../random.js';
import { createNoise3 } from './noise.js';
import { hex } from './pixels.js';

export interface NeedlesState {
  readonly seed: number;
  /** The seed the original's button shows and seeds its noise with. */
  readonly field: number;
  readonly rows: number;
  readonly hideUI: boolean;
}

const MIN_ROWS = 5;
const MAX_ROWS = 30;
const TAU = Math.PI * 2;
/** How fast the field drifts, in noise units per second. */
const DRIFT = 0.12;
/** Perlin noise peaks lower than the original's simplex; this stretches it to about the same range. */
const STRETCH = 1.4;
/** The original's palette: hsl(0, 0%, 95%) on hsl(0, 0%, 5%). */
const FG = hex('#f2f2f2');
const BG = hex('#0d0d0d');

/** Roll a new seed, as the original's seed button does. */
function reseed(state: Omit<NeedlesState, 'field'>): NeedlesState {
  const [a, seed] = nextRandom(state.seed);
  return { ...state, seed, field: Math.floor(a * 100000) };
}

/** The needles as a braille dot grid `w` by `h`: each from its cell's centre half a cell long, at time t. */
export function needleDots(state: NeedlesState, w: number, h: number, t: number): Uint8Array {
  const dots = new Uint8Array(w * h);
  const noise = createNoise3(state.field);
  const maxSize = Math.min(w, h);
  const size = maxSize - (2 * maxSize) / 5;
  const left = (w - size) / 2;
  const top = (h - size) / 2;
  const r = size / state.rows / 2;
  const plot = (x: number, y: number): void => {
    const px = Math.round(x);
    const py = Math.round(y);
    if (px >= 0 && py >= 0 && px < w && py < h) dots[py * w + px] = 1;
  };
  for (let j = 0; j < state.rows; j += 1) {
    for (let i = 0; i < state.rows; i += 1) {
      const u = state.rows > 1 ? i / (state.rows - 1) : 0;
      const v = state.rows > 1 ? j / (state.rows - 1) : 0;
      // The original's noise2D(u, v, 1 / 3): frequency a third.
      const angle = TAU * Math.max(-1, Math.min(1, STRETCH * noise(u / 3, v / 3, t * DRIFT)));
      const cx = left + u * size;
      const cy = top + v * size;
      const dx = r * Math.cos(angle);
      const dy = r * Math.sin(angle);
      const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) * 2));
      for (let s = 0; s <= steps; s += 1) plot(cx + (dx * s) / steps, cy + (dy * s) / steps);
    }
  }
  return dots;
}

export const needles: Demo<NeedlesState> = {
  id: 'seeded-needles',
  name: 'Seeded Needles',
  description: 'A grid of needles turned by a seeded, slowly drifting noise field, after Saneef Ansari',
  keys: 'r new seed, + and - rows, h hides the panel, space pause',
  init: (seed) => reseed({ seed, rows: 15, hideUI: false }),
  update(msg, state) {
    if (msg.type !== 'key') return state;
    if (msg.key === 'r') return reseed(state);
    if (msg.key === '+' || msg.key === '=') return { ...state, rows: Math.min(MAX_ROWS, state.rows + 1) };
    if (msg.key === '-') return { ...state, rows: Math.max(MIN_ROWS, state.rows - 1) };
    return msg.key === 'h' ? { ...state, hideUI: !state.hideUI } : state;
  },
  view(state, { width, height, elapsed, ctx }) {
    const surface = createSurface(width, height);
    const w = width * 2;
    const dots = needleDots(state, w, height * 4, elapsed);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const mask = brailleMask(dots, w, x, y);
        surface.setRGB(x, y, mask === 0 ? ' ' : String.fromCharCode(0x2800 + mask), FG[0], FG[1], FG[2], BG[0], BG[1], BG[2]);
      }
    }
    if (!state.hideUI) {
      stampPanel(surface, [
        '  ***  SEEDED NEEDLES  ***  ',
        '─',
        `  Seed: ${String(state.field)}`,
        `  ${String(state.rows)} x ${String(state.rows)} needles`,
        '  - R     : New seed',
        '  - + / - : Rows',
        '  - H     : Hide panel',
      ], ctx, (free) => ({ x: Math.max(0, Math.min(2, free.x - 2)), y: Math.max(0, free.y - 1) }));
    }
    return surface;
  },
};

export const needlesDemo = defineDemo(needles);
