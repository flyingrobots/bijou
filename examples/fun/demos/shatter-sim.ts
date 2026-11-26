// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// Glyph debris: each particle is one dashboard cell flying under gravity, bouncing off the walls and floor, and
// coming to rest on a grid pile that slides like sand. Every step returns new arrays; the inputs are kept.
import { nextRandom } from '../random.js';

export interface Sim {
  readonly w: number;
  readonly h: number;
  readonly x: Float32Array;
  readonly y: Float32Array;
  readonly vx: Float32Array;
  readonly vy: Float32Array;
  /** 1 while a particle rests on the pile, snapped to its cell. */
  readonly rest: Uint8Array;
  /** The cell each particle came from: where its glyph is read and where rewind returns it. */
  readonly hx: Int16Array;
  readonly hy: Int16Array;
}

/** A pointer that moved this pulse: where it is and how far it went, in cells. */
export interface Push { readonly col: number; readonly row: number; readonly dx: number; readonly dy: number }

const PUSH_RADIUS = 3.5;
const MAX_SUBSTEPS = 4;

/** Particles at rest on their home cells, in a w by h pane. */
export function assemble(cells: readonly (readonly [number, number])[], w: number, h: number): Sim {
  const n = cells.length;
  const sim: Sim = {
    w, h, x: new Float32Array(n), y: new Float32Array(n), vx: new Float32Array(n), vy: new Float32Array(n),
    rest: new Uint8Array(n), hx: new Int16Array(n), hy: new Int16Array(n),
  };
  cells.forEach(([cx, cy], i) => { sim.x[i] = cx; sim.y[i] = cy; sim.hx[i] = cx; sim.hy[i] = cy; });
  return sim;
}

const copy = (sim: Sim): Sim => ({
  ...sim, x: sim.x.slice(), y: sim.y.slice(), vx: sim.vx.slice(), vy: sim.vy.slice(), rest: sim.rest.slice(),
});

/** Throw every particle away from the impact cell, harder the nearer it is, with seeded jitter. Returns the next seed. */
export function blast(sim: Sim, col: number, row: number, seed: number): readonly [Sim, number] {
  const next = copy(sim);
  const scale = Math.max(1, sim.w / 80);
  let rng = seed;
  for (let i = 0; i < next.x.length; i += 1) {
    const [a, s1] = nextRandom(rng);
    const [b, s2] = nextRandom(s1);
    rng = s2;
    const dx = (next.x[i] ?? 0) - col;
    const dy = ((next.y[i] ?? 0) - row) * 2;
    const d = Math.hypot(dx, dy) + 1;
    const speed = (8 + 38 * Math.exp(-d / (22 * scale)) + 10 * a) * scale;
    next.vx[i] = (next.vx[i] ?? 0) + (dx / d) * speed * (0.7 + 0.6 * b) + (a - 0.5) * 6;
    next.vy[i] = (next.vy[i] ?? 0) + ((dy / d) * speed) / 2 - 6 - 12 * b;
    next.rest[i] = 0;
  }
  return [next, rng];
}

function occupancy(sim: Sim): Int32Array {
  const grid = new Int32Array(sim.w * sim.h).fill(-1);
  for (let i = 0; i < sim.x.length; i += 1) {
    if (sim.rest[i] === 1) grid[(sim.y[i] ?? 0) * sim.w + (sim.x[i] ?? 0)] = i;
  }
  return grid;
}

function shove(sim: Sim, i: number, push: Push): boolean {
  const dx = (sim.x[i] ?? 0) - push.col;
  const dy = ((sim.y[i] ?? 0) - push.row) * 2;
  const d = Math.hypot(dx, dy);
  if (d > PUSH_RADIUS * 2) return false;
  const k = (1 - d / (PUSH_RADIUS * 2)) * 30;
  sim.vx[i] = (sim.vx[i] ?? 0) + (dx / (d + 0.5)) * k + push.dx * 6;
  sim.vy[i] = (sim.vy[i] ?? 0) + (dy / (d + 0.5)) * k * 0.5 + push.dy * 3 - 8;
  return true;
}

