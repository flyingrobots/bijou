// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// After "Noise plane partition" by Claudio Esperança (Observable): the plane
// geometry the partition leans on, after his vec2-utils and 2D helper notebooks.

export type Point = readonly [number, number];
export type Polygon = readonly Point[];

const ORIGIN: Point = [0, 0];
/** The directions the inner-point search sweeps along: the axes and the diagonals. */
const DIRECTIONS: readonly Point[] = [[0, 1], [1, 0], [1, 1], [1, -1]];

export const lerp = (a: Point, b: Point, t: number): Point => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const distance = (a: Point, b: Point): number => Math.hypot(b[0] - a[0], b[1] - a[1]);
const cross = (ax: number, ay: number, bx: number, by: number): number => ax * by - ay * bx;
const last = (polygon: Polygon): Point => polygon[polygon.length - 1] ?? ORIGIN;

export function boundingBox(points: Polygon): { readonly min: Point; readonly max: Point } {
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const [x, y] of points) {
    [x0, y0, x1, y1] = [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x), Math.max(y1, y)];
  }
  return { min: [x0, y0], max: [x1, y1] };
}

/** Signed area by the shoelace formula. */
export function polygonArea(polygon: Polygon): number {
  let sum = 0;
  let q = last(polygon);
  for (const p of polygon) {
    sum += cross(q[0], q[1], p[0], p[1]);
    q = p;
  }
  return sum / 2;
}

export function polygonPerimeter(polygon: Polygon): number {
  let sum = 0;
  let q = last(polygon);
  for (const p of polygon) {
    sum += distance(q, p);
    q = p;
  }
  return sum;
}

/** The polygon with every edge longer than `maxEdge` halved until none is. */
export function subdividePolygon(points: Polygon, maxEdge: number): Point[] {
  const out: Point[] = [];
  const cut = (a: Point, b: Point): void => {
    if (distance(a, b) <= maxEdge) return;
    const p = lerp(a, b, 0.5);
    cut(a, p);
    out.push(p);
    cut(p, b);
  };
  let q = last(points);
  for (const p of points) {
    cut(q, p);
    out.push(p);
    q = p;
  }
  return out;
}

/** Even-odd test: whether a ray from the point crosses the border an odd number of times. */
export function pointInPoly([x, y]: Point, polygon: Polygon): boolean {
  let inside = false;
  let q = last(polygon);
  for (const p of polygon) {
    if (p[1] > y !== q[1] > y && x < ((q[0] - p[0]) * (y - p[1])) / (q[1] - p[1]) + p[0]) inside = !inside;
    q = p;
  }
  return inside;
}

function segmentDistance(p: Point, a: Point, b: Point): number {
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
  const length2 = dx * dx + dy * dy;
  const t = length2 === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / length2));
  return distance(p, [a[0] + t * dx, a[1] + t * dy]);
}

function borderDistance(p: Point, polygon: Polygon): number {
  let d = Infinity;
  let q = last(polygon);
  for (const b of polygon) {
    d = Math.min(d, segmentDistance(p, q, b));
    q = b;
  }
  return d;
}

/** The vertices furthest back and furthest forward along direction `v`. */
function extremes([vx, vy]: Point, polygon: Polygon): readonly [Point, Point] {
  let [low, high] = [Infinity, -Infinity];
  let [min, max] = [ORIGIN, ORIGIN];
  for (const p of polygon) {
    const dot = p[0] * vx + p[1] * vy;
    if (dot < low) [low, min] = [dot, p];
    if (dot > high) [high, max] = [dot, p];
  }
  return [min, max];
}

/**
 * A point well inside the polygon, by the original's heuristic: bisect chords between extreme vertices until a midpoint
 * falls inside, and keep the candidate furthest from the border. Null when every chord misses.
 */
export function findPointInPolygon(polygon: Polygon): Point | null {
  const n = polygon.length;
  const findPoint = (a: Point, b: Point, tries: number): Point | null => {
    const p = lerp(a, b, 0.5);
    if (pointInPoly(p, polygon)) return p;
    if (tries <= 1) return null;
    return findPoint(a, p, tries - 1) ?? findPoint(p, b, tries - 1);
  };
  const chords: (readonly [Point, Point])[] = [];
  for (const v of DIRECTIONS) {
    const [min, max] = extremes(v, polygon);
    const middle = lerp(min, max, 0.5);
    chords.push([min, middle], [middle, max], [min, max]);
  }
  const at = (i: number): Point => polygon[i] ?? ORIGIN;
  chords.push([at(0), at(Math.floor(n * 0.5))], [at(Math.floor(n * 0.25)), at(Math.floor(n * 0.75))]);
  let best: Point | null = null;
  let depth = -Infinity;
  for (const [a, b] of chords) {
    const q = findPoint(a, b, 10);
    if (q === null) continue;
    const d = borderDistance(q, polygon);
    if (d > depth) [best, depth] = [q, d];
  }
  return best;
}
