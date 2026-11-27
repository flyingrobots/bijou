// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// Voronoi cells by half-plane clipping, and Mike Bostock's convex polygon incircle,
// for the Voronoi Incircles demo.

export type Point = readonly [number, number];
/** A circle as centre x, centre y and radius. */
export type Circle = readonly [number, number, number];

/** Keep the part of convex `poly` on the side of the bisector of a and b nearer a. */
function clip(poly: readonly Point[], ax: number, ay: number, bx: number, by: number): Point[] {
  const nx = bx - ax;
  const ny = by - ay;
  const c = (bx * bx + by * by - ax * ax - ay * ay) / 2;
  const side = ([x, y]: Point): number => c - (nx * x + ny * y);
  const out: Point[] = [];
  for (let i = 0; i < poly.length; i += 1) {
    const p = poly[i] ?? [0, 0];
    const q = poly[(i + 1) % poly.length] ?? p;
    const sp = side(p);
    const sq = side(q);
    if (sp >= 0) out.push(p);
    // A crossing exactly at a vertex keeps that vertex alone, so no edge has zero length.
    if ((sp >= 0) !== (sq >= 0) && sp !== 0 && sq !== 0) {
      const t = sp / (sp - sq);
      out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
    }
  }
  return out;
}

/**
 * Each site's Voronoi cell inside the box from (x0, y0) to (x1, y1), as d3's cellPolygons gives it: closed (the first
 * point repeated) and counterclockwise in y-up terms. A cell that misses the box is left out.
 */
export function cellPolygons(sites: readonly number[], x0: number, y0: number, x1: number, y1: number): Point[][] {
  const n = Math.floor(sites.length / 2);
  const cells: Point[][] = [];
  for (let i = 0; i < n; i += 1) {
    const ax = sites[i * 2] ?? 0;
    const ay = sites[i * 2 + 1] ?? 0;
    let poly: Point[] = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
    for (let j = 0; j < n && poly.length >= 3; j += 1) {
      if (j !== i) poly = clip(poly, ax, ay, sites[j * 2] ?? 0, sites[j * 2 + 1] ?? 0);
    }
    const first = poly[0];
    if (poly.length >= 3 && first !== undefined) cells.push([...poly, first]);
  }
  return cells;
}

function pointLineDistance([x0, y0]: Point, [x2, y2]: Point, [x1, y1]: Point): number {
  const x21 = x2 - x1;
  const y21 = y2 - y1;
  return (y21 * x0 - x21 * y0 + x2 * y1 - y2 * x1) / Math.sqrt(y21 * y21 + x21 * x21);
}

function lineLineBisect([x0, y0]: Point, [x1, y1]: Point, [x2, y2]: Point, [x3, y3]: Point): readonly [Point, Point] {
  const x02 = x0 - x2;
  const y02 = y0 - y2;
  const x10 = x1 - x0;
  const y10 = y1 - y0;
  const l10 = Math.sqrt(x10 ** 2 + y10 ** 2);
  const x32 = x3 - x2;
  const y32 = y3 - y2;
  const l32 = Math.sqrt(x32 ** 2 + y32 ** 2);
  const ti = (x32 * y02 - y32 * x02) / (y32 * x10 - x32 * y10);
  const xi = x0 + ti * x10;
  const yi = y0 + ti * y10;
  return [[xi, yi], [xi + x10 / l10 + x32 / l32, yi + y10 / l10 + y32 / l32]];
}

function lineLineIntersect([x0, y0]: Point, [x1, y1]: Point, [x2, y2]: Point, [x3, y3]: Point): Point {
  const x02 = x0 - x2;
  const y02 = y0 - y2;
  const x10 = x1 - x0;
  const y10 = y1 - y0;
  const x32 = x3 - x2;
  const y32 = y3 - y2;
  const t = (x32 * y02 - y32 * x02) / (y32 * x10 - x32 * y10);
  return [x0 + t * x10, y0 + t * y10];
}

function circleTangent(p0: Point, p1: Point, p2: Point, p3: Point, p4: Point, p5: Point): Circle {
  const [a0, a1] = lineLineBisect(p0, p1, p3, p2);
  const [b0, b1] = lineLineBisect(p2, p3, p5, p4);
  const i = lineLineIntersect(a0, a1, b0, b1);
  return [i[0], i[1], pointLineDistance(i, p0, p1)];
}

/**
 * The largest circle inside closed convex `polygon`: the circle tangent to each triple of edges that clears every other
 * edge. A triple with parallel edges gives no finite circle and is skipped.
 */
export function polygonIncircle(polygon: readonly Point[]): Circle {
  let circle: Circle = [Number.NaN, Number.NaN, 0];
  const n = polygon.length - 1;
  const at = (k: number): Point => polygon[k] ?? [0, 0];
  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      search: for (let k = j + 1; k < n; k += 1) {
        const c = circleTangent(at(i), at(i + 1), at(j), at(j + 1), at(k), at(k + 1));
        if (!Number.isFinite(c[0]) || !Number.isFinite(c[1]) || !(c[2] > circle[2]) || !Number.isFinite(c[2])) continue;
        for (let l = 0; l < n; l += 1) {
          if (l === i || l === j || l === k) continue;
          const d = pointLineDistance([c[0], c[1]], at(l), at(l + 1));
          if (!(d + 1e-6 >= c[2])) continue search;
        }
        circle = c;
      }
    }
  }
  return circle;
}
