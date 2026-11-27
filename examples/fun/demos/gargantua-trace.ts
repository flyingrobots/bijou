// Licensed under the Apache License, Version 2.0, like the rest of this repository.
import { diskHit, R_IN, R_OUT } from './gargantua-disk.js';
import { rowOf, uAt, type RayTable } from './gargantua-geodesic.js';
import { skyLight, type Sky } from './gargantua-sky.js';
import type { Noise3 } from './noise.js';
import type { Rgb } from './pixels.js';

type Vec3 = readonly [number, number, number];

const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (v: Vec3): Vec3 => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};

/** A camera on a sphere around the hole, always looking at it. The disk's axis is +y. */
export interface Camera {
  /** Unit vector from the hole to the camera: the direction of orbital angle 0 for every ray. */
  readonly out: Vec3;
  readonly forward: Vec3;
  readonly right: Vec3;
  readonly up: Vec3;
}

export function cameraAt(azimuth: number, elevation: number): Camera {
  const ce = Math.cos(elevation);
  const out: Vec3 = [ce * Math.sin(azimuth), Math.sin(elevation), ce * Math.cos(azimuth)];
  const forward: Vec3 = [-out[0], -out[1], -out[2]];
  const right = norm(cross(forward, [0, 1, 0]));
  return { out, forward, right, up: cross(right, forward) };
}

/** What a frame shares across its rays. */
export interface Scene {
  readonly camera: Camera;
  readonly table: RayTable;
  readonly sky: Sky;
  readonly noise: Noise3;
  readonly time: number;
  readonly doppler: boolean;
}

const tone = (x: number): number => Math.round(255 * (1 - Math.exp(-1.25 * x)));

/**
 * Follow the ray through image-plane offset (dx, dy), in tangent units, back from the camera. It crosses the
 * equatorial plane every half turn of its orbit; each crossing inside the disk adds the disk's light over what lies
 * behind. A ray that falls in ends black; one that escapes ends on the starfield in its bent direction.
 */
export function traceRay(scene: Scene, dx: number, dy: number): Rgb {
  const { camera, table } = scene;
  const { out, forward: f, right: rt, up } = camera;
  const d = norm([f[0] + dx * rt[0] + dy * up[0], f[1] + dx * rt[1] + dy * up[1], f[2] + dx * rt[2] + dy * up[2]]);
  const cosA = Math.min(1, d[0] * f[0] + d[1] * f[1] + d[2] * f[2]);
  const sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));
  const e2: Vec3 = sinA < 1e-7 ? up : [(d[0] - cosA * f[0]) / sinA, (d[1] - cosA * f[1]) / sinA, (d[2] - cosA * f[2]) / sinA];
  const row = rowOf(Math.acos(cosA));
  const end = table.end[row] ?? 0;
  const invB2 = table.invB2[row] ?? 0;
  let r = 0;
  let g = 0;
  let b = 0;
  let through = 1;
  if (Math.abs(out[1]) + Math.abs(e2[1]) > 1e-6) {
    let phi = Math.atan2(-out[1], e2[1]);
    if (phi < 0) phi += Math.PI;
    for (; phi < end && through > 0.02; phi += Math.PI) {
      const u = uAt(table, row, phi);
      if (u <= 0) continue;
      const radius = 1 / u;
      if (radius < R_IN || radius > R_OUT) continue;
      const c = Math.cos(phi);
      const s = Math.sin(phi);
      const px = c * out[0] + s * e2[0];
      const pz = c * out[2] + s * e2[2];
      // The gas moves along (z, 0, -x); the photon heads along -(−sin φ e1 + cos φ e2), slanted by its radial motion.
      const nx = -s * out[0] + c * e2[0];
      const nz = -s * out[2] + c * e2[2];
      const lateral = (nx * pz - nz * px) / (Math.hypot(px, pz) || 1);
      const toward = (-lateral * u) / Math.sqrt(invB2 + 2 * u * u * u);
      const hit = diskHit(radius, Math.atan2(pz, px), toward, scene.time, scene.doppler, scene.noise);
      r += through * hit.alpha * hit.r;
      g += through * hit.alpha * hit.g;
      b += through * hit.alpha * hit.b;
      through *= 1 - hit.alpha;
    }
  }
  // Rays that wind near the photon sphere before escaping or falling in light a thin warm ring at the shadow's edge.
  const ring = Math.max(0, Math.min(1, (end - 1.25 * Math.PI) / (2.2 * Math.PI)));
  const glow = through * ring * ring * 1.4;
  r += glow * 1.0;
  g += glow * 0.62;
  b += glow * 0.32;
  if ((table.fallsIn[row] ?? 1) === 0 && through > 0.02) {
    const c = Math.cos(end);
    const s = Math.sin(end);
    const [sr, sg, sb] = skyLight(scene.sky, c * out[0] + s * e2[0], c * out[1] + s * e2[1], c * out[2] + s * e2[2]);
    r += through * sr;
    g += through * sg;
    b += through * sb;
  }
  return [tone(r), tone(g), tone(b)];
}
