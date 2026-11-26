// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// After "Lenses" by Claudio Esperança (Observable): rays traced through thin spherical lenses and
// ideal spherical mirrors of zero thickness. The original's Ray and Lens classes, as plain data
// and functions over 2D tuples.

export type Vec = readonly [number, number];
export interface Ray { readonly p: Vec; readonly v: Vec }
export interface Lens {
  readonly center: Vec;
  readonly axis: Vec;
  readonly focusLen: number;
  readonly size: number;
  /** -1 for a mirror, which sends light back to the side it came from. */
  readonly reverse: number;
  /** The lens itself: a ray through the centre, perpendicular to the axis. */
  readonly line: Ray;
}
/** A leg of a trajectory: the ray and the value of t where the leg ends. */
export type Leg = readonly [Ray, number];

const add = (a: Vec, b: Vec, s = 1): Vec => [a[0] + b[0] * s, a[1] + b[1] * s];
const sub = (a: Vec, b: Vec): Vec => [a[0] - b[0], a[1] - b[1]];
const dot = (a: Vec, b: Vec): number => a[0] * b[0] + a[1] * b[1];
const len = (a: Vec): number => Math.hypot(a[0], a[1]);
const unit = (a: Vec): Vec => {
  const n = len(a);
  return n === 0 ? [0, 0] : [a[0] / n, a[1] / n];
};
const rotate = (a: Vec, angle: number): Vec =>
  [a[0] * Math.cos(angle) - a[1] * Math.sin(angle), a[0] * Math.sin(angle) + a[1] * Math.cos(angle)];

export const at = (ray: Ray, t: number): Vec => add(ray.p, ray.v, t);
const translated = (ray: Ray, delta: number): Ray => ({ p: at(ray, delta), v: ray.v });
const rotated = (ray: Ray, angle: number): Ray => ({ p: ray.p, v: rotate(ray.v, angle) });
const scaled = (ray: Ray, s: number): Ray => ({ p: ray.p, v: [ray.v[0] * s, ray.v[1] * s] });

/** The parameters [t, u] where the lines of `a` and `b` cross, so at(a, t) equals at(b, u). */
export function intersect(a: Ray, b: Ray): Vec {
  const [p1, v1, p2, v2] = [a.p, a.v, b.p, b.v];
  const d = v1[0] * v2[1] - v1[1] * v2[0];
  const t = (v2[1] * (p2[0] - p1[0]) + p1[1] * v2[0] - p2[1] * v2[0]) / d;
  const u = -(v1[1] * (p1[0] - p2[0]) + p2[1] * v1[0] - p1[1] * v1[0]) / d;
  return [t, u];
}

export function makeLens(center: Vec, axis: Vec, focusLen: number, size: number, mirror = false): Lens {
  const a = unit(axis);
  return { center, axis: a, focusLen, size, reverse: mirror ? -1 : 1, line: { p: center, v: [-a[1], a[0]] } };
}

/** Where the ray meets the lens, or null when it misses or meets it before `tMin`. */
export function hit(lens: Lens, ray: Ray, tMin = 0): Vec | null {
  const [t, u] = intersect(ray, lens.line);
  if (!Number.isFinite(t) || !Number.isFinite(u) || t < tMin || Math.abs(u) > lens.size / 2) return null;
  return [t, u];
}

/** The outgoing ray, parameterized so its t at the lens equals the incoming ray's; null when the ray misses. */
export function refract(lens: Lens, ray: Ray): Ray | null {
  const { line, focusLen, center } = lens;
  const axis: Vec = dot(ray.v, lens.axis) * lens.reverse < 0 ? [-lens.axis[0], -lens.axis[1]] : lens.axis;
  const th = hit(lens, ray);
  if (th === null) return null;
  const [t] = th;
  const p = at(ray, t);
  const v1: Vec = [axis[0] * dot(ray.v, axis), axis[1] * dot(ray.v, axis)];
  const v2 = sub(ray.v, v1);
  const sgn = Math.sign(dot(sub(p, center), v2));
  const m = len(v2) / len(v1);
  const h = len(sub(p, center));
  const sgn2 = Math.sign(dot(v2, line.v));
  const mprime = sgn2 * (m - (sgn * h) / focusLen);
  const r = unit(add(axis, line.v, mprime));
  return { p: at({ p, v: r }, -t), v: r };
}

/** The legs of a ray through the lenses until t reaches `tMax`. */
export function trajectory(start: Ray, lenses: readonly Lens[], tMax: number): Leg[] {
  const legs: Leg[] = [];
  let ray = start;
  let t = 0;
  for (let guard = 0; guard < 64 && t < tMax; guard += 1) {
    let best: readonly [Lens, number] | null = null;
    for (const lens of lenses) {
      const th = hit(lens, ray, t + 0.001);
      if (th !== null && (best === null || th[0] < best[1])) best = [lens, th[0]];
    }
    const next = best === null ? null : refract(best[0], ray);
    if (best === null || next === null) {
      legs.push([ray, tMax]);
      break;
    }
    legs.push([ray, Math.min(tMax, best[1])]);
    t = best[1];
    ray = next;
  }
  return legs;
}

/** Points along the trajectory from `tmin` up to `tmax`, every `step`: the original's sampleTraj. */
export function sampleTrajectory(legs: readonly Leg[], tmin: number, tmax: number, step: number): Vec[] {
  const pts: Vec[] = [];
  let i = 0;
  for (let t = tmin; t < tmax; t += step) {
    while (i < legs.length - 1 && t > (legs[i]?.[1] ?? 0)) i += 1;
    const leg = legs[i];
    if (leg !== undefined) pts.push(at(leg[0], t));
  }
  return pts;
}

/** Bezier control points that round a closed polygon; an `edgeRatio` of 0 keeps it straight. */
export function smoothControlPoints(pts: readonly Vec[], edgeRatio: number): (readonly [Vec, Vec])[] {
  const n = pts.length;
  const pt = (i: number): Vec => pts[((i % n) + n) % n] ?? [0, 0];
  const edges = pts.map((p, i) => sub(pt(i + 1), p));
  const dirs = edges.map(unit);
  const tangent = (i: number): Vec => unit(add(dirs[i % n] ?? [0, 0], dirs[(i - 1 + n) % n] ?? [0, 0]));
  return pts.map((p, i): readonly [Vec, Vec] => {
    const l = len(edges[i] ?? [0, 0]) * edgeRatio;
    return [add(p, tangent(i), l), add(pt(i + 1), tangent(i + 1), -l)];
  });
}

/** The original's arrowHead: a closed outline at the ray's start, pointing along it. */
function arrowHead(ray: Ray, length: number, wid: number): Vec[] {
  const r: Ray = { p: ray.p, v: unit(ray.v) };
  return [r.p, translated(rotated(r, Math.PI / 2), wid / 2).p, translated(r, length).p, translated(rotated(r, -Math.PI / 2), wid / 2).p, r.p];
}

/** The lens as the original draws it: a line with arrows at both ends, out for converging, in for diverging. */
export function lensOutline(lens: Lens, length: number, wid: number): Vec[] {
  const half = lens.size / 2;
  const ends = [translated(lens.line, half), translated(scaled(lens.line, -1), half)];
  return ends.flatMap((end) => arrowHead(lens.focusLen < 0 ? rotated(end, Math.PI) : end, length, wid));
}

/** The focal point the original marks with a dot: the centre plus the axis times the focal length. */
export const focalPoint = (lens: Lens): Vec => add(lens.center, lens.axis, lens.focusLen);
