// Licensed under the Apache License, Version 2.0, like the rest of this repository.

export interface Vec3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export const add = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
export const sub = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
export const scale = (v: Vec3, s: number): Vec3 => ({ x: v.x * s, y: v.y * s, z: v.z * s });
export const dot = (a: Vec3, b: Vec3): number => a.x * b.x + a.y * b.y + a.z * b.z;
export const cross = (a: Vec3, b: Vec3): Vec3 => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });
export const length = (v: Vec3): number => Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
export const normalize = (v: Vec3): Vec3 => {
  const len = length(v);
  return len > 0.00001 ? scale(v, 1.0 / len) : { x: 0, y: 0, z: 0 };
};

function sdSphere(p: Vec3, r: number): number {
  return length(p) - r;
}

function sdTorus(p: Vec3, r1: number, r2: number): number {
  const qx = Math.sqrt(p.x * p.x + p.z * p.z) - r1;
  const qy = p.y;
  return Math.sqrt(qx * qx + qy * qy) - r2;
}

export interface Hit {
  readonly dist: number;
  readonly objId: number;
}

/** The scene: a rotating torus (1), a bouncing sphere (2) and a ground plane (3). */
export function sceneSDF(p: Vec3, time: number): Hit {
  const cosT = Math.cos(time * 0.8);
  const sinT = Math.sin(time * 0.8);
  const ry = { x: p.x * cosT - p.z * sinT, y: p.y, z: p.x * sinT + p.z * cosT };
  const rx = { x: ry.x, y: ry.y * cosT - ry.z * sinT, z: ry.y * sinT + ry.z * cosT };
  const torusDist = sdTorus(rx, 2.3, 0.7);
  const bounce = Math.sin(time * 2.0) * 0.7;
  const sphereDist = sdSphere(sub(p, { x: 0, y: bounce, z: 0 }), 1.0);
  const planeDist = p.y - (-3.0);
  let dist = torusDist;
  let objId = 1;
  if (sphereDist < dist) {
    dist = sphereDist;
    objId = 2;
  }
  if (planeDist < dist) {
    dist = planeDist;
    objId = 3;
  }
  return { dist, objId };
}

/** The surface normal by forward differences: four evaluations, not six. */
export function getNormal(p: Vec3, time: number): Vec3 {
  const eps = 0.001;
  const d = sceneSDF(p, time).dist;
  return normalize({
    x: sceneSDF({ x: p.x + eps, y: p.y, z: p.z }, time).dist - d,
    y: sceneSDF({ x: p.x, y: p.y + eps, z: p.z }, time).dist - d,
    z: sceneSDF({ x: p.x, y: p.y, z: p.z + eps }, time).dist - d,
  });
}

export function raymarch(ro: Vec3, rd: Vec3, time: number): Hit {
  let t = 0.0;
  const tMax = 25.0;
  for (let i = 0; i < 70; i++) {
    const { dist, objId } = sceneSDF(add(ro, scale(rd, t)), time);
    // The hit epsilon widens with distance: a cell covers more of the scene the further it is, so a fixed one lets grazing rays creep.
    if (dist < Math.max(0.001, 0.0005 * t)) return { dist: t, objId };
    t += dist;
    if (t > tMax) break;
  }
  return { dist: -1, objId: 0 };
}

export function getShadow(ro: Vec3, rd: Vec3, time: number): number {
  let t = 0.05;
  const tMax = 10.0;
  let shadow = 1.0;
  for (let i = 0; i < 24; i++) {
    const d = sceneSDF(add(ro, scale(rd, t)), time).dist;
    if (d < 0.001) return 0.2;
    shadow = Math.min(shadow, 6.0 * d / t);
    t += d;
    if (t > tMax) break;
  }
  return Math.max(0.2, shadow);
}
