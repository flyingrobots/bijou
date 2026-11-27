// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// After "Synthesizing periodic tilings of the plane" by Claudio Esperança (Observable), which reproduces
// Medeiros e Sá, de Figueiredo and Soto Sánchez, "Synthesizing Periodic Tilings of Regular Polygons" (SIBGRAPI 2018):
// from the translation vectors and seeds, find the edges, then the face centres, then the faces of one patch.
import type { TilingRecord } from './periodic-tilings-data.js';

/** A point or vector of the plane, in edge lengths. */
export interface Vec {
  readonly x: number;
  readonly y: number;
}

/** One patch of a tiling: translate it by every i * t1 + j * t2 and it covers the plane. */
export interface Patch {
  readonly t1: Vec;
  readonly t2: Vec;
  /** Regular polygons, vertices sorted by angle about the centre. */
  readonly faces: readonly (readonly Vec[])[];
}

const vec = (x: number, y: number): Vec => ({ x, y });
const add = (a: Vec, b: Vec): Vec => vec(a.x + b.x, a.y + b.y);
const sub = (a: Vec, b: Vec): Vec => vec(a.x - b.x, a.y - b.y);
const scale = (a: Vec, k: number): Vec => vec(a.x * k, a.y * k);
const dist = (a: Vec, b: Vec): number => Math.hypot(a.x - b.x, a.y - b.y);
const cross = (a: Vec, b: Vec): number => a.x * b.y - a.y * b.x;

/** The four basic directions, w^0 to w^3. */
const W: readonly Vec[] = [vec(1, 0), vec(0.8660254037844386, 0.5), vec(0.5, 0.8660254037844386), vec(0, 1)];

/** A vector of the w basis as a Cartesian vector. */
export function toVec(t: readonly number[]): Vec {
  return W.reduce((sum, w, k) => add(sum, scale(w, t[k] ?? 0)), vec(0, 0));
}

/** The perpendicular bisector of a and b, as a ray from their midpoint. */
function bisector(a: Vec, b: Vec): readonly [Vec, Vec] {
  const dir = sub(b, a);
  return [scale(add(a, b), 0.5), vec(-dir.y, dir.x)];
}

/** Where two rays' lines cross, or undefined when they are parallel. */
function meet([o1, d1]: readonly [Vec, Vec], [o2, d2]: readonly [Vec, Vec]): Vec | undefined {
  const den = cross(d1, d2);
  if (Math.abs(den) < 1e-12) return undefined;
  return add(o1, scale(d1, cross(sub(o2, o1), d2) / den));
}

/** The notebook's synthesis, step by step: vertices of nearby tiles, unit edges from the seeds, face centres, faces. */
export function synthesize(record: TilingRecord): Patch {
  const t1 = toVec(record.t1);
  const t2 = toVec(record.t2);
  const seeds = record.seeds.map(toVec);
  const displacements: Vec[] = [];
  for (const i of [0, -1, 1, 2]) for (const j of [0, -1, 1, 2]) displacements.push(add(scale(t1, i), scale(t2, j)));
  const vtx = displacements.flatMap((d) => seeds.map((s) => add(s, d)));
  const edges: (readonly [Vec, Vec])[] = [];
  seeds.forEach((p, i) => {
    for (let j = i + 1; j < vtx.length; j += 1) {
      const q = vtx[j] ?? p;
      const d = dist(p, q);
      if (d > 0.99 && d < 1.01) edges.push([p, q]);
    }
  });
  const centers: { readonly o: Vec; readonly d: number }[] = [];
  for (const s of seeds) {
    const incident: Vec[] = [];
    for (const edge of edges) {
      const [p, q]: readonly [Vec, Vec] = dist(edge[1], s) < 0.001 ? [edge[1], edge[0]] : edge;
      if (dist(p, s) < 0.001 && (q.x > p.x || (Math.abs(q.x - p.x) < 0.001 && q.y < p.y))) incident.push(q);
    }
    incident.sort((a, b) => a.y - b.y);
    for (let j = 1; j < incident.length; j += 1) {
      const o = meet(bisector(s, incident[j - 1] ?? s), bisector(s, incident[j] ?? s));
      if (o !== undefined) centers.push({ o, d: dist(o, s) });
    }
  }
  const faces = centers.map(({ o, d }) =>
    vtx
      .filter((v) => dist(v, o) > d * 0.99 && dist(v, o) < d * 1.01)
      .map((v) => ({ v, angle: Math.atan2(v.y - o.y, v.x - o.x) }))
      .sort((a, b) => a.angle - b.angle)
      .map((f) => f.v));
  return { t1, t2, faces };
}

const cache = new Map<TilingRecord, Patch>();

/** The patch of a record, synthesized once: the same record always gives the same patch. */
export function patchOf(record: TilingRecord): Patch {
  const known = cache.get(record);
  if (known !== undefined) return known;
  const patch = synthesize(record);
  cache.set(record, patch);
  return patch;
}
