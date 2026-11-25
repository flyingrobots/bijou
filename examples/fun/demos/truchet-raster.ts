// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// After "012 Truchet tiles" by Saneef Ansari (Observable): each square tile holds two
// quarter circles about opposite corners, one of two ways round, inside a border.
import type { DotGrid } from './line-braille.js';

/** The original canvas is 975 units square; its margin and stroke scale with the square the demo fits. */
const CANVAS = 975;
const MARGIN = 24;
/** A stroke never thinner than this many dots either side of its centre line, so it stays joined. */
const MIN_HALF = 0.6;

/** Light the dots of the tiles (0 or 1 each, row by row, `grid` by `grid`) and the border, centred in the dot grid. */
export function drawTruchet(out: DotGrid, tiles: readonly number[], grid: number, stroke: number): void {
  const shorter = Math.min(out.width, out.height);
  const unit = shorter / CANVAS;
  const margin = Math.max(1, MARGIN * unit);
  const graphic = shorter - 2 * margin;
  const cell = graphic / grid;
  const radius = cell / 2;
  const half = Math.max(MIN_HALF, (stroke * unit) / 2);
  const left = (out.width - graphic) / 2;
  const top = (out.height - graphic) / 2;
  const onArc = (fx: number, fy: number, ax: number, ay: number): boolean => Math.abs(Math.hypot(fx - ax, fy - ay) - radius) <= half;
  for (let y = 0; y < out.height; y += 1) {
    const ry = y + 0.5 - top;
    for (let x = 0; x < out.width; x += 1) {
      const rx = x + 0.5 - left;
      if (rx < -half || ry < -half || rx > graphic + half || ry > graphic + half) continue;
      const border = Math.abs(rx) <= half || Math.abs(ry) <= half || Math.abs(rx - graphic) <= half || Math.abs(ry - graphic) <= half;
      const gx = Math.min(grid - 1, Math.max(0, Math.floor(rx / cell)));
      const gy = Math.min(grid - 1, Math.max(0, Math.floor(ry / cell)));
      const fx = rx - gx * cell;
      const fy = ry - gy * cell;
      const arcs = (tiles[gy * grid + gx] ?? 0) === 0
        ? onArc(fx, fy, 0, 0) || onArc(fx, fy, cell, cell)
        : onArc(fx, fy, 0, cell) || onArc(fx, fy, cell, 0);
      if (border || arcs) out.dots[y * out.width + x] = 1;
    }
  }
}
