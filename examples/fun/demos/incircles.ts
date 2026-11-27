// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// After "Voronoi Incircles Trippy Edition" by an unnamed author (Observable notebook
// d/86d48f3d09ee7c6a), after Mike Bostock's Voronoi Incircles: wandering sites, each
// Voronoi cell's largest circle in white, smeared by a faint fill that never quite clears.
import { createSurface } from '@flyingrobots/bijou';
import { defineDemo, type Demo } from '../contract.js';
import { stampPanel } from '../panel.js';
import { canvasWidth, emptyGlow, move, paint, restretch, scatter, type Field, type Glow } from './incircles-sim.js';
import { paintPixels } from './pixels.js';

export interface IncirclesState {
  readonly seed: number;
  readonly field: Field;
  readonly glow: Glow;
  /** Sites, the original's `n`. */
  readonly count: number;
  /** Fractional 60 Hz frames not yet stepped. */
  readonly pending: number;
  readonly trails: boolean;
  readonly hideUI: boolean;
}

const SUPERSAMPLE = 2;
const MIN_COUNT = 20;
const MAX_COUNT = 300;
/** The most frames one pulse steps, so a stalled host does not freeze on catching up. */
const MAX_STEPS = 4;

/** A glow at picture sub-pixels for a pane of this many cells. */
const glowFor = (width: number, height: number): Glow => emptyGlow(width * SUPERSAMPLE, height * 2 * SUPERSAMPLE);

/** New sites at rest, scattered over the canvas. */
function rescatter(state: IncirclesState): IncirclesState {
  const [field, seed] = scatter({ width: canvasWidth(state.glow), positions: [], velocities: [] }, state.count, state.seed);
  return { ...state, field, seed, glow: emptyGlow(state.glow.width, state.glow.height) };
}

function recount(state: IncirclesState, count: number): IncirclesState {
  const [field, seed] = scatter(state.field, count, state.seed);
  return { ...state, count, field, seed };
}

function advance(state: IncirclesState, frames: number): IncirclesState {
  let { field, glow, seed } = state;
  const total = state.pending + frames;
  const steps = Math.min(MAX_STEPS, Math.floor(total));
  for (let i = 0; i < steps; i += 1) {
    glow = paint(glow, field, state.trails);
    [field, seed] = move(field, seed);
  }
  return { ...state, field, glow, seed, pending: steps === MAX_STEPS ? 0 : total - steps };
}

export const incircles: Demo<IncirclesState> = {
  id: 'voronoi-incircles',
  name: 'Voronoi Incircles',
  description: 'Wandering Voronoi cells, each with its largest circle in white, smeared into trails',
  keys: 'r scatter the sites, + and - sites, t trails, h hides the panel, space pause',
  init(seed) {
    // An 80 by 24 pane until the host says how big it is.
    const glow = glowFor(80, 24);
    const start: IncirclesState = {
      seed, glow, count: 100, pending: 0, trails: true, hideUI: false,
      field: { width: canvasWidth(glow), positions: [], velocities: [] },
    };
    return rescatter(start);
  },
  update(msg, state) {
    if (msg.type === 'resize') {
      const glow = glowFor(msg.width, msg.height);
      return { ...state, glow, field: restretch(state.field, canvasWidth(glow)) };
    }
    if (msg.type === 'pulse') return advance(state, msg.dt * 60);
    if (msg.type !== 'key') return state;
    if (msg.key === 'r') return rescatter(state);
    if (msg.key === '+' || msg.key === '=') return recount(state, Math.min(MAX_COUNT, state.count + 20));
    if (msg.key === '-') return recount(state, Math.max(MIN_COUNT, state.count - 20));
    if (msg.key === 't') return { ...state, trails: !state.trails };
    return msg.key === 'h' ? { ...state, hideUI: !state.hideUI } : state;
  },
  view(state, { width, height, ctx }) {
    const surface = createSurface(width, height);
    const { glow } = state;
    // The glow may be a pane behind the view after a resize: sample it in proportion.
    const kx = glow.width / width;
    const ky = glow.height / (height * 2);
    paintPixels(surface, (x, y) => {
      const gx = Math.min(glow.width - 1, Math.floor(x * kx));
      const gy = Math.min(glow.height - 1, Math.floor(y * ky));
      const v = glow.light[gy * glow.width + gx] ?? 0;
      return [v, v, v];
    }, SUPERSAMPLE);
    if (!state.hideUI) {
      stampPanel(surface, [
        '  ***  VORONOI INCIRCLES  ***  ',
        '─',
        `  ${String(state.count)} sites, trails ${state.trails ? 'on' : 'off'}`,
        '  - R     : Scatter the sites',
        '  - + / - : Sites',
        '  - T     : Trails',
        '  - H     : Hide panel',
      ], ctx, (free) => ({ x: Math.max(0, Math.min(2, free.x - 2)), y: Math.max(0, free.y - 1) }));
    }
    return surface;
  },
};

export const incirclesDemo = defineDemo(incircles);
