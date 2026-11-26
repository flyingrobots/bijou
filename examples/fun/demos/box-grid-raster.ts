// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// After the p5 sketch in "Global mode p5" by Claudio Esperança (Observable): an 11 by 11 grid of
// cubes, each turned by its own angles, seen from a camera orbiting above them and lit by two grey
// point lights. This file rasterizes one frame into a depth-tested grey buffer.

type Vec3 = readonly [number, number, number];

const DEG = Math.PI / 180;
/** p5's perspective(PI / 7, ...): the vertical field of view. */
const FOCAL = 1 / Math.tan(Math.PI / 14);
/** Each light is grey 200 of 255; p5 point lights do not fall off by default. */
const LIGHTS: readonly Vec3[] = [[2, -2, 2], [0, -2, 0]];
const LIGHT_LEVEL = 200 / 255;
const HALF = 0.1;
/** Cube faces: the outward normal and four corners as sign triples, in winding order. */
const FACES: readonly (readonly [Vec3, readonly Vec3[]])[] = [
  [[1, 0, 0], [[1, -1, -1], [1, 1, -1], [1, 1, 1], [1, -1, 1]]],
  [[-1, 0, 0], [[-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1]]],
  [[0, 1, 0], [[-1, 1, -1], [-1, 1, 1], [1, 1, 1], [1, 1, -1]]],
  [[0, -1, 0], [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]]],
  [[0, 0, 1], [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]]],
  [[0, 0, -1], [[-1, -1, -1], [-1, 1, -1], [1, 1, -1], [1, -1, -1]]],
];

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a: Vec3): Vec3 => {
  const n = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / n, a[1] / n, a[2] / n];
};
const rotX = ([x, y, z]: Vec3, a: number): Vec3 => [x, y * Math.cos(a) - z * Math.sin(a), y * Math.sin(a) + z * Math.cos(a)];
const rotZ = ([x, y, z]: Vec3, a: number): Vec3 => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a), z];

/** p5's camera: eye, looking at the origin, up (0, 1, 0). p5 draws y down, so camera y runs down the screen. */
interface Camera { readonly eye: Vec3; readonly x: Vec3; readonly y: Vec3; readonly z: Vec3 }

function camera(ang: number): Camera {
  const eye: Vec3 = [2 * Math.cos(ang), -1, 2 * Math.sin(ang)];
  const z = unit(eye);
  const x = unit(cross([0, 1, 0], z));
  return { eye, x, y: cross(z, x), z };
}

/** Lambert light at a point with a normal, both in world space, as a grey level 0–255. */
function shade(point: Vec3, normal: Vec3): number {
  let sum = 0;
  for (const light of LIGHTS) sum += Math.max(0, dot(normal, unit(sub(light, point)))) * LIGHT_LEVEL;
  return 255 * Math.min(1, sum);
}

/** Fill a screen triangle (x, y, inverse depth) into the buffers where it is nearer than what is there. */
function fill(tri: readonly Vec3[], grey: number, w: number, h: number, nearness: Float32Array, out: Float32Array): void {
  const [a, b, c] = tri;
  if (a === undefined || b === undefined || c === undefined) return;
  const area = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  if (Math.abs(area) < 1e-9) return;
  const x0 = Math.max(0, Math.floor(Math.min(a[0], b[0], c[0])));
  const x1 = Math.min(w - 1, Math.ceil(Math.max(a[0], b[0], c[0])));
  const y0 = Math.max(0, Math.floor(Math.min(a[1], b[1], c[1])));
  const y1 = Math.min(h - 1, Math.ceil(Math.max(a[1], b[1], c[1])));
  for (let y = y0; y <= y1; y += 1) {
    for (let x = x0; x <= x1; x += 1) {
      const px = x + 0.5;
      const py = y + 0.5;
      const wa = ((b[0] - px) * (c[1] - py) - (b[1] - py) * (c[0] - px)) / area;
      const wb = ((c[0] - px) * (a[1] - py) - (c[1] - py) * (a[0] - px)) / area;
      const wc = 1 - wa - wb;
      if (wa < 0 || wb < 0 || wc < 0) continue;
      const near = wa * a[2] + wb * b[2] + wc * c[2];
      const at = y * w + x;
      if (near <= (nearness[at] ?? 0)) continue;
      nearness[at] = near;
      out[at] = grey;
    }
  }
}

/**
 * One frame at orbit angle `ang` (the original's frameCount * deg / 2) in a w by h buffer: each entry is the
 * grey level of the nearest cube face there, or -1 for the background.
 */
export function renderBoxes(ang: number, w: number, h: number): Float32Array {
  const out = new Float32Array(w * h).fill(-1);
  const nearness = new Float32Array(w * h);
  const cam = camera(ang);
  const project = (p: Vec3): Vec3 | null => {
    const v = sub(p, cam.eye);
    const depth = -dot(v, cam.z);
    if (depth <= 0.01) return null;
    const scale = (FOCAL * h) / 2 / depth;
    return [w / 2 + dot(v, cam.x) * scale, h / 2 + dot(v, cam.y) * scale, 1 / depth];
  };
  for (let i = -5; i <= 5; i += 1) {
    for (let j = -5; j <= 5; j += 1) {
      // p5 applies translate, rotateX, rotateZ in that order, so a vertex turns about z first.
      const ax = (ang % Math.PI) * Math.cos(ang) + i * DEG * 10;
      const az = ang + j * DEG * 5;
      const centre: Vec3 = [i * 0.2, 0, j * 0.2];
      const place = (v: Vec3): Vec3 => {
        const r = rotX(rotZ(v, az), ax);
        return [r[0] + centre[0], r[1] + centre[1], r[2] + centre[2]];
      };
      for (const [normal, corners] of FACES) {
        const n = rotX(rotZ(normal, az), ax);
        const mid = place([normal[0] * HALF, normal[1] * HALF, normal[2] * HALF]);
        if (dot(n, sub(cam.eye, mid)) <= 0) continue;
        const pts = corners.map((s) => project(place([s[0] * HALF, s[1] * HALF, s[2] * HALF])));
        const [p0, p1, p2, p3] = pts;
        if (p0 == null || p1 == null || p2 == null || p3 == null) continue;
        const grey = shade(mid, n);
        fill([p0, p1, p2], grey, w, h, nearness, out);
        fill([p0, p2, p3], grey, w, h, nearness, out);
      }
    }
  }
  return out;
}
