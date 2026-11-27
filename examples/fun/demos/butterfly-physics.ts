// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// An ensemble of double pendulums (unit masses, unit arms) integrated with RK4 at a fixed step.

/** Pendulums in each universe's ensemble. */
export const PENDULUMS = 180;
/** Tip positions each universe remembers for its trails, one per sample. */
export const TRAIL = 24;
/** RK4 steps per sample; a sample is the unit of time the history counts in. */
export const STEPS_PER_SAMPLE = 4;
/** Samples per second of simulated time. */
export const SAMPLE_RATE = 60;
const H = 1 / (SAMPLE_RATE * STEPS_PER_SAMPLE);
const G = 9.81;
/** The ensemble fans out from one angle by this much per pendulum, in the second arm's angle. */
const FAN = 1e-7;

/**
 * One universe: per pendulum `[θ1, θ2, ω1, ω2]`, and a ring of the last `TRAIL` tip positions per pendulum as
 * `[x, y]` in arm lengths from the pivot, y pointing down. Never mutated once built.
 */
export interface Universe {
  readonly state: Float64Array;
  readonly trail: Float32Array;
  /** Ring slot of the newest sample. */
  readonly head: number;
  /** Valid samples in the ring, up to `TRAIL`. */
  readonly count: number;
}

/** A fresh ensemble: every pendulum starts at `base` radians in both arms, fanned by `FAN`, with `shift` added to θ1. */
export function ensemble(base: number, shift: number): Universe {
  const state = new Float64Array(PENDULUMS * 4);
  for (let i = 0; i < PENDULUMS; i += 1) {
    state[i * 4] = base + shift;
    state[i * 4 + 1] = base + (i - PENDULUMS / 2) * FAN;
  }
  return { state, trail: new Float32Array(TRAIL * PENDULUMS * 2), head: 0, count: 0 };
}

/** Scratch for `accel`, so the inner loop allocates nothing. Holds no state between calls. */
const ACC = new Float64Array(2);

/** Angular accelerations of the two arms, written to `ACC`. */
function accel(t1: number, t2: number, w1: number, w2: number): void {
  const d = t1 - t2;
  const sd = Math.sin(d);
  const cd = Math.cos(d);
  const den = 3 - Math.cos(2 * d);
  ACC[0] = (-3 * G * Math.sin(t1) - G * Math.sin(t1 - 2 * t2) - 2 * sd * (w2 * w2 + w1 * w1 * cd)) / den;
  ACC[1] = (2 * sd * (2 * w1 * w1 + 2 * G * Math.cos(t1) + w2 * w2 * cd)) / den;
}

/** One classic RK4 step of one pendulum, written back into `s` at `at`. */
function rk4(s: Float64Array, at: number): void {
  const t1 = s[at] ?? 0;
  const t2 = s[at + 1] ?? 0;
  const w1 = s[at + 2] ?? 0;
  const w2 = s[at + 3] ?? 0;
  accel(t1, t2, w1, w2);
  const p1 = ACC[0] ?? 0;
  const q1 = ACC[1] ?? 0;
  accel(t1 + (H / 2) * w1, t2 + (H / 2) * w2, w1 + (H / 2) * p1, w2 + (H / 2) * q1);
  const p2 = ACC[0] ?? 0;
  const q2 = ACC[1] ?? 0;
  const v1 = w1 + (H / 2) * p1;
  const v2 = w2 + (H / 2) * q1;
  accel(t1 + (H / 2) * v1, t2 + (H / 2) * v2, w1 + (H / 2) * p2, w2 + (H / 2) * q2);
  const p3 = ACC[0] ?? 0;
  const q3 = ACC[1] ?? 0;
  const u1 = w1 + (H / 2) * p2;
  const u2 = w2 + (H / 2) * q2;
  accel(t1 + H * u1, t2 + H * u2, w1 + H * p3, w2 + H * q3);
  const p4 = ACC[0] ?? 0;
  const q4 = ACC[1] ?? 0;
  const x1 = w1 + H * p3;
  const x2 = w2 + H * q3;
  s[at] = t1 + (H / 6) * (w1 + 2 * v1 + 2 * u1 + x1);
  s[at + 1] = t2 + (H / 6) * (w2 + 2 * v2 + 2 * u2 + x2);
  s[at + 2] = w1 + (H / 6) * (p1 + 2 * p2 + 2 * p3 + p4);
  s[at + 3] = w2 + (H / 6) * (q1 + 2 * q2 + 2 * q3 + q4);
}

/** The universe `samples` samples later, recording each sample's tips in the trail. Returns a new universe. */
export function advance(universe: Universe, samples: number): Universe {
  if (samples <= 0) return universe;
  const state = universe.state.slice();
  const trail = universe.trail.slice();
  for (let i = 0; i < PENDULUMS; i += 1) {
    const at = i * 4;
    for (let k = 1; k <= samples; k += 1) {
      for (let n = 0; n < STEPS_PER_SAMPLE; n += 1) rk4(state, at);
      if (samples - k >= TRAIL) continue;
      const t1 = state[at] ?? 0;
      const slot = (((universe.head + k) % TRAIL) * PENDULUMS + i) * 2;
      trail[slot] = Math.sin(t1) + Math.sin(state[at + 1] ?? 0);
      trail[slot + 1] = Math.cos(t1) + Math.cos(state[at + 1] ?? 0);
    }
  }
  return { state, trail, head: (universe.head + samples) % TRAIL, count: Math.min(TRAIL, universe.count + samples) };
}

/** A copy of `universe` with `shift` added to every pendulum's θ1: the same moment, nudged. */
export function nudged(universe: Universe, shift: number): Universe {
  const state = universe.state.slice();
  for (let i = 0; i < PENDULUMS; i += 1) state[i * 4] = (state[i * 4] ?? 0) + shift;
  return { ...universe, state };
}

const wrap = (a: number): number => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));

/** Root-mean-square angle distance between two universes, pendulum by pendulum, in radians. */
export function distance(a: Universe, b: Universe): number {
  let sum = 0;
  for (let i = 0; i < PENDULUMS; i += 1) {
    const d1 = wrap((a.state[i * 4] ?? 0) - (b.state[i * 4] ?? 0));
    const d2 = wrap((a.state[i * 4 + 1] ?? 0) - (b.state[i * 4 + 1] ?? 0));
    sum += d1 * d1 + d2 * d2;
  }
  return Math.sqrt(sum / PENDULUMS);
}
