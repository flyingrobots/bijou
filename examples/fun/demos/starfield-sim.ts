// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// After "Star field" by Mike Bostock (d3, Observable): 10,000 stars rush past the
// viewer; each frame fades the canvas and strokes every star's last step.
import { nextRandom } from '../random.js';

/** The stars, in the original's world units: x and y in [-0.5, 0.5) of the field, z in (0, 1]. */
export interface Stars {
  readonly x: Float64Array;
  readonly y: Float64Array;
  readonly z: Float64Array;
}

/** A braille dot grid, two dots per cell across and four down, holding each dot's brightness in [0, 1]. */
export interface Trail {
  readonly width: number;
  readonly height: number;
  readonly light: Float32Array;
}

/** The original fades with a 5% black fill every frame at 60 Hz. */
export const FADE_PER_FRAME = 0.95;
/** The original's depth step per 60 Hz frame. */
export const SPEED = 0.001;

export function emptyTrail(columns: number, rows: number): Trail {
  const width = Math.max(0, columns * 2);
  const height = Math.max(0, rows * 4);
  return { width, height, light: new Float32Array(width * height) };
}

/** `count` stars from the seed, and the seed after them. The original draws x, y and z from one LCG. */
export function seedStars(count: number, seed: number): readonly [Stars, number] {
  const x = new Float64Array(count);
  const y = new Float64Array(count);
  const z = new Float64Array(count);
  let rng = seed;
  for (let i = 0; i < count; i += 1) {
    const [rx, s1] = nextRandom(rng);
    const [ry, s2] = nextRandom(s1);
    const [rz, s3] = nextRandom(s2);
    x[i] = rx - 0.5;
    y[i] = ry - 0.5;
    z[i] = rz;
    rng = s3;
  }
  return [{ x, y, z }, rng];
}

/** Brighten one dot the way canvas source-over blends white at `alpha` onto it. */
function plot(trail: Trail, px: number, py: number, alpha: number): void {
  if (px < 0 || py < 0 || px >= trail.width || py >= trail.height) return;
  const at = py * trail.width + px;
  const old = trail.light[at] ?? 0;
  trail.light[at] = old + (1 - old) * alpha;
}

/** Clip the segment to the grid (Liang–Barsky); null when it misses. A star near z = 0 projects far outside. */
function clip(x1: number, y1: number, x2: number, y2: number, w: number, h: number): readonly number[] | null {
  let t0 = 0;
  let t1 = 1;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const edges: readonly (readonly [number, number])[] = [[-dx, x1], [dx, w - 1 - x1], [-dy, y1], [dy, h - 1 - y1]];
  for (const [p, q] of edges) {
    if (p === 0) { if (q < 0) return null; continue; }
    const r = q / p;
    if (p < 0) { if (r > t1) return null; t0 = Math.max(t0, r); } else { if (r < t0) return null; t1 = Math.min(t1, r); }
  }
  return [x1 + t0 * dx, y1 + t0 * dy, x1 + t1 * dx, y1 + t1 * dy];
}

/** Stroke a line of dots from one point to another at one brightness, each dot once. */
export function stroke(trail: Trail, from: readonly [number, number], to: readonly [number, number], alpha: number): void {
  const clipped = clip(from[0], from[1], to[0], to[1], trail.width, trail.height);
  if (clipped === null || alpha <= 0) return;
  const [ax = 0, ay = 0, bx = 0, by = 0] = clipped;
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(bx - ax), Math.abs(by - ay))));
  for (let s = 0; s <= steps; s += 1) {
    plot(trail, Math.round(ax + ((bx - ax) * s) / steps), Math.round(ay + ((by - ay) * s) / steps), alpha);
  }
}

/** Where a star at world (x, y) and depth z lands on the grid, with the vanishing point at `centre`. */
function project(stars: Stars, i: number, trail: Trail, centre: readonly [number, number]): readonly [number, number] {
  const z = stars.z[i] ?? 1;
  return [centre[0] + ((stars.x[i] ?? 0) / z) * trail.width, centre[1] + ((stars.y[i] ?? 0) / z) * trail.height];
}

/**
 * One step of `frames` 60 Hz frames: fade the trail, move every star `SPEED * warp * frames` closer and stroke the
 * step it took, respawning a star that passes the viewer at the far plane. Returns new arrays; the inputs are kept.
 */
export function step(
  stars: Stars, trail: Trail, seed: number, frames: number, warp: number, centre: readonly [number, number],
): readonly [Stars, Trail, number] {
  const next: Stars = { x: stars.x.slice(), y: stars.y.slice(), z: stars.z.slice() };
  const fade = FADE_PER_FRAME ** frames;
  const faded: Trail = { ...trail, light: trail.light.map((value) => value * fade) };
  let rng = seed;
  for (let i = 0; i < next.z.length; i += 1) {
    const from = project(next, i, faded, centre);
    next.z[i] = (next.z[i] ?? 1) - SPEED * warp * frames;
    const to = project(next, i, faded, centre);
    if ((next.z[i] ?? 1) < 0) {
      const [rx, s1] = nextRandom(rng);
      const [ry, s2] = nextRandom(s1);
      rng = s2;
      next.x[i] = rx - 0.5;
      next.y[i] = ry - 0.5;
      next.z[i] = 1;
    }
    const z = next.z[i] ?? 1;
    stroke(faded, from, to, 1 - z * z);
  }
  return [next, faded, rng];
}