/** Snap particle i to the first free cell at or above (cx, cy). False when the column is full. */
function settle(sim: Sim, grid: Int32Array, i: number, cx: number, cy: number): boolean {
  for (let y = cy; y >= 0; y -= 1) {
    if ((grid[y * sim.w + cx] ?? 0) >= 0) continue;
    sim.x[i] = cx; sim.y[i] = y; sim.vx[i] = 0; sim.vy[i] = 0; sim.rest[i] = 1;
    grid[y * sim.w + cx] = i;
    return true;
  }
  return false;
}

function resting(sim: Sim, grid: Int32Array, i: number, frame: number): boolean {
  const x = sim.x[i] ?? 0;
  const y = sim.y[i] ?? 0;
  if (y >= sim.h - 1) return false;
  const free = (cx: number, cy: number): boolean => cx >= 0 && cx < sim.w && (grid[cy * sim.w + cx] ?? 0) < 0;
  if (free(x, y + 1)) { sim.rest[i] = 0; grid[y * sim.w + x] = -1; return true; }
  const side = (i + frame) % 2 === 0 ? 1 : -1;
  for (const s of [side, -side]) {
    if (!free(x + s, y + 1) || !free(x + s, y)) continue;
    grid[y * sim.w + x] = -1;
    sim.x[i] = x + s; sim.y[i] = y + 1;
    grid[(y + 1) * sim.w + x + s] = i;
    return true;
  }
  return false;
}

function fly(sim: Sim, grid: Int32Array, i: number, dt: number, gravity: number): void {
  const { w, h } = sim;
  const n = Math.min(MAX_SUBSTEPS, Math.max(1, Math.ceil((Math.max(Math.abs(sim.vx[i] ?? 0), Math.abs(sim.vy[i] ?? 0)) * dt) / 0.9)));
  const sub = dt / n;
  for (let s = 0; s < n && sim.rest[i] === 0; s += 1) {
    let vx = sim.vx[i] ?? 0;
    let vy = (sim.vy[i] ?? 0) + gravity * sub;
    let nx = (sim.x[i] ?? 0) + vx * sub;
    let ny = (sim.y[i] ?? 0) + vy * sub;
    if (nx < 0 || nx > w - 1) { nx = Math.max(0, Math.min(w - 1, nx)); vx = -vx * 0.55; }
    if (ny < 0) { ny = 0; vy = Math.abs(vy) * 0.3; }
    const cx = Math.round(nx);
    const cy = Math.min(h - 1, Math.round(ny));
    const hit = ny >= h - 1 || (grid[cy * w + cx] ?? -1) >= 0;
    if (hit && vy > 0) {
      if (vy > 14) { vy = -vy * 0.35; vx *= 0.75; ny = Math.min(ny, cy - 0.5); } else if (settle(sim, grid, i, cx, ny >= h - 1 ? h - 1 : cy - 1)) return;
    } else if (hit) { nx = sim.x[i] ?? nx; vx = -vx * 0.4; }
    sim.x[i] = nx; sim.y[i] = ny; sim.vx[i] = vx; sim.vy[i] = vy;
  }
}

/** One pulse of `dt` seconds. Returns the next sim and whether anything moved. */
export function step(sim: Sim, dt: number, frame: number, push: Push | null): readonly [Sim, boolean] {
  const next = copy(sim);
  const grid = occupancy(next);
  const gravity = Math.max(30, sim.h * 1.5);
  let moved = false;
  for (let i = 0; i < next.x.length; i += 1) {
    if (next.rest[i] === 1) {
      if (push !== null && shove(next, i, push)) {
        next.rest[i] = 0;
        grid[(next.y[i] ?? 0) * next.w + (next.x[i] ?? 0)] = -1;
      } else {
        moved = resting(next, grid, i, frame) || moved;
        continue;
      }
    } else if (push !== null) shove(next, i, push);
    fly(next, grid, i, dt, gravity);
    moved = true;
  }
  return [next, moved];
}
