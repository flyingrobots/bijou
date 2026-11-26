// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// After "3D Graphs with Three.js" by laotzunami (Observable): the surface
// y = f(x, z, t) over [-1, 1]², three wave modes cross-fading over time, seen
// by a 45° perspective camera from (-1.75, 1.25, 1.75) looking at the origin.

export type Vec3 = readonly [number, number, number];

/** The original's surface: an inward ripple, an outward spiral and a chaotic inverse wave, cross-faded slowly. */
export function waveHeight(x: number, y: number, t: number): number {
  const r2 = x * x + y * y;
  const r = Math.sqrt(r2);
  const phase1 = (0.5 + 0.5 * Math.sin(t / 15 + 0.5 * r)) ** 2;
  const ripple = Math.cos(2 * t + 25 * Math.sqrt(0.2 + r2));
  const phase2 = (0.5 + 0.5 * Math.sin(t / 15 + 0.75 * Math.PI - 0.5 * r)) ** 2;
  const smooth = r2 / (r2 + 0.03);
  const spiral = Math.cos(-2 * t + 18 * Math.sqrt(0.2 + r2) - 2 * Math.atan((x + 0.001) / y)) * smooth + 1 - smooth;
  const phase3 = Math.max(0, 1 - phase1 - phase2);
  const inverse = Math.sin((20 * (x * y)) / Math.sqrt(1 + r2) - t);
  return 0.13 * phase1 * ripple + 0.15 * phase2 * spiral + 0.2 * phase3 * inverse + 0.35;
}

/** A camera orbiting the origin: `azimuth` and `elevation` in radians, `distance` from the origin. */
export interface Orbit {
  readonly azimuth: number;
  readonly elevation: number;
  readonly distance: number;
}

/** The original camera position (-1.75, 1.25, 1.75) as an orbit. */
export const START_ORBIT: Orbit = {
  azimuth: Math.atan2(1.75, -1.75),
  elevation: Math.atan2(1.25, Math.hypot(1.75, 1.75)),
  distance: Math.hypot(1.75, 1.25, 1.75),
};

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const normalize = (v: Vec3): Vec3 => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};

/** A projection from world space to picture pixels, with each point's view depth. */
export interface Projector {
  readonly eye: Vec3;
  project(p: Vec3): readonly [number, number, number] | null;
}

/** A 45° vertical field of view looking at the origin, for a picture `w` by `h` pixels. */
export function projector(orbit: Orbit, w: number, h: number): Projector {
  const ce = Math.cos(orbit.elevation);
  const eye: Vec3 = [orbit.distance * ce * Math.cos(orbit.azimuth), orbit.distance * Math.sin(orbit.elevation), orbit.distance * ce * Math.sin(orbit.azimuth)];
  const forward = normalize(sub([0, 0, 0], eye));
  const right = normalize(cross(forward, [0, 1, 0]));
  const up = cross(right, forward);
  const focal = h / 2 / Math.tan((45 * Math.PI) / 360);
  return {
    eye,
    project(p) {
      const d = sub(p, eye);
      const z = dot(d, forward);
      if (z <= 0.05) return null;
      return [w / 2 + (dot(d, right) / z) * focal, h / 2 - (dot(d, up) / z) * focal, z];
    },
  };
}

/** The surface normal at (x, y) by central differences, in world space (y up). */
export function surfaceNormal(x: number, y: number, t: number): Vec3 {
  const e = 0.01;
  const dx = (waveHeight(x + e, y, t) - waveHeight(x - e, y, t)) / (2 * e);
  const dy = (waveHeight(x, y + e, t) - waveHeight(x, y - e, t)) / (2 * e);
  return normalize([-dx, 1, -dy]);
}
