// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// After "Lenses" by Claudio Esperança (Observable): 80 rays fan out from a point source through two
// thin lenses (blue and red, either may be a mirror), drawn as rays or as the wave fronts they carry.
// The original holds still in its rays view; here the source drifts until the pointer takes it.
import { createSurface } from '@flyingrobots/bijou';
import { defineDemo, type Demo } from '../contract.js';
import { stampPanel } from '../panel.js';
import { nextRandom } from '../random.js';
import { makeLens, trajectory, type Vec } from './lenses-optics.js';
import { drawLens, drawRays, drawWaveFronts, makeDots, paintDots } from './lenses-render.js';
import type { Rgb } from './pixels.js';

const VIEWS = ['rays', 'wave fronts', 'animated wave fronts'] as const;

export interface LensesState {
  readonly focal: readonly [number, number];
  readonly mirror: readonly [boolean, boolean];
  readonly view: number;
  readonly smooth: boolean;
  /** The ray length, the original's tmax slider, in canvas units. */
  readonly tMax: number;
  /** Seconds of source drift, and the animated wave fronts' offset (the original's tmin). */
  readonly drift: number;
  readonly tmin: number;
  readonly pointer: { readonly col: number; readonly row: number } | null;
  readonly seed: number;
  readonly hideUI: boolean;
}

/** The original's canvas is the notebook's width; take a typical 960 so focal lengths keep their proportion. */
const CANVAS_WIDTH = 960;
const RAYS = 80;
const FOCAL_STEP = 25;
const MAX_FOCAL = 500;
const WAVE_STEP = 50;
/** The original adds 2 to tmin per frame and wraps it past 50. */
const WAVE_SPEED = 2;
/** The drifting source sweeps a quarter of the height above and below centre every 16 seconds. */
const DRIFT_PERIOD = 16;
/** Inks: none, rays in white, lens 1 in blue, lens 2 in red (both lifted a little to read on black). */
const INKS: readonly Rgb[] = [[0, 0, 0], [255, 255, 255], [70, 110, 255], [255, 60, 60]];

const clampFocal = (f: number): number => {
  const c = Math.max(-MAX_FOCAL, Math.min(MAX_FOCAL, f));
  return c === 0 ? FOCAL_STEP : c;
};

/** A new composition: two focal lengths in steps of 25 from -300 to 300, and each lens a mirror one time in five. */
export function roll(state: LensesState): LensesState {
  const [a, s1] = nextRandom(state.seed);
  const [b, s2] = nextRandom(s1);
  const [c, s3] = nextRandom(s2);
  const [d, s4] = nextRandom(s3);
  const focal = (u: number): number => clampFocal(FOCAL_STEP * (Math.floor(u * 25) - 12));
  return { ...state, seed: s4, focal: [focal(a), focal(b)], mirror: [c < 0.2, d < 0.2] };
}

function source(state: LensesState, width: number, height: number, canvasHeight: number): Vec {
  if (state.pointer === null) return [0, canvasHeight / 2 + Math.sin((state.drift * Math.PI * 2) / DRIFT_PERIOD) * canvasHeight / 4];
  return [((state.pointer.col + 0.5) / width) * CANVAS_WIDTH, ((state.pointer.row + 0.5) / height) * canvasHeight];
}

export const lenses: Demo<LensesState> = {
  id: 'lenses',
  name: 'Lenses',
  description: 'Rays and wave fronts from a point source through two thin lenses, after Claudio Esperança',
  keys: 'pointer moves the source, r new lenses, + and - focal length, v view, m mirrors, s smooth, [ and ] ray length, h hides the panel, space pause',
  init: (seed) => ({
    focal: [100, 100], mirror: [false, false], view: 0, smooth: false, tMax: CANVAS_WIDTH,
    drift: 0, tmin: 0, pointer: null, seed, hideUI: false,
  }),
  update(msg, state) {
    if (msg.type === 'pulse') {
      const tmin = VIEWS[state.view] === 'animated wave fronts' ? (state.tmin + WAVE_SPEED * msg.dt * 60) % WAVE_STEP : state.tmin;
      return { ...state, tmin, drift: state.pointer === null ? (state.drift + msg.dt) % DRIFT_PERIOD : state.drift };
    }
    if (msg.type === 'pointer') return { ...state, pointer: { col: msg.col, row: msg.row } };
    if (msg.type === 'pointer-leave') return { ...state, pointer: null };
    if (msg.type !== 'key') return state;
    const step = (by: number): LensesState => ({ ...state, focal: [clampFocal(state.focal[0] + by), clampFocal(state.focal[1] + by)] });
    if (msg.key === 'r') return roll(state);
    if (msg.key === '+' || msg.key === '=') return step(FOCAL_STEP);
    if (msg.key === '-') return step(-FOCAL_STEP);
    if (msg.key === 'v') return { ...state, view: (state.view + 1) % VIEWS.length, tmin: 0 };
    if (msg.key === 'm') {
      const next = (Number(state.mirror[0]) + 2 * Number(state.mirror[1]) + 1) % 4;
      return { ...state, mirror: [next % 2 === 1, next >= 2] };
    }
    if (msg.key === 's') return { ...state, smooth: !state.smooth };
    if (msg.key === ']') return { ...state, tMax: Math.min(CANVAS_WIDTH * 4, state.tMax + 100) };
    if (msg.key === '[') return { ...state, tMax: Math.max(100, state.tMax - 100) };
    return msg.key === 'h' ? { ...state, hideUI: !state.hideUI } : state;
  },
  view(state, { width, height, ctx }) {
    const surface = createSurface(width, height);
    const dots = makeDots(width, height, CANVAS_WIDTH);
    const h = dots.width === 0 ? 0 : (dots.height / dots.width) * CANVAS_WIDTH;
    const lensList = [
      makeLens([CANVAS_WIDTH / 3, h / 2], [1, 0], state.focal[0], h / 2, state.mirror[0]),
      makeLens([(2 * CANVAS_WIDTH) / 3, h / 2], [1, 0], state.focal[1], h / 2, state.mirror[1]),
    ];
    const from = source(state, width, height, h);
    const trajectories = Array.from({ length: RAYS }, (_, i) => {
      const angle = (i * Math.PI * 2) / RAYS + Math.PI;
      return trajectory({ p: from, v: [Math.cos(angle), Math.sin(angle)] }, lensList, state.tMax);
    });
    lensList.forEach((lens, i) => { drawLens(dots, lens, i + 2); });
    const view = VIEWS[state.view] ?? 'rays';
    if (view === 'rays') drawRays(dots, trajectories, 1);
    else drawWaveFronts(dots, trajectories, [state.tmin, state.tMax], WAVE_STEP, state.smooth, 1);
    paintDots(surface, dots, INKS);
    if (!state.hideUI) {
      const lensText = (i: 0 | 1): string => `${state.mirror[i] ? 'mirror' : 'lens'} f ${String(state.focal[i])}`;
      stampPanel(surface, [
        '  ***  LENSES  ***  ',
        '─',
        `  blue ${lensText(0)}, red ${lensText(1)}`,
        `  ${view}${state.smooth ? ', smooth' : ''}, ray length ${String(state.tMax)}`,
        '  - POINTER : Move source   - V : View',
        '  - R       : New lenses    - M : Mirrors',
        '  - + / -   : Focal length  - S : Smooth',
        '  - [ / ]   : Ray length    - H : Hide panel',
      ], ctx, (free) => ({ x: Math.max(0, Math.min(2, free.x - 2)), y: Math.max(0, free.y - 1) }));
    }
    return surface;
  },
};

export const lensesDemo = defineDemo(lenses);
