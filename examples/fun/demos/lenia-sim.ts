// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// The Lenia update of Bert Chan: every cell weighs its neighbourhood through a smooth ring kernel, a Gaussian growth
// function turns that potential into growth or decay, and the state moves a small time step towards it.
import { SCENES, stampOrbium } from './lenia-species.js';

/** A toroidal grid of states in [0, 1] and the potential that produced it, which the view paints as a glow. */
export interface World {
  readonly width: number;
  readonly height: number;
  readonly cells: Float32Array;
  readonly potential: Float32Array;
}

/** The kernel radius in cells; the Orbium pattern is published at this radius. */
export const RADIUS = 13;
/** The time step: ten steps make one unit of Lenia time. */
export const DT = 0.1;
/** The largest grid, so a step stays cheap even when the whole torus is alive. */
export const MAX_W = 128;
export const MAX_H = 96;
/** The smallest grid, so the kernel never wraps onto itself. */
const MIN_W = 48;
const MIN_H = 36;

interface Row {
  readonly dy: number;
  readonly dx: Int32Array;
  readonly weight: Float32Array;
}

/** The ring kernel with the exponential core exp(4 - 1 / (r (1 - r))), as rows of taps, normalised to sum to 1. */
function ringKernel(radius: number): readonly Row[] {
  const raw: Row[] = [];
  let total = 0;
  for (let dy = -radius; dy <= radius; dy += 1) {
    const dxs: number[] = [];
    const ws: number[] = [];
    for (let dx = -radius; dx <= radius; dx += 1) {
      const r = Math.hypot(dx, dy) / radius;
      if (r <= 0 || r >= 1) continue;
      const k = Math.exp(4 - 1 / (r * (1 - r)));
      if (k < 1e-6) continue;
      dxs.push(dx);
      ws.push(k);
      total += k;
    }
    if (dxs.length > 0) raw.push({ dy, dx: Int32Array.from(dxs), weight: Float32Array.from(ws) });
  }
  return raw.map((row) => ({ ...row, weight: row.weight.map((k) => k / total) }));
}

const KERNEL = ringKernel(RADIUS);

/** The grid for a pane of `width` by `height` cells: one Lenia cell per half-block pixel, scaled down to the cap. */
export function gridFor(width: number, height: number): readonly [number, number] {
  const pw = Math.max(1, width);
  const ph = Math.max(1, height * 2);
  const scale = Math.min(1, MAX_W / pw, MAX_H / ph);
  return [Math.max(MIN_W, Math.round(pw * scale)), Math.max(MIN_H, Math.round(ph * scale))];
}

/** A fresh world for scene `scene`, and the next seed. */
export function seedWorld(width: number, height: number, scene: number, seed: number): readonly [World, number] {
  const cells = new Float32Array(width * height);
  const chosen = SCENES[((scene % SCENES.length) + SCENES.length) % SCENES.length] ?? SCENES[0];
  const next = chosen === undefined ? seed : chosen.fill(cells, width, height, seed);
  return [{ width, height, cells, potential: new Float32Array(width * height) }, next];
}

/** The world with one more Orbium centred at grid cell (x, y). */
export function addOrbium(world: World, x: number, y: number, turn: number, flip: boolean): World {
  const cells = Float32Array.from(world.cells);
  stampOrbium(cells, world.width, world.height, x, y, turn, flip);
  return { ...world, cells };
}

function wrapTable(size: number): Int32Array {
  return Int32Array.from({ length: size + 2 * RADIUS + 1 }, (_, i) => (((i - RADIUS) % size) + size) % size);
}

/**
 * One step. The convolution scatters each living cell through the kernel, so a sparse world of a few creatures costs
 * a few hundred taps per creature cell and an empty cell costs nothing.
 */
export function step(world: World, mu: number, sigma: number): World {
  const { width: w, height: h, cells } = world;
  const potential = new Float32Array(w * h);
  const wrapX = wrapTable(w);
  const wrapY = wrapTable(h);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const a = cells[y * w + x] ?? 0;
      if (a === 0) continue;
      for (const row of KERNEL) {
        const base = (wrapY[y + row.dy + RADIUS] ?? 0) * w;
        const { dx, weight } = row;
        for (let t = 0; t < dx.length; t += 1) {
          const i = base + (wrapX[x + (dx[t] ?? 0) + RADIUS] ?? 0);
          potential[i] = (potential[i] ?? 0) + a * (weight[t] ?? 0);
        }
      }
    }
  }
  const next = new Float32Array(w * h);
  const spread = 2 * sigma * sigma;
  for (let i = 0; i < next.length; i += 1) {
    const d = (potential[i] ?? 0) - mu;
    const growth = 2 * Math.exp(-(d * d) / spread) - 1;
    next[i] = Math.max(0, Math.min(1, (cells[i] ?? 0) + DT * growth));
  }
  return { width: w, height: h, cells: next, potential };
}

/** The state at grid point (x, y), read bilinearly across the torus. */
export function sample(field: Float32Array, width: number, height: number, x: number, y: number): number {
  const fx = Math.floor(x);
  const fy = Math.floor(y);
  const tx = x - fx;
  const ty = y - fy;
  const x0 = ((fx % width) + width) % width;
  const y0 = ((fy % height) + height) % height;
  const x1 = (x0 + 1) % width;
  const y1 = (y0 + 1) % height;
  const top = (field[y0 * width + x0] ?? 0) * (1 - tx) + (field[y0 * width + x1] ?? 0) * tx;
  const bottom = (field[y1 * width + x0] ?? 0) * (1 - tx) + (field[y1 * width + x1] ?? 0) * tx;
  return top * (1 - ty) + bottom * ty;
}
