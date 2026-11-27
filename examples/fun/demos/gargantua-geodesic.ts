// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// Light around a Schwarzschild black hole of mass M = 1: the horizon is at r = 2, the photon sphere at r = 3 and the
// innermost stable orbit at r = 6. A photon stays in one plane through the hole, and in that plane u = 1/r obeys
// Binet's equation u'' = -u + 3u² over the orbital angle φ. Every ray leaving a camera at distance r0 is fixed by one
// number, its angle α from the line to the hole, so a table of orbits over α serves every pixel of every frame.

/** Rows of the table, one per angle α from the line to the hole. */
export const ROWS = 1536;
/** The widest angle from the line to the hole that the table covers; wider rays use the last row. */
export const A_MAX = 1.2;
const PHI_CAP = 5 * Math.PI;
const MAX_STEPS = 1400;
const HORIZON_U = 0.5;

/** Orbits for one camera distance. Row `i` holds samples `start[i]` to `start[i + 1] - 1` of `phi` and `u`. */
export interface RayTable {
  readonly distance: number;
  readonly start: Int32Array;
  readonly phi: Float32Array;
  readonly u: Float32Array;
  /** The orbital angle where the row stops: where the photon reaches infinity, or the horizon. */
  readonly end: Float32Array;
  /** 1 when the row falls into the hole, 0 when it escapes. */
  readonly fallsIn: Uint8Array;
  /** 1/b² per row, b the impact parameter. */
  readonly invB2: Float32Array;
}

const accel = (u: number): number => -u + 3 * u * u;

/** Integrate one orbit with RK4, steps sized so `u` changes by about 1.5% each, appending samples. */
function traceRow(alpha: number, u0: number, phis: number[], us: number[]): readonly [number, boolean] {
  let phi = 0;
  let u = u0;
  let w = u0 / Math.tan(alpha);
  phis.push(0);
  us.push(u);
  for (let i = 0; i < MAX_STEPS; i += 1) {
    const h = Math.min(0.03, (0.015 * (u + 0.004)) / Math.max(Math.abs(w), 1e-9));
    const k1u = w;
    const k1w = accel(u);
    const k2u = w + (h / 2) * k1w;
    const k2w = accel(u + (h / 2) * k1u);
    const k3u = w + (h / 2) * k2w;
    const k3w = accel(u + (h / 2) * k2u);
    const k4u = w + h * k3w;
    const k4w = accel(u + h * k3u);
    const prev = u;
    u += (h / 6) * (k1u + 2 * k2u + 2 * k3u + k4u);
    w += (h / 6) * (k1w + 2 * k2w + 2 * k3w + k4w);
    if (u >= HORIZON_U) {
      const at = phi + (h * (HORIZON_U - prev)) / (u - prev);
      phis.push(at);
      us.push(HORIZON_U);
      return [at, true];
    }
    if (u <= 0) {
      const at = phi + (h * prev) / (prev - u);
      phis.push(at);
      us.push(0);
      return [at, false];
    }
    phi += h;
    phis.push(phi);
    us.push(u);
    if (phi > PHI_CAP) return [phi, true];
  }
  return [phi, true];
}

/** The angle α of row `i`. */
export const rowAngle = (i: number): number => ((i + 0.5) / ROWS) * A_MAX;

/** The row nearest to angle `alpha`. */
export const rowOf = (alpha: number): number => Math.max(0, Math.min(ROWS - 1, Math.floor((alpha / A_MAX) * ROWS)));

/** Trace every row for a camera `distance` from the hole. */
export function buildRayTable(distance: number): RayTable {
  const phis: number[] = [];
  const us: number[] = [];
  const start = new Int32Array(ROWS + 1);
  const end = new Float32Array(ROWS);
  const fallsIn = new Uint8Array(ROWS);
  const invB2 = new Float32Array(ROWS);
  const u0 = 1 / distance;
  for (let i = 0; i < ROWS; i += 1) {
    start[i] = phis.length;
    const alpha = rowAngle(i);
    const sin = Math.sin(alpha);
    invB2[i] = (u0 * u0) / (sin * sin) - 2 * u0 * u0 * u0;
    const [at, falls] = traceRow(alpha, u0, phis, us);
    end[i] = at;
    fallsIn[i] = falls ? 1 : 0;
  }
  start[ROWS] = phis.length;
  return { distance, start, phi: Float32Array.from(phis), u: Float32Array.from(us), end, fallsIn, invB2 };
}

/** `u` = 1/r along row `row` at orbital angle `phi`, or -1 once the row has stopped. */
export function uAt(table: RayTable, row: number, phi: number): number {
  const first = table.start[row] ?? 0;
  const last = (table.start[row + 1] ?? 1) - 1;
  if (phi > (table.phi[last] ?? 0)) return -1;
  let lo = first;
  let hi = last;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if ((table.phi[mid] ?? 0) <= phi) lo = mid;
    else hi = mid;
  }
  const p0 = table.phi[lo] ?? 0;
  const p1 = table.phi[hi] ?? p0;
  const u0 = table.u[lo] ?? 0;
  const u1 = table.u[hi] ?? u0;
  return p1 > p0 ? u0 + ((u1 - u0) * (phi - p0)) / (p1 - p0) : u0;
}
