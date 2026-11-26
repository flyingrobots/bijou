// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// After "037 Shapes on a QuadTree" by Saneef Ansari (Observable): the points, the
// quadrant outlines and the shapes, drawn in that order into a sub-pixel raster.
import type { Box, Layout, Leaf } from './quadtree-layout.js';

/** What to draw, as the original's three toggles. */
export interface Layers {
  readonly points: boolean;
  readonly quads: boolean;
  readonly shapes: boolean;
}

/** In the raster: the ground. */
export const GROUND = -1;
/** In the raster: the stroke colour, for points and quadrant outlines. */
export const STROKE = -2;

/** The original's sliders at their defaults: margin 0.333 of a third, gap 0.25 of a fiftieth. */
const MARGIN_UV = 0.333;
const GAP_UV = 0.25;

type Point = readonly [number, number];

/** Whether `p` is inside the convex polygon `poly`, wound either way. */
function insideConvex(poly: readonly Point[], p: Point): boolean {
  let sign = 0;
  for (let i = 0; i < poly.length; i += 1) {
    const [ax, ay] = poly[i] ?? [0, 0];
    const [bx, by] = poly[(i + 1) % poly.length] ?? [0, 0];
    const cross = (bx - ax) * (p[1] - ay) - (by - ay) * (p[0] - ax);
    if (cross === 0) continue;
    if (sign === 0) sign = Math.sign(cross);
    else if (Math.sign(cross) !== sign) return false;
  }
  return true;
}

/** The original's slash polygons: a band `t` thick from one corner of the box to the opposite one. */
function slash(x: number, y: number, w: number, h: number, t: number, forward: boolean): readonly Point[] {
  const forwardBand: Point[] = [[x + w - t / 2, y], [x + w, y], [x + w, y + t / 2], [x + t / 2, y + h], [x, y + h], [x, y + h - t / 2]];
  const backwardBand: Point[] = [[x + t / 2, y], [x, y], [x, y + t / 2], [x + w - t / 2, y + h], [x + w, y + h], [x + w, y + h - t / 2]];
  return forward ? forwardBand : backwardBand;
}

/** The test for one shape drawn into the box at (x, y), w by h, or null for the empty shape. */
function shapeTest(leaf: Leaf, x: number, y: number, w: number, h: number, t: number): ((p: Point) => boolean) | null {
  switch (leaf.shape) {
    case 'empty':
      return null;
    case 'square':
      return () => true;
    case 'circle': {
      const r = Math.min(w, h) / 2;
      return ([px, py]) => (px - x - r) ** 2 + (py - y - r) ** 2 <= r * r;
    }
    case 'forwardSlash':
    case 'backwardSlash': {
      const poly = slash(x, y, w, h, t, leaf.shape === 'forwardSlash');
      return (p) => insideConvex(poly, p);
    }
  }
}

/**
 * Rasterize the layout into a w by h grid of palette indices, GROUND and STROKE. `unit` is one picture pixel. `time`
 * in seconds makes each shape breathe inside its quadrant, between 80% and 100% of it, each on its own phase.
 */
export function rasterize(layout: Layout, layers: Layers, w: number, h: number, unit: number, time = 0): Int16Array {
  const out = new Int16Array(w * h).fill(GROUND);
  const maxSize = Math.min(w, h);
  const margin = (MARGIN_UV * maxSize) / 3;
  const size = maxSize - 2 * margin;
  const left = (w - size) / 2;
  const top = (h - size) / 2;
  const gap = (GAP_UV * maxSize) / 50;
  const thick = maxSize / 30;
  const fill = (x0: number, y0: number, x1: number, y1: number, value: (p: Point) => number | null): void => {
    for (let y = Math.max(0, Math.floor(y0)); y < Math.min(h, Math.ceil(y1)); y += 1) {
      for (let x = Math.max(0, Math.floor(x0)); x < Math.min(w, Math.ceil(x1)); x += 1) {
        const v = value([x + 0.5, y + 0.5]);
        if (v !== null) out[y * w + x] = v;
      }
    }
  };
  const toPixels = (b: Box): readonly [number, number, number, number] => [left + b.x * size, top + b.y * size, b.w * size, b.h * size];
  if (layers.points) {
    for (const p of layout.points) {
      const [x, y, pw, ph] = toPixels(p);
      fill(x, y, x + Math.max(unit, pw), y + Math.max(unit, ph), () => STROKE);
    }
  }
  if (layers.quads) {
    const half = Math.max(unit / 2, maxSize / 600);
    for (const leaf of layout.leaves) {
      const [x, y, bw, bh] = toPixels(leaf.box);
      fill(x - half, y - half, x + bw + half, y + bh + half, ([px, py]) =>
        (Math.abs(px - x) <= half || Math.abs(px - x - bw) <= half || Math.abs(py - y) <= half || Math.abs(py - y - bh) <= half) ? STROKE : null);
    }
  }
  if (layers.shapes) {
    layout.leaves.forEach((leaf, index) => {
      const [bx, by, bw, bh] = toPixels(leaf.box);
      const scale = 0.9 + 0.1 * Math.sin(time * 1.6 + index * 0.9);
      const sw = (bw - gap) * scale;
      const sh = (bh - gap) * scale;
      const x = bx + (bw - sw) / 2;
      const y = by + (bh - sh) / 2;
      if (sw <= 0 || sh <= 0) return;
      const test = shapeTest(leaf, x, y, sw, sh, thick);
      if (test !== null) fill(x, y, x + sw, y + sh, (p) => (test(p) ? leaf.fill : null));
    });
  }
  return out;
}
