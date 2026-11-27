// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// Shatter's pile: the grid of glyphs at rest, one per cell. Glyphs land on it, slide off it like sand, and fall
// again when the cell under them empties.
import type { Sim } from './shatter-sim.js';

/** Which particle rests in each cell, or -1. */
export function occupancy(sim: Sim): Int32Array {
  const grid = new Int32Array(sim.w * sim.h).fill(-1);
  for (let i = 0; i < sim.x.length; i += 1) {
    if (sim.rest[i] === 1) grid[(sim.y[i] ?? 0) * sim.w + (sim.x[i] ?? 0)] = i;
  }
  return grid;
}

const open = (sim: Sim, grid: Int32Array, x: number, y: number): boolean =>
  x >= 0 && x < sim.w && (grid[y * sim.w + x] ?? 0) < 0;

/**
 * Snap particle i to the first free cell at or above (cx, cy), or in the nearest column beside it that has one: a
 * glyph the pile grew around is pushed out of it rather than trapped. The cell found drops straight down onto the
 * floor or the pile, so a settled glyph is always supported. False only when the pane is full.
 */
export function settle(sim: Sim, grid: Int32Array, i: number, cx: number, cy: number): boolean {
  for (let d = 0; d < sim.w; d += 1) {
    for (const x of d === 0 ? [cx] : [cx - d, cx + d]) {
      let y = cy;
      while (y >= 0 && !open(sim, grid, x, y)) y -= 1;
      if (y < 0) continue;
      while (y + 1 < sim.h && open(sim, grid, x, y + 1)) y += 1;
      sim.x[i] = x; sim.y[i] = y; sim.vx[i] = 0; sim.vy[i] = 0; sim.rest[i] = 1;
      grid[y * sim.w + x] = i;
      return true;
    }
  }
  return false;
}

/** A resting particle falls when the cell under it empties, or slides down a free diagonal. True when it moved. */
export function resting(sim: Sim, grid: Int32Array, i: number, frame: number): boolean {
  const x = sim.x[i] ?? 0;
  const y = sim.y[i] ?? 0;
  if (y >= sim.h - 1) return false;
  if (open(sim, grid, x, y + 1)) { sim.rest[i] = 0; grid[y * sim.w + x] = -1; return true; }
  const side = (i + frame) % 2 === 0 ? 1 : -1;
  for (const s of [side, -side]) {
    if (!open(sim, grid, x + s, y + 1) || !open(sim, grid, x + s, y)) continue;
    grid[y * sim.w + x] = -1;
    sim.x[i] = x + s; sim.y[i] = y + 1;
    grid[(y + 1) * sim.w + x + s] = i;
    return true;
  }
  return false;
}
