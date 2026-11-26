// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// After "040 Dancing to the noise" by Saneef Ansari (Observable), his sketch of an
// Apple Music cover: a row of vertical bars, each broken by a wider or thinner block
// whose height a noise field sets for every group of bars, swelling as it drifts.
import { createSurface } from '@flyingrobots/bijou';
import { defineDemo, type Demo } from '../contract.js';
import { stampPanel } from '../panel.js';
import { nextRandom } from '../random.js';
import { createNoise3, type Noise3 } from './noise.js';
import { INKS, PAPERS } from './palettes.js';
import { contrast, hex, paintPixels, type Rgb } from './pixels.js';

export interface DancingState {
  readonly seed: number;
  /** Seeds the noise field the bars dance to. */
  readonly field: number;
  /** The original's frame counter: one per 60 Hz frame. */
  readonly t: number;
  readonly lines: number;
  readonly group: number;
  readonly ink: string;
  readonly paper: string;
  readonly colored: boolean;
  readonly hideUI: boolean;
}

const MIN_LINES = 20;
const MAX_LINES = 180;
const LINE_STEP = 10;
const MAX_GROUP = 10;
/** The original's sliders at their defaults. */
const BREAK_RATIO = 0.15;
const PADDING_RATIO = 0.1;
/** The original's monochrome scheme. */
const MONO = { ink: '#101419', paper: '#e9e5da' };
/** A bar needs two pixels to read, so a narrow pane shows fewer bars than asked for. */
const MIN_SLOT = 2;
/** Perlin noise peaks lower than the original's simplex; this stretches it to about the same range. */
const STRETCH = 1.4;
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** The original's noise2D in [-1, 1], on a plane off the lattice so it is never pinned to zero. */
const noise2 = (noise: Noise3, x: number, y: number): number => Math.max(-1, Math.min(1, STRETCH * noise(x, y, 0.5)));

/** The original's Randomize colors: a random ink and a paper it reads against. */
function shuffle(state: DancingState): DancingState {
  const [a, s1] = nextRandom(state.seed);
  const [b, s2] = nextRandom(s1);
  const ink = INKS[Math.floor(a * INKS.length)] ?? MONO.ink;
  const offset = Math.floor(b * PAPERS.length);
  const papers = PAPERS.map((_, i) => PAPERS[(i + offset) % PAPERS.length] ?? MONO.paper);
  const paper = papers.find((p) => contrast(hex(ink), hex(p)) > 4.5) ?? papers[0] ?? MONO.paper;
  return { ...state, seed: s2, ink, paper, colored: true };
}

/** The colour of picture pixel (x, y) in a w by h picture. */
export function dancingPixel(state: DancingState, w: number, h: number): (x: number, y: number) => Rgb {
  const ink = hex(state.colored ? state.ink : MONO.ink);
  const paper = hex(state.colored ? state.paper : MONO.paper);
  const noise = createNoise3(state.field);
  const n = Math.max(1, Math.min(state.lines, Math.floor(w / MIN_SLOT)));
  const slot = w / n;
  const maxWidth = slot - (PADDING_RATIO * slot) / 2;
  const breakSize = lerp(h / 16, h / 2, BREAK_RATIO);
  const spacing = n > 1 ? (w - maxWidth) / (n - 1) : 0;
  const bars = Array.from({ length: n }, (_, k) => {
    const u = n > 1 ? k / (n - 1) : 0;
    const m = 0.5 * noise2(noise, Math.floor(k / state.group) / 2, state.t / 200) + 0.5;
    const width = 0.5 * noise2(noise, u * 4, state.t / 500) + 0.5;
    return {
      x: lerp(maxWidth / 2, w - maxWidth / 2, u),
      breakY: lerp(breakSize / 2, h - breakSize / 2, m),
      line: lerp(maxWidth / 10, maxWidth, width) / 2,
      wide: lerp(maxWidth, maxWidth / 8, width) / 2,
    };
  });
  return (x, y) => {
    const k = spacing > 0 ? Math.max(0, Math.min(n - 1, Math.round((x - maxWidth / 2) / spacing))) : 0;
    const bar = bars[k];
    if (bar === undefined) return paper;
    const half = Math.abs(y - bar.breakY) <= breakSize / 2 ? bar.wide : bar.line;
    return Math.abs(x - bar.x) <= half ? ink : paper;
  };
}

export const dancing: Demo<DancingState> = {
  id: 'dancing-noise',
  name: 'Dancing to the Noise',
  description: 'Bars broken by blocks that rise, fall and swell with a drifting noise field, after Saneef Ansari',
  keys: 'r new field, + and - bars, g group size, c random colours, m monochrome, h hides the panel, space pause',
  init(seed) {
    const [a, next] = nextRandom(seed);
    return { seed: next, field: Math.floor(a * 0x100000000), t: 0, lines: 90, group: 6, ...MONO, colored: false, hideUI: false };
  },
  update(msg, state) {
    if (msg.type === 'pulse') return { ...state, t: state.t + msg.dt * 60 };
    if (msg.type !== 'key') return state;
    switch (msg.key) {
      case 'r': {
        const [a, seed] = nextRandom(state.seed);
        return { ...state, seed, field: Math.floor(a * 0x100000000) };
      }
      case '+': case '=': return { ...state, lines: Math.min(MAX_LINES, state.lines + LINE_STEP) };
      case '-': return { ...state, lines: Math.max(MIN_LINES, state.lines - LINE_STEP) };
      case 'g': return { ...state, group: state.group >= MAX_GROUP ? 1 : state.group + 1 };
      case 'c': return shuffle(state);
      case 'm': return { ...state, colored: false };
      case 'h': return { ...state, hideUI: !state.hideUI };
      default: return state;
    }
  },
  view(state, { width, height, ctx }) {
    const surface = createSurface(width, height);
    paintPixels(surface, dancingPixel(state, width, height * 2), 2);
    if (!state.hideUI) {
      const shown = Math.max(1, Math.min(state.lines, Math.floor(width / MIN_SLOT)));
      stampPanel(surface, [
        '  ***  DANCING TO THE NOISE  ***  ',
        '─',
        `  ${String(state.lines)} bars${shown < state.lines ? ` (${String(shown)} fit)` : ''}, groups of ${String(state.group)}`,
        state.colored ? `  ink ${state.ink} on ${state.paper}` : '  monochrome',
        '  - R : New field    - + / - : Bars',
        '  - G : Group size   - C / M : Colours',
        '  - H : Hide panel',
      ], ctx, (free) => ({ x: Math.max(0, Math.min(2, free.x - 2)), y: Math.max(0, free.y - 1) }));
    }
    return surface;
  },
};

export const dancingDemo = defineDemo(dancing);
