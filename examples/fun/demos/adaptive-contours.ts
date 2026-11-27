// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// After "Adaptive Contouring in Fragment Shaders" (locally scaled domain coloring,
// part 1: contour plots) by Ricky Reusser (Observable): contours of the log of
// |(z - 1) / (z + 1) · (z - m)|, built up stage by stage from a triangle-wave colour
// map to octave-blended, locally scaled lines and shading. The original moves the
// root m with the mouse; here it orbits gently until the pointer takes it.
import { createSurface } from '@flyingrobots/bijou';
import { defineDemo, type Demo } from '../contract.js';
import { stampPanel } from '../panel.js';
import { nextRandom } from '../random.js';
import { sampleField, toPlane, type PlaneView } from './adaptive-contours-field.js';
import { STAGES, stageAt, toRgb } from './adaptive-contours-stages.js';
import { paintPixels } from './pixels.js';

/** The path the movable root follows while the pointer is away. */
export interface Orbit {
  readonly cx: number;
  readonly cy: number;
  readonly radius: number;
  /** Radians per second; the sign sets the direction. */
  readonly speed: number;
  readonly phase: number;
}

export interface AdaptiveContoursState {
  readonly seed: number;
  readonly stage: number;
  /** Density level: the density multiplier is 2^(level / 2). */
  readonly level: number;
  readonly linear: boolean;
  readonly hideUI: boolean;
  /** Seconds of animation, advanced by pulses. */
  readonly t: number;
  readonly orbit: Orbit;
  /** The pointer in cells, or null once it has left the pane. */
  readonly pointer: { readonly col: number; readonly row: number } | null;
}

const MIN_LEVEL = -2;
const MAX_LEVEL = 4;
/** The notebook's commented-out animation: zoom = 2 sin(t / 3), view scale 2 · 10^-zoom. */
const ZOOM_AMPLITUDE = 2;
const ZOOM_PERIOD = 3;

/** A new orbit for the root from the seed: near the origin, between the zero at 1 and the pole at -1. */
export function rollOrbit(seed: number): readonly [Orbit, number] {
  const [a, s1] = nextRandom(seed);
  const [b, s2] = nextRandom(s1);
  const [c, s3] = nextRandom(s2);
  const [d, s4] = nextRandom(s3);
  const [e, s5] = nextRandom(s4);
  const orbit = {
    cx: (a - 0.5) * 0.8,
    cy: (b - 0.5) * 0.8,
    radius: 0.3 + 0.4 * c,
    speed: (d < 0.5 ? -1 : 1) * (0.35 + 0.25 * e),
    phase: a * Math.PI * 2,
  };
  return [orbit, s5];
}

/** Where the root sits on its orbit at time t. */
export function orbitAt(orbit: Orbit, t: number): readonly [number, number] {
  const angle = orbit.phase + orbit.speed * t;
  return [orbit.cx + orbit.radius * Math.cos(angle), orbit.cy + orbit.radius * 0.7 * Math.sin(angle)];
}

const density = (level: number): number => 2 ** (level / 2);

export const adaptiveContours: Demo<AdaptiveContoursState> = {
  id: 'adaptive-contours',
  name: 'Adaptive Contours',
  description: 'Steps from log stripes to adaptive, octave-blended contours of a complex map, after Ricky Reusser',
  keys: '[ and ] (or p and n) stages, + and - density, l log or linear, r new orbit, pointer moves the root, h hides the panel, space pause',
  init(seed) {
    const [orbit, next] = rollOrbit(seed);
    return { seed: next, stage: 0, level: 0, linear: false, hideUI: false, t: 0, orbit, pointer: null };
  },
  update(msg, state) {
    if (msg.type === 'pulse') return { ...state, t: state.t + msg.dt };
    if (msg.type === 'pointer') return { ...state, pointer: { col: msg.col, row: msg.row } };
    if (msg.type === 'pointer-leave') return { ...state, pointer: null };
    if (msg.type !== 'key') return state;
    const n = STAGES.length;
    if (msg.key === ']' || msg.key === 'n') return { ...state, stage: (state.stage + 1) % n };
    if (msg.key === '[' || msg.key === 'p') return { ...state, stage: (state.stage + n - 1) % n };
    if (msg.key === '+' || msg.key === '=') return { ...state, level: Math.min(MAX_LEVEL, state.level + 1) };
    if (msg.key === '-') return { ...state, level: Math.max(MIN_LEVEL, state.level - 1) };
    if (msg.key === 'l') return { ...state, linear: !state.linear };
    if (msg.key === 'r') {
      const [orbit, seed] = rollOrbit(state.seed);
      return { ...state, orbit, seed };
    }
    return msg.key === 'h' ? { ...state, hideUI: !state.hideUI } : state;
  },
  view(state, { width, height, ctx }) {
    const surface = createSurface(width, height);
    const stage = stageAt(state.stage);
    const zoom = stage.zooms ? ZOOM_AMPLITUDE * Math.sin(state.t / ZOOM_PERIOD) : 0;
    const base: PlaneView = { w: width, h: height * 2, scale: 2 * 10 ** -zoom, rootX: 0, rootY: 0 };
    const [rootX, rootY] = state.pointer === null
      ? orbitAt(state.orbit, state.t)
      : toPlane(base, state.pointer.col + 0.5, state.pointer.row * 2 + 1);
    const view: PlaneView = { ...base, rootX, rootY };
    const params = { density: density(state.level), linear: state.linear };
    paintPixels(surface, (x, y) => toRgb(stage.shade(sampleField(view, x, y), params)), 2);
    if (!state.hideUI) {
      const placement = stage.scaled && state.linear ? 'linear' : 'logarithmic';
      stampPanel(surface, [
        '  ***  ADAPTIVE CONTOURS  ***  ',
        '─',
        `  Stage ${String(state.stage + 1)}/${String(STAGES.length)}: ${stage.name}`,
        `  ${stage.adds}`,
        `  density x${density(state.level).toFixed(2)}, ${placement}${stage.zooms ? `, zoom ${zoom.toFixed(2)}` : ''}`,
        '  - [ / ]   : Previous / next stage',
        '  - + / -   : Contour density',
        '  - L       : Log / linear spacing',
        '  - R       : New orbit for the root',
        '  - Pointer : Move the root',
        '  - H       : Hide panel',
      ], ctx, (free) => ({ x: Math.max(0, Math.min(2, free.x - 2)), y: Math.max(0, free.y - 1) }));
    }
    return surface;
  },
};

export const adaptiveContoursDemo = defineDemo(adaptiveContours);
