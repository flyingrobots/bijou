// Licensed under the Apache License, Version 2.0, like the rest of this repository.
import { defineDemo, type Demo, type DemoMsg } from '../contract.js';
import { stampPanel } from '../panel.js';
import type { Particle } from './fluid-collide.js';
import { paintTank } from './fluid-render.js';
import { MAX_PARTICLES, spawn, stepParticles } from './fluid-step.js';
import { framePane, POUR_PULSES, SHAKES, TANK } from './tank.js';

export interface FluidState {
  readonly seed: number;
  /** The generator's seed now: the next pour draws from here. */
  readonly rng: number;
  readonly particles: readonly Particle[];
  readonly source: 'left' | 'right';
  /** Pulses left to pour for. */
  readonly pour: number;
  /** A shake waiting for the next step. */
  readonly shake: { readonly x: number; readonly y: number } | null;
  readonly hud: boolean;
}

function advance(state: FluidState): FluidState {
  let { particles, rng } = state;
  const { x, y } = state.shake ?? { x: 0, y: 0 };
  particles = particles.map((p) => ({ ...p, vx: p.vx + x, vy: p.vy + y }));
  if (state.pour > 0 && particles.length < MAX_PARTICLES) {
    const [made, next] = spawn(rng, state.source, TANK.width);
    particles = [...particles, ...made.slice(0, MAX_PARTICLES - particles.length)];
    rng = next;
  }
  return { ...state, rng, particles: stepParticles(particles, TANK.width, TANK.height), shake: null };
}

/** A pulse is one fixed step whatever its `dt`; keys pour, switch the source, shake, hide the card or reset. */
function update(msg: DemoMsg, state: FluidState): FluidState {
  if (msg.type === 'pulse') return advance({ ...state, pour: Math.max(0, state.pour - 1) });
  if (msg.type !== 'key') return state;
  const shake = SHAKES[msg.key];
  if (shake !== undefined) return { ...state, shake };
  if (msg.key === 'p') return { ...state, pour: POUR_PULSES };
  if (msg.key === 't') return { ...state, source: state.source === 'left' ? 'right' : 'left' };
  if (msg.key === 'h') return { ...state, hud: !state.hud };
  if (msg.key === 'r') return { ...state, rng: state.seed, particles: [], pour: 0, shake: null };
  return state;
}

export const fluid: Demo<FluidState> = {
  id: 'fluid',
  name: 'Fluid Dynamics Tank',
  description: 'A 2D particle fluid flowing around a hidden obstacle well',
  keys: 'p pour, t source side, z x c shake, r reset, h card, space pause',
  init: (seed) => ({ seed, rng: seed, particles: [], source: 'left', pour: 0, shake: null, hud: true }),
  update,
  view(state, { width, height, frame, ctx }) {
    const pane = framePane(paintTank(state.particles, TANK.width, TANK.height), width, height);
    if (state.hud) {
      stampPanel(pane, [
        '  ***  BIJOU FLUID DYNAMICS  ***  ',
        '─'.repeat(34),
        '  Obstacle:    Convex 5-sided Well',
        `  Particles:   ${String(state.particles.length)}`,
        `  Frame:       ${String(frame)}`,
        `  Source:      TOP-${state.source.toUpperCase()}`,
        '─'.repeat(34),
        '  R reset the simulation          ',
        '  T toggle the source side        ',
        '  Hold P to pour fluid            ',
        '  Z, X, C shake left, up, right   ',
        '  H hide this card                ',
      ], ctx, (free) => ({ x: Math.max(0, Math.floor(free.x * 0.85)), y: Math.max(0, Math.floor(free.y * 0.15)) }));
    }
    return pane;
  },
};

export const fluidDemo = defineDemo(fluid);
