// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// After "Noise plane partition" by Claudio Esperança (Observable): a flow line
// of a noise field, traced both ways from a point inside a polygon until it
// meets the border, cuts the polygon in two.
import { createNoise3 } from './noise.js';
import { findPointInPolygon, type Point, type Polygon } from './noise-partition-polygon.js';

/** Where a segment first meets a polygon's border: the point, and the edge, edge i ending at vertex i. */
interface Crossing {
  readonly point: Point;
  readonly edge: number;
}

type Follow = (p: Point) => Point;

/** Steps along the noise field's direction, against it, and square to it on either side. */
export interface Flow {
  readonly forwards: Follow;
  readonly backwards: Follow;
  readonly left: Follow;
  readonly right: Follow;
}

/** The original's flow-line step and step budget each way. */
const STEP = 5;
const TRACE = 1000;
const ORIGIN: Point = [0, 0];
const cross = (ax: number, ay: number, bx: number, by: number): number => ax * by - ay * bx;

/** The field at 2^`scaleLog2` noise units a world unit, its angle the noise times pi, as the original. */
export function flow(seed: number, scaleLog2: number): Flow {
  const noise = createNoise3(seed);
  const scale = 2 ** scaleLog2;
  const direction = ([x, y]: Point): Point => {
    const angle = noise(x * scale, y * scale, 0.5) * Math.PI;
    return [Math.cos(angle) * STEP, Math.sin(angle) * STEP];
  };
  const along = (sign: number): Follow => (p) => {
    const [dx, dy] = direction(p);
    return [p[0] + sign * dx, p[1] + sign * dy];
  };
  const across = (sign: number): Follow => (p) => {
    const [dx, dy] = direction(p);
    return [p[0] + sign * dy, p[1] - sign * dx];
  };
  return { forwards: along(1), backwards: along(-1), left: across(1), right: across(-1) };
}

/** The first point, going from `a` to `b`, where the segment meets the polygon's border; null when it stays inside. */
function firstCrossing(a: Point, b: Point, polygon: Polygon): Crossing | null {
  const [rx, ry] = [b[0] - a[0], b[1] - a[1]];
  const [lox, hix, loy, hiy] = [Math.min(a[0], b[0]), Math.max(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[1], b[1])];
  let best: Crossing | null = null;
  let bestT = Infinity;
  let c = polygon[polygon.length - 1] ?? ORIGIN;
  for (let edge = 0; edge < polygon.length; edge += 1) {
    const d = polygon[edge] ?? ORIGIN;
    const from = c;
    c = d;
    if (Math.max(from[0], d[0]) < lox || Math.min(from[0], d[0]) > hix) continue;
    if (Math.max(from[1], d[1]) < loy || Math.min(from[1], d[1]) > hiy) continue;
    const [sx, sy] = [d[0] - from[0], d[1] - from[1]];
    const denominator = cross(rx, ry, sx, sy);
    if (denominator === 0) continue;
    const [qx, qy] = [from[0] - a[0], from[1] - a[1]];
    const t = cross(qx, qy, sx, sy) / denominator;
    const u = cross(qx, qy, rx, ry) / denominator;
    if (t < 0 || t > 1 || u < 0 || u > 1 || t >= bestT) continue;
    bestT = t;
    best = { point: [a[0] + t * rx, a[1] + t * ry], edge };
  }
  return best;
}

function trace(start: Point, follow: Follow, polygon: Polygon): { readonly points: Point[]; readonly edge: number } | null {
  const points: Point[] = [];
  let a = start;
  for (let count = 0; count <= TRACE; count += 1) {
    const b = follow(a);
    const hit = firstCrossing(a, b, polygon);
    if (hit !== null) {
      points.push(hit.point);
      return { points, edge: hit.edge };
    }
    points.push(b);
    a = b;
  }
  return null;
}

/**
 * The two halves of the polygon either side of the flow line through a point inside it: across the flow, or along it
 * when `sideways`. Null when no inside point is found or the line does not reach the border.
 */
export function split(polygon: Polygon, sideways: boolean, field: Flow): readonly [Polygon, Polygon] | null {
  const start = findPointInPolygon(polygon);
  if (start === null) return null;
  const [followA, followB] = sideways ? [field.backwards, field.forwards] : [field.left, field.right];
  const a = trace(start, followA, polygon);
  const b = trace(start, followB, polygon);
  if (a === null || b === null) return null;
  const curve = [...a.points.reverse(), start, ...b.points];
  const n = polygon.length;
  const halfA: Point[] = [...curve, polygon[b.edge] ?? start];
  for (let i = (b.edge + 1) % n; i !== a.edge; i = (i + 1) % n) halfA.push(polygon[i] ?? start);
  const halfB: Point[] = [...curve].reverse();
  for (let i = a.edge; i !== b.edge; i = (i + 1) % n) halfB.push(polygon[i] ?? start);
  return [halfA, halfB];
}
