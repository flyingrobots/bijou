// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// Three universes on one clock, with bounded snapshots so time can be scrubbed: any moment is a snapshot plus a
// deterministic re-run, and a fork is an event in the record that a re-run replays at its sample.
import { advance, ensemble, nudged, PENDULUMS, SAMPLE_RATE, TRAIL, type Universe } from './butterfly-physics.js';

/** Universe B's and C's nudge to θ1, and a fork's. */
export const NUDGE_B = 1e-12;
export const NUDGE_C = 1e-9;
export const NUDGE_FORK = 1e-12;
/** A snapshot every second of simulated time, the last two minutes of them kept. */
const SNAP_EVERY = SAMPLE_RATE;
const MAX_SNAPS = 120;

export type Trio = readonly [Universe, Universe, Universe];

interface Snap {
  readonly tick: number;
  readonly states: readonly [Float64Array, Float64Array, Float64Array];
}

export interface World {
  /** Samples since the start. */
  readonly tick: number;
  readonly trio: Trio;
  readonly base: number;
  readonly snaps: readonly Snap[];
  /** Samples at which C was replaced by a nudged copy of A, ascending. */
  readonly forks: readonly number[];
  /** The furthest sample ever reached on this branch of the record. */
  readonly head: number;
}

const startTrio = (base: number): Trio => [ensemble(base, 0), ensemble(base, NUDGE_B), ensemble(base, NUDGE_C)];

const fork = (trio: Trio): Trio => [trio[0], trio[1], nudged(trio[0], NUDGE_FORK)];

export function startWorld(base: number): World {
  const trio = startTrio(base);
  return { tick: 0, trio, base, snaps: [{ tick: 0, states: [trio[0].state, trio[1].state, trio[2].state] }], forks: [], head: 0 };
}

/** Earliest sample the record can still reach. */
export const earliest = (world: World): number => world.snaps[0]?.tick ?? 0;

/** The last fork at or before the current sample, or null while C is still the original +1e-9 universe. */
export function activeFork(world: World): number | null {
  let found: number | null = null;
  for (const f of world.forks) if (f <= world.tick) found = f;
  return found;
}

/** Run forward to `target`, taking snapshots on arrival at each second and replaying forks at their samples. */
function runTo(world: World, target: number): World {
  let { tick, trio, snaps } = world;
  while (tick < target) {
    const nextSnap = (Math.floor(tick / SNAP_EVERY) + 1) * SNAP_EVERY;
    const nextFork = world.forks.find((f) => f > tick) ?? Number.POSITIVE_INFINITY;
    const stop = Math.min(target, nextSnap, nextFork);
    const n = stop - tick;
    trio = [advance(trio[0], n), advance(trio[1], n), advance(trio[2], n)];
    tick = stop;
    const last = snaps[snaps.length - 1];
    if (tick % SNAP_EVERY === 0 && (last === undefined || tick > last.tick)) {
      snaps = [...snaps, { tick, states: [trio[0].state, trio[1].state, trio[2].state] }];
      if (snaps.length > MAX_SNAPS) snaps = snaps.slice(snaps.length - MAX_SNAPS);
    }
    if (world.forks.includes(tick)) trio = fork(trio);
  }
  return { ...world, tick, trio, snaps, head: Math.max(world.head, tick) };
}

const fromState = (state: Float64Array): Universe => ({ state, trail: new Float32Array(TRAIL * PENDULUMS * 2), head: 0, count: 0 });

/** The world at an earlier sample: load the snapshot that leaves room for a full trail, then re-run. */
function rewindTo(world: World, target: number): World {
  const clamped = Math.max(earliest(world), target);
  const pick = (limit: number): Snap | undefined => [...world.snaps].reverse().find((s) => s.tick <= limit);
  const snap = pick(clamped - TRAIL) ?? pick(clamped);
  if (snap === undefined) return world;
  let trio: Trio = [fromState(snap.states[0]), fromState(snap.states[1]), fromState(snap.states[2])];
  if (world.forks.includes(snap.tick)) trio = fork(trio);
  return runTo({ ...world, tick: snap.tick, trio }, clamped);
}

/** Move the clock by `samples`, back through the record or forward, simulating anything not yet reached. */
export function scrub(world: World, samples: number): World {
  const target = Math.max(0, world.tick + samples);
  return target < world.tick ? rewindTo(world, target) : runTo(world, target);
}

/** Replace C with A nudged by `NUDGE_FORK` now; the record past this moment belongs to the old branch and is dropped. */
export function forkNow(world: World): World {
  const forks = [...world.forks.filter((f) => f < world.tick), world.tick];
  const snaps = world.snaps.filter((s) => s.tick <= world.tick);
  return { ...world, trio: fork(world.trio), forks, snaps, head: world.tick };
}

export const restart = (world: World): World => startWorld(world.base);
