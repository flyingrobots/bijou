// Licensed under the Apache License, Version 2.0, like the rest of this repository.
import { FLOOR_Y, chromeCentre, type HitRecord } from './raytracer-scene.js';

export interface Light {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

/** Diffuse and specular colour, shininess and reflectivity. */
export interface Material {
  kd: [number, number, number];
  readonly ks: readonly [number, number, number];
  readonly shininess: number;
  readonly reflectivity: number;
}

/** The floor's bright focal spot and ring where each light's ray through the glass sphere lands, added into its diffuse colour. */
function addCaustics(kd: [number, number, number], hit: HitRecord, lights: readonly Light[], time: number): void {
  const [cx, cy, cz] = chromeCentre(time);
  for (const light of lights) {
    const cdx = cx - light.x;
    const cdy = cy - light.y;
    const cdz = cz - light.z;
    const clen = Math.sqrt(cdx * cdx + cdy * cdy + cdz * cdz);
    if (clen <= 0.01) continue;
    const cndy = cdy / clen;
    if (cndy >= -0.001) continue;
    const tCaust = (FLOOR_Y - cy) / cndy;
    if (tCaust <= 0) continue;
    const dx = hit.px - (cx + tCaust * (cdx / clen));
    const dz = hit.pz - (cz + tCaust * (cdz / clen));
    const distSq = dx * dx + dz * dz;
    const spot = Math.exp(-distSq / 0.12) * 1.8;
    const ring = Math.exp(-Math.pow(Math.sqrt(distSq) - 0.24, 2) / 0.02) * 0.9;
    const intensity = (spot + ring) * 1.4;
    kd[0] = Math.min(1.0, kd[0] + (light.r / 255) * intensity * 0.45);
    kd[1] = Math.min(1.0, kd[1] + (light.g / 255) * intensity * 0.45);
    kd[2] = Math.min(1.0, kd[2] + (light.b / 255) * intensity * 0.45);
  }
}

export function materialAt(hit: HitRecord, lights: readonly Light[], time: number): Material {
  if (hit.shapeId === 1) return { kd: [0.75, 0.55, 0.12], ks: [0.90, 0.80, 0.45], shininess: 64, reflectivity: 0.55 };
  if (hit.shapeId === 2) return { kd: [0.05, 0.05, 0.05], ks: [0.95, 0.95, 0.95], shininess: 128, reflectivity: 0.85 };
  if (hit.shapeId === 3) return { kd: [0.85, 0.08, 0.08], ks: [0.60, 0.60, 0.60], shininess: 32, reflectivity: 0.15 };
  if (hit.shapeId !== 4) return { kd: [0.5, 0.5, 0.5], ks: [0.5, 0.5, 0.5], shininess: 32, reflectivity: 0.0 };
  const even = (Math.floor(hit.px * 1.5 + 100) + Math.floor(hit.pz * 1.5 + 100)) % 2 === 0;
  const kd: [number, number, number] = even ? [0.16, 0.35, 0.44] : [0.28, 0.28, 0.30];
  addCaustics(kd, hit, lights, time);
  return { kd, ks: [0.20, 0.20, 0.20], shininess: 16, reflectivity: 0.22 };
}
