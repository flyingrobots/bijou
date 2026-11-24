// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// The FLIP method here is after Matthias Mueller (Ten Minute Physics, 2022), MIT License.
import { defineDemo, type Demo, type DemoMsg } from '../contract.js';
import { stampPanel } from '../panel.js';
import type { FlipFluid } from './flip-core.js';
import { paintFluid } from './flip-render.js';
import { applyObstacle, createFluid, pourParticles, shakeParticles, simulate, type Circle } from './flip-simulate.js';
import { DEFAULT_TANK, framePane, POUR_PULSES, SHAKES, tankFor, type TankSize } from './tank.js';

export interface FlipState {
  readonly seed: number;
  /** The generator's seed now: the next pour draws from here. */
  readonly rng: number;
  readonly fluid: FlipFluid;
  readonly source: 'left' | 'right';
  readonly pour: number;
  readonly shake: { readonly x: number; readonly y: number } | null;
  readonly hud: boolean;
  /** The obstacle's centre as a share of the tank, 0 to 1, upward being positive in y as the fluid sees it. */
  readonly obstacle: { readonly x: number; readonly y: number };
}

const MOVES: Readonly<Record<string, { readonly x: number; readonly y: number }>> = {
  w: { x: 0, y: 0.04 }, up: { x: 0, y: 0.04 },
  s: { x: 0, y: -0.04 }, down: { x: 0, y: -0.04 },
  a: { x: -0.03, y: 0 }, d: { x: 0.03, y: 0 },
};

function circleOf(at: { readonly x: number; readonly y: number }, tank: FlipFluid): Circle {
  return { x: at.x * tank.fNumX, y: at.y * tank.fNumY, radius: Math.max(3.0, Math.min(tank.fNumX, tank.fNumY) * 0.12) };
}

/** A dam break in the tank. `limit` caps the starting particles: zero gives an empty tank. */
export function startFlip(seed: number, limit = Infinity, size: TankSize = DEFAULT_TANK): FlipState {
  const fluid = createFluid(size.width, size.height, limit);
  return { seed, rng: seed, fluid, source: 'left', pour: 0, shake: null, hud: true, obstacle: { x: 0.5, y: 0.54 } };
}

/** One fixed step on a copy of the fluid: the obstacle goes into the grid, then any shake, any pour, then the solver. */
function advance(state: FlipState): FlipState {
  const fluid = state.fluid.clone();
  const obstacle = circleOf(state.obstacle, state.fluid);
  applyObstacle(fluid, obstacle);
  if (state.shake !== null) shakeParticles(fluid, state.shake.x, state.shake.y);
  const rng = state.pour > 0 ? pourParticles(fluid, state.source, state.rng) : state.rng;
  simulate(fluid, obstacle);
  return { ...state, fluid, rng, shake: null };
}

/** A new size starts the dam break again at that size, as the original did when its grid no longer matched the pane. */
function resize(state: FlipState, size: TankSize): FlipState {
  if (size.width === state.fluid.fNumX && size.height === state.fluid.fNumY) return state;
  return { ...state, fluid: createFluid(size.width, size.height) };
}

function update(msg: DemoMsg, state: FlipState): FlipState {
  if (msg.type === 'pulse') return advance({ ...state, pour: Math.max(0, state.pour - 1) });
  if (msg.type === 'resize') return resize(state, tankFor(msg.width, msg.height));
  if (msg.type !== 'key') return state;
  const shake = SHAKES[msg.key];
  const move = MOVES[msg.key];
  if (shake !== undefined) return { ...state, shake };
  if (move !== undefined) {
    const next = { x: state.obstacle.x + move.x, y: state.obstacle.y + move.y };
    return { ...state, obstacle: { x: Math.max(0.05, Math.min(0.95, next.x)), y: Math.max(0.05, Math.min(0.95, next.y)) } };
  }
  if (msg.key === 'p') return { ...state, pour: POUR_PULSES };
  if (msg.key === 't') return { ...state, source: state.source === 'left' ? 'right' : 'left' };
  if (msg.key === 'h') return { ...state, hud: !state.hud };
  if (msg.key === 'r') return { ...startFlip(state.seed, Infinity, { width: state.fluid.fNumX, height: state.fluid.fNumY }), source: state.source, hud: state.hud, obstacle: state.obstacle };
  return state;
}

export const flipFluid: Demo<FlipState> = {
  id: 'flip-fluid',
  name: 'FLIP Dam Break',
  description: 'A hybrid grid and particle FLIP fluid dam break with a movable obstacle',
  keys: 'p pour, t source side, w a s d move obstacle, z x c shake, r reset, h card, space pause',
  init: (seed) => startFlip(seed),
  update,
  view(state, { width, height, frame, ctx }) {
    const pane = framePane(paintFluid(state.fluid, circleOf(state.obstacle, state.fluid)), width, height);
    if (state.hud) {
      stampPanel(pane, [
        '  ***  BIJOU FLIP FLUID (DAM BREAK)  ***  ',
        '─'.repeat(42),
        `  Grid Size:   ${String(state.fluid.fNumX)}x${String(state.fluid.fNumY)}`,
        `  Particles:   ${String(state.fluid.numParticles)}`,
        `  Frame:       ${String(frame)}`,
        `  Source:      TOP-${state.source.toUpperCase()}`,
        '─'.repeat(42),
        '  R           - Reset Dam Break           ',
        '  T           - Toggle Source Side        ',
        '  Hold P      - Pour Fluid                ',
        '  W A S D, Up, Down - Move Obstacle       ',
        '  Z, X, C     - Shake Left, Up, Right     ',
        '  H           - Hide this card            ',
      ], ctx, (free) => ({ x: Math.max(0, free.x - 4), y: Math.max(0, Math.min(3, free.y - 1)) }));
    }
    return pane;
  },
};

export const flipFluidDemo = defineDemo(flipFluid);
