// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// The wandering sites and the fading canvas of the Voronoi Incircles demo.
import { nextRandom } from '../random.js';
import { cellPolygons, polygonIncircle } from './incircles-geometry.js';

/** The original canvas's height and the margin sites may wander past its edges, in canvas units. */
export const CANVAS_HEIGHT = 600;
const MARGIN = 60;

/** Sites as x, y pairs and their velocities, in canvas units; the canvas is `width` wide and 600 high. */
export interface Field {
  readonly width: number;
  readonly positions: readonly number[];
  readonly velocities: readonly number[];
}

/** The canvas as grey levels 0–255, at picture sub-pixels. */
export interface Glow {
  readonly width: number;
  readonly height: number;
  readonly light: Float32Array;
}

/**
 * The level the original's faint black fill (`#00000002`) settles at: 8-bit rounding stalls it near a quarter of the
 * white page below, so trails fade from white to this dark grey and no further.
 */
export const FLOOR = 64;
/** What one faint fill keeps of the distance above the floor. */
const KEEP = 253 / 255;

export function emptyGlow(width: number, height: number): Glow {
  const w = Math.max(1, Math.floor(width));
  const h = Math.max(1, Math.floor(height));
  return { width: w, height: h, light: new Float32Array(w * h).fill(FLOOR) };
}

/** The canvas width in canvas units for a glow of this shape. */
export const canvasWidth = (glow: Glow): number => (CANVAS_HEIGHT * glow.width) / glow.height;

/** The first `count` sites of `field`, topped up with new ones at rest, scattered over the canvas as the original's. */
export function scatter(field: Field, count: number, seed: number): readonly [Field, number] {
  const positions = field.positions.slice(0, count * 2);
  const velocities = field.velocities.slice(0, count * 2);
  let s = seed;
  for (let i = positions.length; i < count * 2; i += 1) {
    const [u, next] = nextRandom(s);
    s = next;
    positions.push(u * (i % 2 === 1 ? CANVAS_HEIGHT : field.width));
    velocities.push(0);
  }
  return [{ ...field, positions, velocities }, s];
}

/** Stretch the field across a canvas of a new width. */
export function restretch(field: Field, width: number): Field {
  const k = field.width === 0 ? 1 : width / field.width;
  return { width, positions: field.positions.map((v, i) => (i % 2 === 0 ? v * k : v)), velocities: field.velocities };
}

const wrap = (v: number, size: number): number =>
  v < -MARGIN ? v + size + MARGIN * 2 : v > size + MARGIN ? v - size - MARGIN * 2 : v;

/** One frame of the original's walk: move, wrap past the margin, then nudge each velocity at random and damp it. */
export function move(field: Field, seed: number): readonly [Field, number] {
  const positions = [...field.positions];
  const velocities = [...field.velocities];
  let s = seed;
  for (let i = 0; i < positions.length; i += 1) {
    const size = i % 2 === 0 ? field.width : CANVAS_HEIGHT;
    const v = velocities[i] ?? 0;
    positions[i] = wrap((positions[i] ?? 0) + v, size);
    const [u, next] = nextRandom(s);
    s = next;
    velocities[i] = v + 0.2 * (u - 0.5) - 0.01 * v;
  }
  return [{ ...field, positions, velocities }, s];
}

/** One frame of the canvas: the faint fill (or a clear, without trails), then each cell's incircle in white, 1.5 smaller. */
export function paint(glow: Glow, field: Field, trails: boolean): Glow {
  const light = trails ? glow.light.map((v) => FLOOR + (v - FLOOR) * KEEP) : new Float32Array(glow.light.length).fill(FLOOR);
  const scale = glow.height / CANVAS_HEIGHT;
  const cells = cellPolygons(field.positions, 0.5, 0.5, field.width - 0.5, CANVAS_HEIGHT - 0.5);
  for (const cell of cells) {
    const [x, y, r] = polygonIncircle(cell);
    if (!(r >= 1.5)) continue;
    const cx = x * scale;
    const cy = y * scale;
    const rr = (r - 1.5) * scale;
    const x0 = Math.max(0, Math.floor(cx - rr));
    const x1 = Math.min(glow.width - 1, Math.ceil(cx + rr));
    const y0 = Math.max(0, Math.floor(cy - rr));
    const y1 = Math.min(glow.height - 1, Math.ceil(cy + rr));
    for (let py = y0; py <= y1; py += 1) {
      for (let px = x0; px <= x1; px += 1) {
        if ((px + 0.5 - cx) ** 2 + (py + 0.5 - cy) ** 2 <= rr * rr) light[py * glow.width + px] = 255;
      }
    }
  }
  return { ...glow, light };
}
