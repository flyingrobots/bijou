// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// Lenia, the continuous cellular automaton of Bert Chan ("Lenia: Biology of Artificial Life", 2019): smooth states,
// a smooth ring kernel and a Gaussian growth function, in which the Orbium glides across a torus like a living cell.
import { createSurface } from '@flyingrobots/bijou';
import { defineDemo, type Demo } from '../contract.js';
import { stampPanel } from '../panel.js';
import { nextRandom } from '../random.js';
import { paintLenia, RAMPS } from './lenia-paint.js';
import { SCENES } from './lenia-species.js';
import { addOrbium, gridFor, RADIUS, seedWorld, step, type World } from './lenia-sim.js';

export interface LeniaState {
  readonly world: World;
  readonly seed: number;
  readonly scene: number;
  readonly mu: number;
  readonly sigma: number;
  readonly ramp: number;
  /** Lenia steps per pulse: `+` and `-` set it between 1 and 4. */
  readonly speed: number;
  /** The pane in cells, so a pointer position maps onto the grid. */
  readonly pane: { readonly width: number; readonly height: number };
  /** Where the pointer last dropped a creature, in grid cells; null once it leaves. */
  readonly dropped: { readonly x: number; readonly y: number } | null;
  readonly steps: number;
  readonly hideUI: boolean;
}

/** The Orbium's published growth centre and width. */
export const ORBIUM_MU = 0.15;
export const ORBIUM_SIGMA = 0.015;
const MU_STEP = 0.002;
const SIGMA_STEP = 0.0005;
/** The pointer drops another Orbium once it has moved this many grid cells from the last one. */
const DROP_SPACING = RADIUS * 2;

/** A fresh world of scene `scene` for the current pane; `fresh` also restores the scene's own growth settings. */
export function reseed(state: LeniaState, scene: number, seed: number, fresh = false): LeniaState {
  const [gw, gh] = gridFor(state.pane.width, state.pane.height);
  const index = ((scene % SCENES.length) + SCENES.length) % SCENES.length;
  const [world, next] = seedWorld(gw, gh, index, seed);
  const chosen = SCENES[index];
  const growth = fresh && chosen !== undefined ? { mu: chosen.mu, sigma: chosen.sigma } : {};
  return { ...state, ...growth, world, seed: next, scene: index, dropped: null, steps: 0 };
}

function drop(state: LeniaState, col: number, row: number): LeniaState {
  const { world, pane } = state;
  const x = ((col + 0.5) * world.width) / Math.max(1, pane.width);
  const y = ((row + 0.5) * world.height) / Math.max(1, pane.height);
  const last = state.dropped;
  if (last !== null && Math.hypot(x - last.x, y - last.y) < DROP_SPACING) return state;
  const [t, seed] = nextRandom(state.seed);
  return { ...state, world: addOrbium(world, x, y, Math.floor(t * 4), t > 0.5), seed, dropped: { x, y } };
}

function advance(state: LeniaState): LeniaState {
  let world = state.world;
  for (let k = 0; k < state.speed; k += 1) world = step(world, state.mu, state.sigma);
  return { ...state, world, steps: state.steps + state.speed };
}

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

function onKey(key: string, state: LeniaState): LeniaState {
  switch (key) {
    case '[': return { ...state, mu: clamp(state.mu - MU_STEP, 0.05, 0.5) };
    case ']': return { ...state, mu: clamp(state.mu + MU_STEP, 0.05, 0.5) };
    case ',': return { ...state, sigma: clamp(state.sigma - SIGMA_STEP, 0.002, 0.1) };
    case '.': return { ...state, sigma: clamp(state.sigma + SIGMA_STEP, 0.002, 0.1) };
    case '+': case '=': return { ...state, speed: Math.min(4, state.speed + 1) };
    case '-': return { ...state, speed: Math.max(1, state.speed - 1) };
    case 's': return reseed(state, state.scene + 1, state.seed, true);
    case 'r': return reseed(state, state.scene, state.seed, true);
    case 'c': return { ...state, ramp: (state.ramp + 1) % RAMPS.length };
    case 'h': return { ...state, hideUI: !state.hideUI };
    default: return state;
  }
}

export const lenia: Demo<LeniaState> = {
  id: 'lenia',
  name: 'Lenia',
  description: 'Bert Chan\'s continuous cellular automaton: Orbium creatures glide, pulse and divide on a torus',
  keys: 'pointer drops an Orbium, [ ] mu, , . sigma, s scene, r reseed, c colours, + - speed, h hides the panel',
  init(seed) {
    // An 80 by 24 pane until the host says how big it is, so the creatures move before the first resize.
    const blank: LeniaState = {
      world: { width: 0, height: 0, cells: new Float32Array(0), potential: new Float32Array(0) },
      seed, scene: 0, mu: ORBIUM_MU, sigma: ORBIUM_SIGMA, ramp: 0, speed: 2,
      pane: { width: 80, height: 24 }, dropped: null, steps: 0, hideUI: false,
    };
    return reseed(blank, 1, seed, true);
  },
  update(msg, state) {
    if (msg.type === 'resize') {
      const pane = { width: msg.width, height: msg.height };
      const [gw, gh] = gridFor(msg.width, msg.height);
      const same = gw === state.world.width && gh === state.world.height;
      return same ? { ...state, pane } : reseed({ ...state, pane }, state.scene, state.seed);
    }
    if (msg.type === 'pulse') return advance(state);
    if (msg.type === 'pointer') return drop(state, msg.col, msg.row);
    if (msg.type === 'pointer-leave') return { ...state, dropped: null };
    return onKey(msg.key, state);
  },
  view(state, { width, height, ctx }) {
    const surface = createSurface(width, height);
    paintLenia(surface, state.world, RAMPS[state.ramp] ?? { name: 'magma', stops: [] });
    if (!state.hideUI) {
      let mass = 0;
      for (const v of state.world.cells) mass += v;
      stampPanel(surface, [
        '  ***  LENIA  ***  after Bert Chan',
        '─',
        `  Scene : ${SCENES[state.scene]?.name ?? ''}`,
        `  mu    : ${state.mu.toFixed(3)}   sigma : ${state.sigma.toFixed(4)}`,
        `  Grid  : ${String(state.world.width)} x ${String(state.world.height)}   R ${String(RADIUS)}`,
        `  Mass  : ${mass.toFixed(0)}   t ${(state.steps / 10).toFixed(1)}`,
        '─',
        '  - POINTER : Drop an Orbium',
        '  - [ / ]   : Mutate mu',
        '  - , / .   : Mutate sigma',
        '  - S / R   : Next scene / Reseed',
        '  - C / +-  : Colours / Speed',
        '  - H       : Hide panel',
      ], ctx, (free) => ({ x: Math.max(0, Math.min(2, free.x - 2)), y: Math.max(0, free.y - 1) }));
    }
    return surface;
  },
};

export const leniaDemo = defineDemo(lenia);
