// Licensed under the Apache License, Version 2.0, like the rest of this repository.

/** Where the last ray hit: 1 gold sphere, 2 chrome sphere, 3 red sphere, 4 floor; the point and its normal. */
export interface HitRecord {
  shapeId: number;
  t: number;
  px: number;
  py: number;
  pz: number;
  nx: number;
  ny: number;
  nz: number;
}

export const FLOOR_Y = -0.5;

export function newHit(): HitRecord {
  return { shapeId: 0, t: 0, px: 0, py: 0, pz: 0, nx: 0, ny: 0, nz: 0 };
}

/** The chrome sphere's centre: it orbits against the gold one. */
export function chromeCentre(time: number): readonly [number, number, number] {
  return [-Math.sin(time * 1.0) * 1.5, 0.05 + Math.sin(time * 0.8) * 0.2, -Math.cos(time * 1.0) * 1.5];
}

/** Test one sphere; on a hit nearer than `nearest` write it into `hit` and return its distance, else return `nearest`. */
function sphere(
  ox: number, oy: number, oz: number, dx: number, dy: number, dz: number,
  cx: number, cy: number, cz: number, r: number, nearest: number, hit: HitRecord,
): number {
  const vx = ox - cx;
  const vy = oy - cy;
  const vz = oz - cz;
  const b = vx * dx + vy * dy + vz * dz;
  const disc = b * b - ((vx * vx + vy * vy + vz * vz) - (r * r));
  if (disc < 0) return nearest;
  const discSq = Math.sqrt(disc);
  let t = -b - discSq;
  if (t < 0.0001) t = -b + discSq;
  if (!(t > 0.0001 && t < nearest)) return nearest;
  hit.px = ox + t * dx;
  hit.py = oy + t * dy;
  hit.pz = oz + t * dz;
  const invR = 1.0 / r;
  hit.nx = (hit.px - cx) * invR;
  hit.ny = (hit.py - cy) * invR;
  hit.nz = (hit.pz - cz) * invR;
  return t;
}

/** Trace one ray against the three spheres and the floor; fills `hit` and returns whether anything was hit. */
export function intersectScene(
  ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, time: number, hit: HitRecord,
): boolean {
  let nearest = Infinity;
  let id = 0;
  // The gold sphere orbits in an ellipse and bounces; the chrome one orbits against it; the red one bounces fast in the middle.
  const goldY = 0.2 + Math.abs(Math.cos(time * 1.6)) * 0.8;
  let t = sphere(ox, oy, oz, dx, dy, dz, Math.sin(time * 1.0) * 1.5, goldY, Math.cos(time * 1.0) * 1.5, 0.55, nearest, hit);
  if (t < nearest) {
    nearest = t;
    id = 1;
  }
  const [chromeX, chromeY, chromeZ] = chromeCentre(time);
  t = sphere(ox, oy, oz, dx, dy, dz, chromeX, chromeY, chromeZ, 0.48, nearest, hit);
  if (t < nearest) {
    nearest = t;
    id = 2;
  }
  t = sphere(ox, oy, oz, dx, dy, dz, 0.0, -0.1 + Math.abs(Math.sin(time * 2.8)) * 0.9, 0.0, 0.4, nearest, hit);
  if (t < nearest) {
    nearest = t;
    id = 3;
  }
  if (Math.abs(dy) > 0.0001) {
    t = (FLOOR_Y - oy) / dy;
    if (t > 0.0001 && t < nearest) {
      nearest = t;
      id = 4;
      hit.px = ox + t * dx;
      hit.py = FLOOR_Y;
      hit.pz = oz + t * dz;
      hit.nx = 0;
      hit.ny = 1;
      hit.nz = 0;
    }
  }
  if (id === 0) return false;
  hit.shapeId = id;
  hit.t = nearest;
  return true;
}
