// Licensed under the Apache License, Version 2.0, like the rest of this repository.
import { materialAt, type Light, type Material } from './raytracer-material.js';
import { intersectScene, type HitRecord } from './raytracer-scene.js';

export interface Colour {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

type Rgb = [number, number, number];

/** Direct light from every light at the hit: a shadow ray to a jittered light position (a soft shadow), diffuse, specular, attenuation. */
function direct(hit: HitRecord, view: readonly [number, number, number], m: Material, lights: readonly Light[], time: number, random: () => number, scratch: HitRecord): Rgb {
  const out: Rgb = [24, 28, 40];
  for (const light of lights) {
    const ldx = light.x + (random() - 0.5) * 0.28 - hit.px;
    const ldy = light.y + (random() - 0.5) * 0.28 - hit.py;
    const ldz = light.z + (random() - 0.5) * 0.28 - hit.pz;
    const d = Math.sqrt(ldx * ldx + ldy * ldy + ldz * ldz);
    if (d < 0.001) continue;
    const lx = ldx / d;
    const ly = ldy / d;
    const lz = ldz / d;
    const shadowed = intersectScene(hit.px + hit.nx * 0.001, hit.py + hit.ny * 0.001, hit.pz + hit.nz * 0.001, lx, ly, lz, time, scratch) && scratch.t < d;
    if (shadowed) continue;
    const dotNL = Math.max(0, hit.nx * lx + hit.ny * ly + hit.nz * lz);
    const hx = lx + view[0];
    const hy = ly + view[1];
    const hz = lz + view[2];
    const hlen = Math.sqrt(hx * hx + hy * hy + hz * hz);
    const dotNH = hlen > 0.01 ? Math.max(0, hit.nx * (hx / hlen) + hit.ny * (hy / hlen) + hit.nz * (hz / hlen)) : 0;
    const spec = Math.pow(dotNH, m.shininess);
    const att = 1.0 / (1.0 + 0.06 * d + 0.015 * d * d);
    out[0] += (m.kd[0] * light.r * dotNL + m.ks[0] * light.r * spec) * att;
    out[1] += (m.kd[1] * light.g * dotNL + m.ks[1] * light.g * spec) * att;
    out[2] += (m.kd[2] * light.b * dotNL + m.ks[2] * light.b * spec) * att;
  }
  return out;
}

/** Blend in one bounce: the colour where the reflected ray lands, lit simply, or the dark background if it misses. */
function reflect(hit: HitRecord, view: readonly [number, number, number], rgb: Rgb, reflectivity: number, lights: readonly Light[], time: number, scratch: HitRecord): void {
  const dotNV = hit.nx * view[0] + hit.ny * view[1] + hit.nz * view[2];
  const rx = -view[0] + 2 * dotNV * hit.nx;
  const ry = -view[1] + 2 * dotNV * hit.ny;
  const rz = -view[2] + 2 * dotNV * hit.nz;
  let seen: Rgb = [6, 8, 14];
  if (intersectScene(hit.px + hit.nx * 0.001, hit.py + hit.ny * 0.001, hit.pz + hit.nz * 0.001, rx, ry, rz, time, scratch)) {
    seen = [10, 12, 20];
    for (const light of lights) {
      const ldx = light.x - scratch.px;
      const ldy = light.y - scratch.py;
      const ldz = light.z - scratch.pz;
      const d = Math.sqrt(ldx * ldx + ldy * ldy + ldz * ldz);
      if (d <= 0.01) continue;
      const dotNL = Math.max(0, scratch.nx * (ldx / d) + scratch.ny * (ldy / d) + scratch.nz * (ldz / d));
      const att = 1.0 / (1.0 + 0.15 * d + 0.06 * d * d);
      seen[0] += 0.45 * light.r * dotNL * att;
      seen[1] += 0.45 * light.g * dotNL * att;
      seen[2] += 0.45 * light.b * dotNL * att;
    }
  }
  for (let i = 0; i < 3; i++) rgb[i] = (1.0 - reflectivity) * (rgb[i] ?? 0) + reflectivity * (seen[i] ?? 0);
}

/**
 * The colour of a hit: material, direct light with soft shadows, a neon rim on the spheres, one reflection bounce.
 * `view` points back at the camera. `random` is the pixel's seeded stream.
 */
export function shade(hit: HitRecord, view: readonly [number, number, number], time: number, lights: readonly Light[], random: () => number, scratch: HitRecord): Colour {
  const m = materialAt(hit, lights, time);
  const rgb = direct(hit, view, m, lights, time, random, scratch);
  if (hit.shapeId <= 3) {
    const dotNV = Math.max(0, hit.nx * view[0] + hit.ny * view[1] + hit.nz * view[2]);
    const rim = Math.pow(1.0 - dotNV, 5.0) * 0.42;
    rgb[0] += rim * 160;
    rgb[1] += rim * 80;
    rgb[2] += rim * 240;
  }
  if (m.reflectivity > 0.0) reflect(hit, view, rgb, m.reflectivity, lights, time, scratch);
  const clamp = (v: number): number => Math.max(0, Math.min(255, v));
  return { r: clamp(rgb[0]), g: clamp(rgb[1]), b: clamp(rgb[2]) };
}
