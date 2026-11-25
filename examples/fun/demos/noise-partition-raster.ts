// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// After "Noise plane partition" by Claudio Esperança (Observable): the pieces
// filled into a grid of sub-pixels, and the colour each sub-pixel reads as.
import type { Surface } from '@flyingrobots/bijou';
import type { Point } from './noise-partition-polygon.js';
import { paintPixels, type Rgb } from './pixels.js';

export const SUPERSAMPLE = 2;

/** Each sub-pixel's piece index, -1 for the ground. */
export interface Raster {
  readonly width: number;
  readonly height: number;
  readonly cells: Int16Array;
}

/** An empty raster for a pane of `columns` by `rows` cells: half blocks, supersampled. */
export function createRaster(columns: number, rows: number): Raster {
  const width = columns * SUPERSAMPLE;
  const height = rows * 2 * SUPERSAMPLE;
  return { width, height, cells: new Int16Array(width * height).fill(-1) };
}

/** World coordinates, `width` by `height`, to the raster's sub-pixels. */
export function toRaster(raster: Raster, width: number, height: number): (p: Point) => Point {
  const sx = raster.width / width;
  const sy = raster.height / height;
  return ([x, y]) => [x * sx, y * sy];
}

/** Fill the polygon (even-odd, at sub-pixel centres) with `index`, edge by edge into row buckets. */
export function fillPolygon(raster: Raster, points: readonly Point[], index: number): void {
  const { width, height, cells } = raster;
  let [top, bottom] = [Infinity, -Infinity];
  for (const [, y] of points) [top, bottom] = [Math.min(top, y), Math.max(bottom, y)];
  const r0 = Math.max(0, Math.ceil(top - 0.5));
  const r1 = Math.min(height - 1, Math.floor(bottom - 0.5));
  let q = points[points.length - 1];
  if (r1 < r0 || q === undefined) return;
  const rows: number[][] = Array.from({ length: r1 - r0 + 1 }, () => []);
  for (const p of points) {
    const [ya, yb] = [q[1], p[1]];
    if (ya !== yb) {
      const lo = Math.max(r0, Math.ceil(Math.min(ya, yb) - 0.5));
      const hi = Math.min(r1, Math.ceil(Math.max(ya, yb) - 0.5) - 1);
      for (let r = lo; r <= hi; r += 1) rows[r - r0]?.push(q[0] + ((r + 0.5 - ya) * (p[0] - q[0])) / (yb - ya));
    }
    q = p;
  }
  rows.forEach((xs, i) => {
    xs.sort((m, n) => m - n);
    const base = (r0 + i) * width;
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const c0 = Math.max(0, Math.ceil((xs[k] ?? 0) - 0.5));
      const c1 = Math.min(width, Math.ceil((xs[k + 1] ?? 0) - 0.5));
      if (c1 > c0) cells.fill(index, base + c0, base + c1);
    }
  });
}

/** The colour of sub-pixel (x, y); with `line` set, a sub-pixel whose right or lower neighbour is another piece is line. */
export function sampleColour(raster: Raster, x: number, y: number, colours: readonly Rgb[], ground: Rgb, line: Rgb | null): Rgb {
  const { width, height, cells } = raster;
  const at = y * width + x;
  const index = cells[at] ?? -1;
  if (line !== null && ((x + 1 < width && cells[at + 1] !== index) || (y + 1 < height && cells[at + width] !== index))) return line;
  return index < 0 ? ground : (colours[index] ?? ground);
}

/** Paint the pane from a colour per raster sub-pixel. */
export function paintSubPixels(surface: Surface, colour: (x: number, y: number) => Rgb): void {
  paintPixels(surface, (x, y) => colour(Math.floor(x * SUPERSAMPLE), Math.floor(y * SUPERSAMPLE)), SUPERSAMPLE);
}
