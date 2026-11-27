// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// The trails of "Generating SVGs" by makio135 (Observable): each trail walks a noise field, widening from a point
// to a full stroke, and ends in a round head; every trail is laid down at 0.9 opacity over the ones before it.
import { nextRandom } from '../random.js';
import type { Noise3 } from './noise.js';
import type { Rgb } from './pixels.js';

/** The original's parameters are in its pixels; a picture this many of them wide keeps their proportions. */
export const REF_WIDTH = 600;
/** The original's A4 sheet, `w` by `w / 210 * 297`, at REF_WIDTH. */
const SHEET_AREA = (REF_WIDTH * REF_WIDTH * 297) / 210;
const TRAIL_STEPS = 150;
const STEP = 5;
const STROKE = 20;
const NOISE_SCALE = 1200;
const OPACITY = 0.9;
/** Every third step becomes one tapered segment: the field bends far more slowly than that. */
const STRIDE = 3;
/** Perlin noise spreads less than the original's simplex noise; widen it so the angles span about as far. */
const SPREAD = 1.4;

export interface TrailsSpec {
  /** The picture in sub-pixels. */
  readonly width: number;
  readonly height: number;
  /** The original's `n`, for its A4 sheet: the picture gets as many as its area holds. */
  readonly count: number;
  readonly seed: number;
  /** The noise field's third coordinate: the original's seed, here drifting with time. */
  readonly z: number;
  readonly ground: Rgb;
  readonly inks: readonly Rgb[];
}

/** How many trails a `width` by `height` picture holds at the original's density of `count` per sheet. */
export function trailCount(count: number, width: number, height: number): number {
  if (width <= 0 || height <= 0) return 0;
  return Math.max(1, Math.round((count * REF_WIDTH * REF_WIDTH * (height / width)) / SHEET_AREA));
}

interface Layer {
  readonly rgb: Float32Array;
  readonly owner: Int32Array;
  readonly width: number;
  readonly height: number;
}

/** Lay `ink` over every sub-pixel whose centre passes `inside`, within the box, once per trail. */
function cover(layer: Layer, trail: number, ink: Rgb, box: readonly [number, number, number, number], inside: (x: number, y: number) => boolean): void {
  const x0 = Math.max(0, Math.floor(box[0]));
  const y0 = Math.max(0, Math.floor(box[1]));
  const x1 = Math.min(layer.width - 1, Math.ceil(box[2]));
  const y1 = Math.min(layer.height - 1, Math.ceil(box[3]));
  for (let y = y0; y <= y1; y += 1) {
    for (let x = x0; x <= x1; x += 1) {
      const i = y * layer.width + x;
      if (layer.owner[i] === trail || !inside(x + 0.5, y + 0.5)) continue;
      layer.owner[i] = trail;
      for (let c = 0; c < 3; c += 1) layer.rgb[i * 3 + c] = (layer.rgb[i * 3 + c] ?? 0) * (1 - OPACITY) + (ink[c] ?? 0) * OPACITY;
    }
  }
}

/** A segment from (x0, y0) to (x1, y1) whose half width runs from r0 to r1. */
function taper(layer: Layer, trail: number, ink: Rgb, x0: number, y0: number, r0: number, x1: number, y1: number, r1: number): void {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len2 = dx * dx + dy * dy;
  const r = Math.max(r0, r1);
  cover(layer, trail, ink, [Math.min(x0, x1) - r, Math.min(y0, y1) - r, Math.max(x0, x1) + r, Math.max(y0, y1) + r], (x, y) => {
    const u = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / len2));
    const half = r0 + (r1 - r0) * u;
    return (x - x0 - u * dx) ** 2 + (y - y0 - u * dy) ** 2 <= half * half;
  });
}

/** One trail's path: x, y and half width for every STRIDE-th step, ending on the head. */
function walk(noise: Noise3, x: number, y: number, k: number, z: number): number[] {
  const points: number[] = [];
  let px = x;
  let py = y;
  for (let i = 0; i < TRAIL_STEPS; i += 1) {
    const angle = noise(px / (NOISE_SCALE * k), py / (NOISE_SCALE * k), z) * Math.PI * SPREAD;
    px += Math.cos(angle) * STEP * k;
    py += Math.sin(angle) * STEP * k;
    if (i % STRIDE === 0 || i === TRAIL_STEPS - 1) points.push(px, py, (i / TRAIL_STEPS) * STROKE * k);
  }
  return points;
}

/** The picture as sub-pixel colours, three floats each, trail over trail in the original's order. */
export function rasterizeTrails(spec: TrailsSpec, noise: Noise3): Float32Array {
  const { width, height, ground, inks } = spec;
  const layer: Layer = { rgb: new Float32Array(width * height * 3), owner: new Int32Array(width * height).fill(-1), width, height };
  for (let i = 0; i < width * height; i += 1) layer.rgb.set(ground, i * 3);
  const k = width / REF_WIDTH;
  const head = (STROKE - 0.5) * k;
  let seed = spec.seed;
  for (let t = 0; t < trailCount(spec.count, width, height); t += 1) {
    const [a, s1] = nextRandom(seed);
    const [b, s2] = nextRandom(s1);
    const [c, s3] = nextRandom(s2);
    seed = s3;
    const ink = inks[Math.floor(c * inks.length)] ?? ground;
    const pts = walk(noise, (-0.25 + a * 1.5) * width, (-0.25 + b * 1.5) * height, k, spec.z);
    const xs = pts.filter((_, i) => i % 3 === 0);
    const ys = pts.filter((_, i) => i % 3 === 1);
    const pad = STROKE * k;
    if (Math.max(...xs) < -pad || Math.min(...xs) > width + pad || Math.max(...ys) < -pad || Math.min(...ys) > height + pad) continue;
    for (let i = 3; i < pts.length; i += 3) {
      taper(layer, t, ink, pts[i - 3] ?? 0, pts[i - 2] ?? 0, pts[i - 1] ?? 0, pts[i] ?? 0, pts[i + 1] ?? 0, pts[i + 2] ?? 0);
    }
    const hx = pts[pts.length - 3] ?? 0;
    const hy = pts[pts.length - 2] ?? 0;
    cover(layer, t, ink, [hx - head, hy - head, hx + head, hy + head], (x, y) => (x - hx) ** 2 + (y - hy) ** 2 <= head * head);
  }
  return layer.rgb;
}
