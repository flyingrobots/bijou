// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// After "039 Deformed Rectangles" by Saneef Ansari (Observable), itself after
// "201216a" by Okazz: split a quad in two along its longer pair of sides, at
// random ratios on each side, and recurse.
import { nextRandom } from '../random.js';

export type Point = readonly [number, number];

export interface Quad {
  /** Corners in order, in the unit square. */
  readonly corners: readonly [Point, Point, Point, Point];
  /** Index into the palette's fills. */
  readonly fill: number;
}

const between = ([x1, y1]: Point, [x2, y2]: Point, t: number): Point => [x1 + t * (x2 - x1), y1 + t * (y2 - y1)];
const distance = ([x1, y1]: Point, [x2, y2]: Point): number => Math.hypot(x2 - x1, y2 - y1);

/**
 * The quads of `passes` levels of splitting from the unit square, and the seed after them. `skewness` in [0, 1]
 * sets how unevenly a side may be cut: the original cuts at whole steps of 1 / (2 + 8 skewness).
 */
export function divide(seed: number, passes: number, skewness: number, fills: number): readonly [Quad[], number] {
  let rng = seed;
  const random = (): number => {
    const [value, next] = nextRandom(rng);
    rng = next;
    return value;
  };
  const steps = 2 + 8 * skewness;
  const ratio = (): number => Math.floor(1 + random() * (steps - 1)) / steps;
  const quads: Quad[] = [];
  const split = (p1: Point, p2: Point, p3: Point, p4: Point, n: number): void => {
    if (n <= 1) {
      quads.push({ corners: [p1, p2, p3, p4], fill: Math.floor(random() * fills) });
      return;
    }
    const w = distance(p1, p2) + distance(p3, p4);
    const h = distance(p1, p4) + distance(p2, p3);
    const r1 = ratio();
    const r2 = ratio();
    if (w < h) {
      const v1 = between(p1, p4, r1);
      const v2 = between(p2, p3, r2);
      split(p1, p2, v2, v1, n - 1);
      split(v1, v2, p3, p4, n - 1);
    } else {
      const v1 = between(p1, p2, r1);
      const v2 = between(p4, p3, r2);
      split(p1, v1, v2, p4, n - 1);
      split(v1, p2, p3, v2, n - 1);
    }
  };
  split([0, 0], [1, 0], [1, 1], [0, 1], passes);
  return [quads, rng];
}

/** Signed distance from `p` to the edge a→b, positive on the inside of a counter-clockwise or clockwise quad. */
function edgeDistance([px, py]: Point, [ax, ay]: Point, [bx, by]: Point, sign: number): number {
  const length = Math.hypot(bx - ax, by - ay) || 1;
  return (sign * ((bx - ax) * (py - ay) - (by - ay) * (px - ax))) / length;
}

/**
 * How far inside the quad the point lies: the smallest distance to its four edges, negative outside. Every quad the
 * split makes is convex, since each cut joins two sides of a convex quad.
 */
export function insideDepth(quad: Quad, point: Point): number {
  const [a, b, c, d] = quad.corners;
  const sign = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]) >= 0 ? 1 : -1;
  return Math.min(edgeDistance(point, a, b, sign), edgeDistance(point, b, c, sign), edgeDistance(point, c, d, sign), edgeDistance(point, d, a, sign));
}
