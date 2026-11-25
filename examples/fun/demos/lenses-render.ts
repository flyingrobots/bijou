// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// Drawing for the lenses demo (after "Lenses" by Claudio Esperança, Observable): rays, wave fronts and
// lenses stroked into a braille dot grid in the original's canvas units, then painted cell by cell.
import type { Surface } from '@flyingrobots/bijou';
import { at, focalPoint, lensOutline, sampleTrajectory, smoothControlPoints, type Leg, type Lens, type Vec } from './lenses-optics.js';
import type { Rgb } from './pixels.js';

/** A braille dot grid holding an ink per dot, 0 for none; a higher ink wins a cell's colour. */
export interface Dots {
  readonly width: number;
  readonly height: number;
  /** Dots per canvas unit. */
  readonly scale: number;
  readonly ink: Uint8Array;
}

/** Braille bit for the dot at (column, row) of a cell. */
const BITS = [[0x01, 0x08], [0x02, 0x10], [0x04, 0x20], [0x40, 0x80]] as const;
/** The original's arrows are 8 by 5 canvas pixels and its focal dots 5 across; a dot grid needs them larger, in dots. */
const ARROW_LENGTH = 5;
const ARROW_WIDTH = 4;
const FOCAL_RADIUS = 1.5;
/** Each bezier of a smoothed wave front is drawn as this many straight pieces. */
const BEZIER_PIECES = 8;

export function makeDots(columns: number, rows: number, canvasWidth: number): Dots {
  const width = Math.max(0, columns * 2);
  const height = Math.max(0, rows * 4);
  return { width, height, scale: width / canvasWidth, ink: new Uint8Array(width * height) };
}

function plot(dots: Dots, x: number, y: number, ink: number): void {
  const px = Math.round(x);
  const py = Math.round(y);
  if (px < 0 || py < 0 || px >= dots.width || py >= dots.height) return;
  const i = py * dots.width + px;
  dots.ink[i] = Math.max(dots.ink[i] ?? 0, ink);
}

/** Stroke a segment between two canvas points. */
export function segment(dots: Dots, a: Vec, b: Vec, ink: number): void {
  const [x0, y0, x1, y1] = [a[0] * dots.scale, a[1] * dots.scale, b[0] * dots.scale, b[1] * dots.scale];
  if (![x0, y0, x1, y1].every(Number.isFinite)) return;
  if ((x0 < 0 && x1 < 0) || (y0 < 0 && y1 < 0) || (x0 >= dots.width && x1 >= dots.width) || (y0 >= dots.height && y1 >= dots.height)) return;
  const n = Math.min(4 * (dots.width + dots.height), Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
  for (let k = 0; k <= n; k += 1) {
    const t = n === 0 ? 0 : k / n;
    plot(dots, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, ink);
  }
}

function polyline(dots: Dots, pts: readonly Vec[], ink: number): void {
  for (let i = 1; i < pts.length; i += 1) segment(dots, pts[i - 1] ?? [0, 0], pts[i] ?? [0, 0], ink);
}

/** A lens or mirror: its line with arrows, and a disc at its focal point. */
export function drawLens(dots: Dots, lens: Lens, ink: number): void {
  polyline(dots, lensOutline(lens, ARROW_LENGTH / dots.scale, ARROW_WIDTH / dots.scale), ink);
  const [fx, fy] = focalPoint(lens);
  const cx = fx * dots.scale;
  const cy = fy * dots.scale;
  for (let dy = -2; dy <= 2; dy += 1) {
    for (let dx = -2; dx <= 2; dx += 1) {
      if (dx * dx + dy * dy <= FOCAL_RADIUS * FOCAL_RADIUS) plot(dots, cx + dx, cy + dy, ink);
    }
  }
}

/** Every trajectory as the polyline through its legs' ends. */
export function drawRays(dots: Dots, trajectories: readonly (readonly Leg[])[], ink: number): void {
  for (const legs of trajectories) {
    const first = legs[0];
    if (first === undefined) continue;
    polyline(dots, [first[0].p, ...legs.map(([ray, t]) => at(ray, t))], ink);
  }
}

/** Closed curves through the rays at equal path length, every `step` from `tmin` to `tmax`: the original's wave fronts. */
export function drawWaveFronts(dots: Dots, trajectories: readonly (readonly Leg[])[], range: Vec, step: number, smooth: boolean, ink: number): void {
  const samples = trajectories.map((legs) => sampleTrajectory(legs, range[0], range[1], step));
  const count = samples[0]?.length ?? 0;
  const edgeRatio = smooth ? 0.33 : 0;
  for (let i = 0; i < count; i += 1) {
    if (range[0] + i * step <= 0) continue;
    const pts = samples.map((s) => s[i] ?? [0, 0]);
    const controls = smoothControlPoints(pts, edgeRatio);
    pts.forEach((p, j) => {
      const q = pts[(j + 1) % pts.length] ?? p;
      const [c1, c2] = controls[j] ?? [p, q];
      if (!smooth) {
        segment(dots, p, q, ink);
        return;
      }
      const curve = Array.from({ length: BEZIER_PIECES + 1 }, (_, k): Vec => {
        const t = k / BEZIER_PIECES;
        const [a, b, c, d] = [(1 - t) ** 3, 3 * (1 - t) ** 2 * t, 3 * (1 - t) * t * t, t ** 3];
        return [a * p[0] + b * c1[0] + c * c2[0] + d * q[0], a * p[1] + b * c1[1] + c * c2[1] + d * q[1]];
      });
      polyline(dots, curve, ink);
    });
  }
}

/** Paint the dots as braille on black, each cell in the colour of its highest ink. */
export function paintDots(surface: Surface, dots: Dots, inks: readonly Rgb[]): void {
  for (let y = 0; y < surface.height; y += 1) {
    for (let x = 0; x < surface.width; x += 1) {
      let mask = 0;
      let top = 0;
      for (let dy = 0; dy < 4; dy += 1) {
        for (let dx = 0; dx < 2; dx += 1) {
          const ink = dots.ink[(y * 4 + dy) * dots.width + x * 2 + dx] ?? 0;
          if (ink === 0) continue;
          mask |= BITS[dy]?.[dx] ?? 0;
          top = Math.max(top, ink);
        }
      }
      const [r, g, b] = inks[top] ?? [255, 255, 255];
      surface.setRGB(x, y, mask === 0 ? ' ' : String.fromCharCode(0x2800 + mask), r, g, b, 0, 0, 0);
    }
  }
}
