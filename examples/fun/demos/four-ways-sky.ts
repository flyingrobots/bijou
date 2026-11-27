// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// The `interactive` lowering: the solar system in true-colour half blocks, with a glowing
// sun, faint planet orbits, the comet's ellipse, and a tail streaming away from the sun.
import type { Surface } from '@flyingrobots/bijou';
import { elements, planetAt, PLANETS, type Comet } from './four-ways-sim.js';

type Rgb = readonly [number, number, number];

/** The outermost distance shown, in AU. */
const EXTENT = 6;
/** Radial distances are drawn as (r / EXTENT) ** SQUASH, so the inner planets get room beside Jupiter. */
const SQUASH = 0.7;
const TAIL_GRAINS = 40;

class Canvas {
  readonly light: Float32Array;
  constructor(readonly width: number, readonly height: number) {
    this.light = new Float32Array(width * height * 3);
  }
  add(x: number, y: number, [r, g, b]: Rgb, k: number): void {
    const px = Math.floor(x);
    const py = Math.floor(y);
    if (px < 0 || py < 0 || px >= this.width || py >= this.height) return;
    const i = (py * this.width + px) * 3;
    this.light[i] = (this.light[i] ?? 0) + r * k;
    this.light[i + 1] = (this.light[i + 1] ?? 0) + g * k;
    this.light[i + 2] = (this.light[i + 2] ?? 0) + b * k;
  }
  /** A soft disc of `radius` pixels, its edge anti-aliased by coverage. */
  disc(x: number, y: number, radius: number, colour: Rgb, k: number): void {
    const reach = Math.ceil(radius + 1);
    for (let dy = -reach; dy <= reach; dy += 1) {
      for (let dx = -reach; dx <= reach; dx += 1) {
        const cx = Math.floor(x) + dx + 0.5;
        const cy = Math.floor(y) + dy + 0.5;
        const cover = Math.max(0, Math.min(1, radius + 0.5 - Math.hypot(cx - x, cy - y)));
        if (cover > 0) this.add(cx, cy, colour, k * cover);
      }
    }
  }
}

const hash = (x: number, y: number): number => {
  const h = Math.sin(x * 127.1 + y * 311.7) * 43_758.545_3;
  return h - Math.floor(h);
};

/** Paint the sky into `surface`, which is the interactive pane's picture area. */
export function paintSky(surface: Surface, comet: Comet, t: number, elapsed: number): void {
  const canvas = new Canvas(surface.width, surface.height * 2);
  const { width: w, height: h } = canvas;
  const cx = w / 2;
  const cy = h / 2;
  const radius = Math.max(4, Math.min(w, h) / 2 - 1.5);
  const scale = (r: number): number => radius * (Math.max(0, r) / EXTENT) ** SQUASH;
  const toPixel = (x: number, y: number): readonly [number, number] => {
    const r = Math.hypot(x, y);
    const k = r > 1e-9 ? scale(r) / r : 0;
    return [cx + x * k, cy - y * k];
  };
  const rings = PLANETS.map((planet) => scale(planet.radius));
  for (let py = 0; py < h; py += 1) {
    for (let px = 0; px < w; px += 1) {
      const d = Math.hypot(px + 0.5 - cx, py + 0.5 - cy);
      canvas.add(px, py, [4, 6, 16], 1);
      const star = hash(px, py);
      if (star < 0.012) canvas.add(px, py, [200, 210, 255], 0.25 + 0.2 * Math.sin(elapsed * 2 + star * 900));
      canvas.add(px, py, [255, 180, 70], 1.6 * Math.exp(-((d / 1.6) ** 2)) + 0.22 * Math.exp(-d / (radius * 0.15)));
      for (const ring of rings) {
        const off = Math.abs(d - ring);
        if (off < 0.8) canvas.add(px, py, [60, 70, 110], 0.45 * (1 - off / 0.8));
      }
    }
  }
  canvas.disc(cx, cy, 1.2, [255, 250, 220], 1);
  const { a, e, omega } = elements(comet);
  const p = a * (1 - e * e);
  for (let i = 0; i < 360; i += 1) {
    const nu = (i / 360) * 2 * Math.PI;
    const r = p / (1 + e * Math.cos(nu));
    const [x, y] = toPixel(r * Math.cos(nu + omega), r * Math.sin(nu + omega));
    canvas.add(x, y, [50, 120, 120], 0.35);
  }
  for (const planet of PLANETS) {
    const [x, y] = toPixel(...planetAt(planet, t));
    canvas.disc(x, y, planet.size * Math.max(0.6, radius / 22), planet.rgb, 1);
  }
  const [hx, hy] = toPixel(comet.x, comet.y);
  const away = Math.hypot(hx - cx, hy - cy) || 1;
  const [ux, uy] = [(hx - cx) / away, (hy - cy) / away];
  const length = radius * 0.45 * Math.max(0.2, Math.min(1.4, 1.1 / Math.hypot(comet.x, comet.y)));
  for (let i = 0; i < TAIL_GRAINS; i += 1) {
    const f = i / TAIL_GRAINS;
    const along = length * (f + 0.03 * Math.sin(elapsed * 9 + i * 1.7));
    const side = (hash(i, 7) - 0.5) * along * 0.4 + 0.4 * Math.sin(elapsed * 5 + i);
    const colour: Rgb = [200 - 150 * f, 240 - 120 * f, 255 - 30 * f];
    canvas.disc(hx + ux * along - uy * side, hy + uy * along + ux * side, 0.6, colour, (1 - f) ** 1.6 * 0.9);
  }
  canvas.disc(hx, hy, 2.4, [120, 200, 255], 0.25);
  canvas.disc(hx, hy, 0.9, [255, 255, 255], 1);
  const level = (i: number): number => Math.min(255, Math.round(canvas.light[i] ?? 0));
  for (let y = 0; y < surface.height; y += 1) {
    for (let x = 0; x < surface.width; x += 1) {
      const top = (y * 2 * w + x) * 3;
      const bottom = ((y * 2 + 1) * w + x) * 3;
      surface.setRGB(x, y, '▀', level(top), level(top + 1), level(top + 2), level(bottom), level(bottom + 1), level(bottom + 2));
    }
  }
}
