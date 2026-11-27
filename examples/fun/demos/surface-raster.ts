// Licensed under the Apache License, Version 2.0, like the rest of this repository.
import { hslToRgb } from './hsl.js';
import type { Rgb } from './pixels.js';
import { normalize, projector, waveHeight, type Orbit, type Vec3 } from './surface-math.js';

const toLight = (h: number, s: number, l: number, intensity: number): Vec3 => {
  const { r, g, b } = hslToRgb(h * 360, s * 100, l * 100);
  return [(r / 255) * intensity, (g / 255) * intensity, (b / 255) * intensity];
};

/** The original's lights: a hemisphere light and three coloured directional lights, positions as in the sketch. */
const SKY = toLight(0.6, 0.6, 0.5, 0.75);
const GROUND = toLight(0.095, 0.5, 0.75, 0.75);
const PI = Math.PI;
const LIGHTS: readonly { readonly dir: Vec3; readonly colour: Vec3 }[] = [
  { dir: normalize([Math.sin(PI / 2), 2, Math.cos((2 / 3) * PI)]), colour: toLight(0.8 / 6, 0.7, 0.5, 0.65) },
  { dir: normalize([Math.sin((3.5 / 3) * PI), 1, Math.cos((4 / 3) * PI)]), colour: toLight(3 / 6, 0.2, 0.5, 0.5) },
  { dir: normalize([Math.sin((5.5 / 3) * PI), 1, Math.cos(0)]), colour: toLight(5 / 6, 0.4, 0.5, 0.5) },
];
/** CSS lightblue, the original's surface colour. */
const ALBEDO: Vec3 = [173 / 255, 216 / 255, 230 / 255];
/** The original's grid lines: blue at 15% opacity. */
const LINE: Rgb = [0, 0, 255];
const LINE_ALPHA = 0.15;
const TICKS = 5;
const rgb = (c: readonly number[]): Rgb => [c[0] ?? 0, c[1] ?? 0, c[2] ?? 0];

/** Lambert light from the hemisphere and the three lights, plus a soft highlight; both sides lit, as DoubleSide. */
function shade(n: Vec3, toEye: Vec3): Rgb {
  const facing = n[0] * toEye[0] + n[1] * toEye[1] + n[2] * toEye[2] < 0 ? -1 : 1;
  const m: Vec3 = [n[0] * facing, n[1] * facing, n[2] * facing];
  const sky = 0.5 * m[1] + 0.5;
  const light = [0, 1, 2].map((c) => (GROUND[c] ?? 0) + ((SKY[c] ?? 0) - (GROUND[c] ?? 0)) * sky);
  let spec = 0;
  for (const { dir, colour } of LIGHTS) {
    const lambert = Math.max(0, m[0] * dir[0] + m[1] * dir[1] + m[2] * dir[2]);
    for (let c = 0; c < 3; c += 1) light[c] = (light[c] ?? 0) + (colour[c] ?? 0) * lambert;
    const half = normalize([dir[0] + toEye[0], dir[1] + toEye[1], dir[2] + toEye[2]]);
    spec += 0.12 * Math.max(0, m[0] * half[0] + m[1] * half[1] + m[2] * half[2]) ** 24;
  }
  return rgb([0, 1, 2].map((c) => Math.round(255 * Math.min(1, (ALBEDO[c] ?? 0) * (light[c] ?? 0) * 0.85 + spec))));
}

/**
 * The surface at time `t` from `orbit`, as a `w` by `h` RGB buffer (three bytes a pixel). `mesh` is the vertex
 * count along a side; (mesh - 1) should divide by TICKS - 1 so the grid lines run along vertex rows. The wave is
 * evaluated once a vertex, normals come from neighbouring heights, and nothing is allocated per pixel.
 */
