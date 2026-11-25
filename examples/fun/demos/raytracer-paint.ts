// Licensed under the Apache License, Version 2.0, like the rest of this repository.
import type { Surface } from '@flyingrobots/bijou';
import { APERTURE, lightsAt, type Camera } from './raytracer-camera.js';
import type { Light } from './raytracer-material.js';
import { sampler } from './raytracer-sampler.js';
import { intersectScene, newHit, type HitRecord } from './raytracer-scene.js';
import { shade } from './raytracer-shade.js';

const SUBPIXELS: readonly (readonly [number, number, number])[] = [[0, 0, 1], [0, 1, 2], [0, 2, 4], [1, 0, 8], [1, 1, 16], [1, 2, 32], [0, 3, 64], [1, 3, 128]];

interface Cell {
  bits: number;
  active: number;
  inactive: number;
  fg: [number, number, number];
  bg: [number, number, number];
}

interface Scene {
  readonly cam: Camera;
  readonly lights: readonly Light[];
  readonly time: number;
  readonly frame: number;
  readonly seed: number;
  readonly gridW: number;
  readonly gridH: number;
}

/** One sub-pixel: a ray from a jittered point on the lens (depth of field) through the focal plane, shaded or the starfield behind. */
function trace(s: Scene, cell: Cell, px: number, py: number, bit: number, lens: () => number, hit: HitRecord, scratch: HitRecord): void {
  const { cam } = s;
  const u = (px / s.gridW - 0.5) * 2.0 * (s.gridW / s.gridH);
  const v = -(py / s.gridH - 0.5) * 2.0;
  const sx = cam.forward[0] + u * cam.right[0] + v * cam.up[0];
  const sy = cam.forward[1] + u * cam.right[1] + v * cam.up[1];
  const sz = cam.forward[2] + u * cam.right[2] + v * cam.up[2];
  const slen = Math.sqrt(sx * sx + sy * sy + sz * sz);
  const fx = cam.ox + (sx / slen) * cam.distance;
  const fy = cam.oy + (sy / slen) * cam.distance;
  const fz = cam.oz + (sz / slen) * cam.distance;
  const theta = lens() * 2 * Math.PI;
  const rad = Math.sqrt(lens()) * APERTURE;
  const lensX = Math.cos(theta) * rad;
  const lensY = Math.sin(theta) * rad;
  const ox = cam.ox + lensX * cam.right[0] + lensY * cam.up[0];
  const oy = cam.oy + lensX * cam.right[1] + lensY * cam.up[1];
  const oz = cam.oz + lensX * cam.right[2] + lensY * cam.up[2];
  const rlen = Math.sqrt((fx - ox) ** 2 + (fy - oy) ** 2 + (fz - oz) ** 2);
  const dx = (fx - ox) / rlen;
  const dy = (fy - oy) / rlen;
  const dz = (fz - oz) / rlen;
  if (!intersectScene(ox, oy, oz, dx, dy, dz, s.time, hit)) {
    const wave = Math.sin(px * 0.1 + s.time * 0.4) * Math.cos(py * 0.15 - s.time * 0.3);
    const [r, g, b] = wave > 0.8 ? [30, 30, 45] : [4, 4, 8];
    cell.bg[0] += r;
    cell.bg[1] += g;
    cell.bg[2] += b;
    cell.inactive++;
    return;
  }
  const soft = sampler(s.seed, px * 131 + py * 71 + s.frame * 23);
  const c = shade(hit, [-dx, -dy, -dz], s.time, s.lights, soft, scratch);
  const target = hit.shapeId <= 3 ? cell.fg : cell.bg;
  target[0] += c.r;
  target[1] += c.g;
  target[2] += c.b;
  if (hit.shapeId <= 3) {
    cell.bits |= bit;
    cell.active++;
  } else cell.inactive++;
}

function put(surface: Surface, x: number, y: number, c: Cell): void {
  const avg = (sum: number, n: number, k: number): number => Math.round((sum / n) * k);
  if (c.active > 0) {
    const bgK = c.inactive > 0 ? 0.32 : 0;
    const bg = c.inactive > 0 ? [0, 1, 2].map((i) => avg(c.bg[i] ?? 0, c.inactive, bgK)) : [2, 2, 4];
    surface.setRGB(x, y, String.fromCharCode(0x2800 + c.bits), avg(c.fg[0], c.active, 1), avg(c.fg[1], c.active, 1), avg(c.fg[2], c.active, 1), bg[0] ?? 0, bg[1] ?? 0, bg[2] ?? 0);
    return;
  }
  const [r, g, b] = c.inactive > 0 ? [0, 1, 2].map((i) => avg(c.bg[i] ?? 0, c.inactive, 1)) : [2, 2, 4];
  const floorOnly = c.inactive === SUBPIXELS.length && c.bg[0] > 0;
  if (floorOnly && y % 2 === 0) {
    surface.setRGB(x, y, '.', Math.max(0, (r ?? 0) - 20), Math.max(0, (g ?? 0) - 20), Math.max(0, (b ?? 0) - 20), Math.round((r ?? 0) * 0.35), Math.round((g ?? 0) * 0.35), Math.round((b ?? 0) * 0.35));
  } else {
    surface.setRGB(x, y, ' ', 0, 0, 0, Math.round((r ?? 0) * 0.4), Math.round((g ?? 0) * 0.4), Math.round((b ?? 0) * 0.4));
  }
}

/** Trace every cell as a 2 by 4 braille block of sub-pixels: spheres draw the dots, the floor and the sky the background. */
export function paintScene(surface: Surface, cam: Camera, time: number, frame: number, seed: number): void {
  const { width, height } = surface;
  const scene: Scene = { cam, lights: lightsAt(time), time, frame, seed, gridW: width * 2, gridH: height * 4 };
  const hit = newHit();
  const scratch = newHit();
  for (let cy = 0; cy < height; cy++) {
    for (let cx = 0; cx < width; cx++) {
      const cell: Cell = { bits: 0, active: 0, inactive: 0, fg: [0, 0, 0], bg: [0, 0, 0] };
      const lens = sampler(seed, cx * 153 + cy * 79 + frame * 31);
      for (const [dx, dy, bit] of SUBPIXELS) trace(scene, cell, cx * 2 + dx, cy * 4 + dy, bit, lens, hit, scratch);
      put(surface, cx, cy, cell);
    }
  }
}
