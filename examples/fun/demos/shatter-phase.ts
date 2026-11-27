// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// Shatter's state and its three phases: live (the dashboard works), flying (its glyphs are debris) and rewind
// (the recorded flight plays backwards until every glyph is home).
import { nextRandom } from '../random.js';
import { layout, matterCells } from './shatter-dash.js';
import { record, restore, snapshot, type History } from './shatter-history.js';
import { assemble, blast, step, type Push, type Sim } from './shatter-sim.js';

export type Phase = 'live' | 'flying' | 'rewind';
export interface Cell2 { readonly col: number; readonly row: number }

export interface ShatterState {
  readonly seed: number;
  /** Seeds the dashboard's signals; fixed for the session. */
  readonly look: number;
  readonly width: number;
  readonly height: number;
  readonly phase: Phase;
  /** The dashboard's own clock in seconds: it runs only while live, so debris keeps the glyphs it broke with. */
  readonly clock: number;
  readonly phaseTime: number;
  /** Seconds since any debris last moved. */
  readonly calm: number;
  readonly pulses: number;
  readonly sim: Sim | null;
  readonly history: History;
  readonly cursor: number;
  readonly pointer: Cell2 | null;
  readonly push: Push | null;
  readonly auto: boolean;
  readonly hideUI: boolean;
}

/** Seconds of live dashboard before the auto-loop shatters it. */
export const AUTO_SHATTER = 1.5;
/** Seconds of still debris before the auto-loop rewinds it. */
export const AUTO_REWIND = 4;
/** Longest flight before the auto-loop rewinds anyway, in seconds. */
const MAX_FLIGHT = 14;

export function initial(seed: number, width: number, height: number): ShatterState {
  const [look, next] = nextRandom(seed);
  return {
    seed: next, look: Math.floor(look * 0x7fffffff), width, height, phase: 'live', clock: 0, phaseTime: 0, calm: 0,
    pulses: 0, sim: null, history: [], cursor: 0, pointer: null, push: null, auto: true, hideUI: false,
  };
}

/** Break the dashboard, or blast the debris again, from the pointer or a seeded point on the panels. */
export function smash(state: ShatterState): ShatterState {
  if (state.phase === 'rewind') return state;
  const rects = layout(state.width, state.height);
  const [a, s1] = nextRandom(state.seed);
  const [b, s2] = nextRandom(s1);
  const top = rects.header.y;
  const bottom = rects.services.y + rects.services.h;
  const at = state.pointer ?? { col: rects.header.x + (0.25 + 0.5 * a) * rects.header.w, row: top + (0.3 + 0.4 * b) * (bottom - top) };
  if (state.sim !== null) {
    const [sim, seed] = blast(state.sim, at.col, at.row, s2);
    return { ...state, sim, seed, calm: 0 };
  }
  const home = assemble(matterCells(rects, state.width, state.height), state.width, state.height);
  const [sim, seed] = blast(home, at.col, at.row, s2);
  return { ...state, sim, seed, phase: 'flying', phaseTime: 0, calm: 0, history: [snapshot(home)] };
}

export function rewind(state: ShatterState): ShatterState {
  if (state.phase !== 'flying') return state;
  return { ...state, phase: 'rewind', phaseTime: 0, cursor: state.history.length - 1 };
}

const goLive = (state: ShatterState): ShatterState =>
  ({ ...state, phase: 'live', phaseTime: 0, calm: 0, sim: null, history: [], cursor: 0 });

export function resize(state: ShatterState, width: number, height: number): ShatterState {
  return goLive({ ...state, width, height });
}

/** Note a pointer move: while debris flies, it shoves what is near it on the next pulse. */
export function point(state: ShatterState, at: Cell2): ShatterState {
  const prev = state.pointer;
  const push = prev === null ? null : { col: at.col, row: at.row, dx: at.col - prev.col, dy: at.row - prev.row };
  return { ...state, pointer: at, push: state.phase === 'flying' ? push : null };
}

export function pulse(state: ShatterState, rawDt: number): ShatterState {
  const dt = Math.max(0, Math.min(0.1, rawDt));
  const base = { ...state, pulses: state.pulses + 1, phaseTime: state.phaseTime + dt, push: null };
  if (state.phase === 'live') {
    const live = { ...base, clock: state.clock + dt };
    return state.auto && live.phaseTime >= AUTO_SHATTER ? smash(live) : live;
  }
  if (state.phase === 'rewind' || state.sim === null) {
    const cursor = state.cursor - 1;
    const snap = state.history[cursor];
    if (cursor <= 0 || snap === undefined || state.sim === null) return goLive(base);
    return { ...base, cursor, sim: restore(state.sim, snap) };
  }
  const [sim, moved] = step(state.sim, dt, state.pulses, state.push);
  const flying = { ...base, sim, calm: moved ? 0 : state.calm + dt, history: moved ? record(state.history, sim) : state.history };
  const due = flying.calm >= AUTO_REWIND || flying.phaseTime >= MAX_FLIGHT;
  return state.auto && due ? rewind(flying) : flying;
}
