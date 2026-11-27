// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// The recorded flight: one fixed-point snapshot of every particle per pulse that moved anything. Rewind plays it
// backwards; the first snapshot is the assembled dashboard, so the last rewound frame puts every glyph home.
import type { Sim } from './shatter-sim.js';

export type History = readonly Int16Array[];

/** The most snapshots kept. Past it the history drops every other frame but the first, so rewind just runs faster. */
export const MAX_HISTORY = 240;
/** Fixed-point steps per cell. */
const SUBCELL = 8;

export function snapshot(sim: Sim): Int16Array {
  const snap = new Int16Array(sim.x.length * 2);
  for (let i = 0; i < sim.x.length; i += 1) {
    snap[i * 2] = Math.round((sim.x[i] ?? 0) * SUBCELL);
    snap[i * 2 + 1] = Math.round((sim.y[i] ?? 0) * SUBCELL);
  }
  return snap;
}

/** The history with this pulse appended, thinned when it outgrows `MAX_HISTORY`. */
export function record(history: History, sim: Sim): History {
  const next = [...history, snapshot(sim)];
  if (next.length <= MAX_HISTORY) return next;
  return next.filter((_, k) => k === 0 || k % 2 === 1 || k === next.length - 1);
}

/** The sim with every particle placed where a snapshot holds it, still and airborne. */
export function restore(sim: Sim, snap: Int16Array): Sim {
  const x = new Float32Array(sim.x.length);
  const y = new Float32Array(sim.x.length);
  for (let i = 0; i < x.length; i += 1) {
    x[i] = (snap[i * 2] ?? 0) / SUBCELL;
    y[i] = (snap[i * 2 + 1] ?? 0) / SUBCELL;
  }
  return { ...sim, x, y, vx: new Float32Array(x.length), vy: new Float32Array(x.length), rest: new Uint8Array(x.length) };
}
