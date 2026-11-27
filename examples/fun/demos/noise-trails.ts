// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// After "Generating SVGs" by makio135 (Observable): hundreds of trails follow a noise field from a point to a
// full stroke and end in a round head, in a shuffled palette over its first colour. Here the field drifts.
import { createSurface } from '@flyingrobots/bijou';
import { defineDemo, type Demo } from '../contract.js';
import { stampPanel } from '../panel.js';
import { forkSeed, rollPalette, type MakioPalette } from './makio-palette.js';
import { createNoise3 } from './noise.js';
import { rasterizeTrails, trailCount } from './noise-trails-raster.js';
import { hex, paintPixels, type Rgb } from './pixels.js';

export interface NoiseTrailsState {
  /** Seeds the next composition. */
  readonly seed: number;
  readonly trailSeed: number;
  readonly noiseSeed: number;
  readonly palette: MakioPalette;
  /** The original's `n`: trails on its A4 sheet. */
  readonly count: number;
  /** Seconds of drift, and the drift step the picture was last traced at. */
  readonly clock: number;
  readonly step: number;
  /** The traced picture in sub-pixels, three floats each; before the first resize an 80 by 24 pane's worth. */
  readonly width: number;
  readonly height: number;
  readonly rgb: Float32Array;
  readonly hideUI: boolean;
}

const START_COUNT = 1200;
const MIN_COUNT = 200;
const MAX_COUNT = 2400;
const COUNT_STEP = 200;
const SUPERSAMPLE = 2;
/** How far the field drifts, in noise units per second, and how often the trails are traced again. */
const DRIFT = 0.04;
const TRACES_PER_SECOND = 8;

/** Trace the trails for the state's composition, size and drift step. */
function retrace(state: Omit<NoiseTrailsState, 'rgb'>): NoiseTrailsState {
  const [ground = '#ffffff', ...inks] = state.palette.colours;
  const rgb = rasterizeTrails({
    width: state.width, height: state.height, count: state.count, seed: state.trailSeed,
    z: (state.step / TRACES_PER_SECOND) * DRIFT, ground: hex(ground), inks: (inks.length > 0 ? inks : [ground]).map(hex),
  }, createNoise3(state.noiseSeed));
  return { ...state, rgb };
}

type Kept = Pick<NoiseTrailsState, 'count' | 'clock' | 'step' | 'width' | 'height' | 'hideUI'>;

/** A new composition: a palette, the trails' start points and colours, and a noise field. */
export function roll(seed: number, keep: Kept): NoiseTrailsState {
  const [palette, s1] = rollPalette(seed);
  const [trailSeed, s2] = forkSeed(s1);
  const [noiseSeed, s3] = forkSeed(s2);
  const { count, clock, step, width, height, hideUI } = keep;
  return retrace({ count, clock, step, width, height, hideUI, seed: s3, trailSeed, noiseSeed, palette });
}

/** Let the field drift, tracing again whenever it reaches a new step. */
function tick(state: NoiseTrailsState, dt: number): NoiseTrailsState {
  const clock = state.clock + dt;
  const step = Math.floor(clock * TRACES_PER_SECOND);
  return step === state.step ? { ...state, clock } : retrace({ ...state, clock, step });
}

export const noiseTrails: Demo<NoiseTrailsState> = {
  id: 'noise-trails',
  name: 'Noise Trails',
  description: 'Tapered trails that follow a drifting noise field, each ending in a round head, after makio135',
  keys: 'r new composition, + and - trails, h hides the panel, space pause',
  init: (seed) => roll(seed, { count: START_COUNT, clock: 0, step: 0, width: 80 * SUPERSAMPLE, height: 48 * SUPERSAMPLE, hideUI: false }),
  update(msg, state) {
    if (msg.type === 'pulse') return tick(state, msg.dt);
    if (msg.type === 'resize') {
      const width = msg.width * SUPERSAMPLE;
      const height = msg.height * 2 * SUPERSAMPLE;
      return width === state.width && height === state.height ? state : retrace({ ...state, width, height });
    }
    if (msg.type !== 'key') return state;
    if (msg.key === 'r') return roll(state.seed, state);
    if (msg.key === '+' || msg.key === '=') return retrace({ ...state, count: Math.min(MAX_COUNT, state.count + COUNT_STEP) });
    if (msg.key === '-') return retrace({ ...state, count: Math.max(MIN_COUNT, state.count - COUNT_STEP) });
    return msg.key === 'h' ? { ...state, hideUI: !state.hideUI } : state;
  },
  view(state, { width, height, ctx }) {
    const surface = createSurface(width, height);
    const { rgb, width: w, height: h } = state;
    paintPixels(surface, (x, y): Rgb => {
      const sx = Math.min(w - 1, Math.floor((x / width) * w));
      const sy = Math.min(h - 1, Math.floor((y / (height * 2)) * h));
      const i = (sy * w + sx) * 3;
      return [rgb[i] ?? 0, rgb[i + 1] ?? 0, rgb[i + 2] ?? 0];
    }, SUPERSAMPLE);
    if (!state.hideUI) {
      stampPanel(surface, [
        '  ***  NOISE TRAILS  ***  ',
        '─',
        `  ${String(trailCount(state.count, w, h))} trails (${String(state.count)} per sheet)`,
        `  palette ${state.palette.name}`,
        '  - R     : New composition',
        '  - + / - : Trails',
        '  - H     : Hide panel',
      ], ctx, (free) => ({ x: Math.max(0, Math.min(2, free.x - 2)), y: Math.max(0, free.y - 1) }));
    }
    return surface;
  },
};

export const noiseTrailsDemo = defineDemo(noiseTrails);
