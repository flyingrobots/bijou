// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// After "Generating SVGs /10" by makio135 (Observable): concentric dashed rings around a random centre, bulging
// more and more with one noise loop towards the outside, over a shuffled palette's first colour. Here the bulge
// drifts and the dashes creep along their rings, neighbours in opposite directions.
import { createSurface } from '@flyingrobots/bijou';
import { defineDemo, type Demo } from '../contract.js';
import { stampPanel } from '../panel.js';
import { nextRandom } from '../random.js';
import { arcLengths, bulges, makeRings, ringsPixel, type Ring } from './dashed-rings-geometry.js';
import { forkSeed, rollPalette, type MakioPalette } from './makio-palette.js';
import { createNoise3 } from './noise.js';
import { hex, paintPixels } from './pixels.js';

export interface DashedRingsState {
  /** Seeds the next composition. */
  readonly seed: number;
  readonly ringSeed: number;
  readonly noiseSeed: number;
  readonly palette: MakioPalette;
  /** The centre as fractions of the picture. */
  readonly fx: number;
  readonly fy: number;
  /** The original's `n`. */
  readonly n: number;
  readonly rings: readonly Ring[];
  readonly hideUI: boolean;
}

/** The original draws 120 rings on a page; a pane has room for fewer before they blur together. */
const START_RINGS = 40;
const MIN_RINGS = 16;
const MAX_RINGS = 120;
const RING_STEP = 8;
const SUPERSAMPLE = 2;
/** The outermost ring's unbulged radius, as a share of the picture's diagonal. */
const REACH = 0.9;
/** Noise units per second the bulge drifts, and the original's pixels per second the dashes creep. */
const DRIFT = 0.05;
const CREEP = 12;

const inkCount = (palette: MakioPalette): number => Math.max(1, palette.colours.length - 1);

/** A new composition: palette, centre, dash patterns and noise loop. */
export function roll(seed: number, keep: Pick<DashedRingsState, 'n' | 'hideUI'> = { n: START_RINGS, hideUI: false }): DashedRingsState {
  const [palette, s1] = rollPalette(seed);
  const [fx, s2] = nextRandom(s1);
  const [fy, s3] = nextRandom(s2);
  const [ringSeed, s4] = forkSeed(s3);
  const [noiseSeed, s5] = forkSeed(s4);
  return { ...keep, seed: s5, palette, fx, fy, ringSeed, noiseSeed, rings: makeRings(ringSeed, keep.n, inkCount(palette)) };
}

function withRings(state: DashedRingsState, n: number): DashedRingsState {
  return { ...state, n, rings: makeRings(state.ringSeed, n, inkCount(state.palette)) };
}

export const dashedRings: Demo<DashedRingsState> = {
  id: 'dashed-rings',
  name: 'Dashed Rings',
  description: 'Concentric dashed rings that bulge with a noise loop towards the outside, after makio135',
  keys: 'r new composition, + and - rings, h hides the panel, space pause',
  init: (seed) => roll(seed),
  update(msg, state) {
    if (msg.type !== 'key') return state;
    if (msg.key === 'r') return roll(state.seed, state);
    if (msg.key === '+' || msg.key === '=') return withRings(state, Math.min(MAX_RINGS, state.n + RING_STEP));
    if (msg.key === '-') return withRings(state, Math.max(MIN_RINGS, state.n - RING_STEP));
    return msg.key === 'h' ? { ...state, hideUI: !state.hideUI } : state;
  },
  view(state, { width, height, elapsed, ctx }) {
    const surface = createSurface(width, height);
    const pw = width;
    const ph = height * 2;
    const scale = (20 + 8 * state.n) / Math.max(1, REACH * Math.hypot(pw, ph));
    const noise = createNoise3(state.noiseSeed);
    const bulge = bulges(noise, elapsed * DRIFT);
    const [ground = '#ffffff', ...inks] = state.palette.colours;
    paintPixels(surface, ringsPixel({
      rings: state.rings,
      inks: (inks.length > 0 ? inks : [ground]).map(hex),
      ground: hex(ground),
      cx: state.fx * pw * scale,
      cy: state.fy * ph * scale,
      scale,
      bulge,
      arcs: arcLengths(state.rings, bulge),
      creep: elapsed * CREEP,
    }), SUPERSAMPLE);
    if (!state.hideUI) {
      stampPanel(surface, [
        '  ***  DASHED RINGS  ***  ',
        '─',
        `  ${String(state.n)} rings, palette ${state.palette.name}`,
        '  - R     : New composition',
        '  - + / - : Rings',
        '  - H     : Hide panel',
      ], ctx, (free) => ({ x: Math.max(0, Math.min(2, free.x - 2)), y: Math.max(0, free.y - 1) }));
    }
    return surface;
  },
};

export const dashedRingsDemo = defineDemo(dashedRings);