export function renderSurface(orbit: Orbit, t: number, w: number, h: number, mesh: number): Uint8ClampedArray {
  const view = projector(orbit, w, h);
  const out = new Uint8ClampedArray(w * h * 3).fill(255); // the original's white background
  const depth = new Float32Array(w * h).fill(Infinity);
  const n = mesh;
  const step = 2 / (n - 1);
  const height = new Float32Array(n * n);
  for (let k = 0; k < n * n; k += 1) height[k] = waveHeight(-1 + step * (k % n), -1 + step * Math.floor(k / n), t);
  const hAt = (i: number, j: number): number => height[Math.min(n - 1, Math.max(0, j)) * n + Math.min(n - 1, Math.max(0, i))] ?? 0;
  const sx = new Float32Array(n * n);
  const sy = new Float32Array(n * n);
  const sz = new Float32Array(n * n);
  const col = new Uint8ClampedArray(n * n * 3);
  for (let k = 0; k < n * n; k += 1) {
    const i = k % n;
    const j = Math.floor(k / n);
    const p: Vec3 = [-1 + step * i, hAt(i, j), -1 + step * j];
    const at = view.project(p);
    sz[k] = at === null ? -1 : at[2];
    sx[k] = at?.[0] ?? 0;
    sy[k] = at?.[1] ?? 0;
    const normal = normalize([-(hAt(i + 1, j) - hAt(i - 1, j)) / (2 * step), 1, -(hAt(i, j + 1) - hAt(i, j - 1)) / (2 * step)]);
    const [r, g, b] = shade(normal, normalize([view.eye[0] - p[0], view.eye[1] - p[1], view.eye[2] - p[2]]));
    col[k * 3] = r;
    col[k * 3 + 1] = g;
    col[k * 3 + 2] = b;
  }
  const triangle = (ia: number, ib: number, ic: number): void => {
    const az = sz[ia] ?? -1;
    const bz = sz[ib] ?? -1;
    const cz = sz[ic] ?? -1;
    if (az < 0 || bz < 0 || cz < 0) return;
    const ax = sx[ia] ?? 0; const ay = sy[ia] ?? 0;
    const bx = sx[ib] ?? 0; const by = sy[ib] ?? 0;
    const cx = sx[ic] ?? 0; const cy = sy[ic] ?? 0;
    const area = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
    if (Math.abs(area) < 1e-9) return;
    const y0 = Math.max(0, Math.floor(Math.min(ay, by, cy)));
    const y1 = Math.min(h - 1, Math.ceil(Math.max(ay, by, cy)));
    const x0 = Math.max(0, Math.floor(Math.min(ax, bx, cx)));
    const x1 = Math.min(w - 1, Math.ceil(Math.max(ax, bx, cx)));
    for (let y = y0; y <= y1; y += 1) {
      const py = y + 0.5;
      for (let x = x0; x <= x1; x += 1) {
        const px = x + 0.5;
        const wa = ((bx - px) * (cy - py) - (by - py) * (cx - px)) / area;
        const wb = ((cx - px) * (ay - py) - (cy - py) * (ax - px)) / area;
        const wc = 1 - wa - wb;
        if (wa < 0 || wb < 0 || wc < 0) continue;
        const at = y * w + x;
        const z = wa * az + wb * bz + wc * cz;
        if (z >= (depth[at] ?? Infinity)) continue;
        depth[at] = z;
        for (let c = 0; c < 3; c += 1) {
          out[at * 3 + c] = wa * (col[ia * 3 + c] ?? 0) + wb * (col[ib * 3 + c] ?? 0) + wc * (col[ic * 3 + c] ?? 0);
        }
      }
    }
  };
  for (let j = 0; j < n - 1; j += 1) {
    for (let i = 0; i < n - 1; i += 1) {
      triangle(i + j * n, i + 1 + j * n, i + (j + 1) * n);
      triangle(i + 1 + j * n, i + 1 + (j + 1) * n, i + (j + 1) * n);
    }
  }
  const segment = (ka: number, kb: number): void => {
    const az = sz[ka] ?? -1;
    const bz = sz[kb] ?? -1;
    if (az < 0 || bz < 0) return;
    const ax = sx[ka] ?? 0; const ay = sy[ka] ?? 0;
    const bx = sx[kb] ?? 0; const by = sy[kb] ?? 0;
    const steps = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay)));
    for (let s = 0; s <= steps; s += 1) {
      const x = Math.floor(ax + ((bx - ax) * s) / steps);
      const y = Math.floor(ay + ((by - ay) * s) / steps);
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      const at = y * w + x;
      if (az + ((bz - az) * s) / steps > (depth[at] ?? Infinity) + 0.02) continue;
      for (let c = 0; c < 3; c += 1) out[at * 3 + c] = (out[at * 3 + c] ?? 0) * (1 - LINE_ALPHA) + (LINE[c] ?? 0) * LINE_ALPHA;
    }
  };
  const every = (n - 1) / (TICKS - 1);
  for (let tick = 0; tick < TICKS; tick += 1) {
    const fixed = Math.round(tick * every);
    for (let k = 0; k + 1 < n; k += 1) {
      segment(fixed + k * n, fixed + (k + 1) * n);
      segment(k + fixed * n, k + 1 + fixed * n);
    }
  }
  return out;
}
