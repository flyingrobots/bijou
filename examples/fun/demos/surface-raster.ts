// Licensed under the Apache License, Version 2.0, like the rest of this repository.
import { hslToRgb } from './hsl.js';
import type { Rgb } from './pixels.js';
import { normalize, projector, surfaceNormal, waveHeight, type Orbit, type Vec3 } from './surface-math.js';

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
export const BACKGROUND: Rgb = [255, 255, 255];
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

/** The surface at time `t` from `orbit`, as a `w` by `h` grid of colours. `mesh` is the vertex count along a side. */
export function renderSurface(orbit: Orbit, t: number, w: number, h: number, mesh: number): Rgb[] {
  const view = projector(orbit, w, h);
  const colour: Rgb[] = Array.from({ length: w * h }, () => BACKGROUND);
  const depth = new Float32Array(w * h).fill(Infinity);
  const n = mesh;
  const verts = Array.from({ length: n * n }, (_, k) => {
    const x = -1 + (2 * (k % n)) / (n - 1);
    const y = -1 + (2 * Math.floor(k / n)) / (n - 1);
    const p: Vec3 = [x, waveHeight(x, y, t), y];
    const toEye = normalize([view.eye[0] - p[0], view.eye[1] - p[1], view.eye[2] - p[2]]);
    return { at: view.project(p), rgb: shade(surfaceNormal(x, y, t), toEye) };
  });
  const triangle = (ia: number, ib: number, ic: number): void => {
    const [a, b, c] = [verts[ia], verts[ib], verts[ic]];
    if (a?.at == null || b?.at == null || c?.at == null) return;
    const [ax, ay, az] = a.at;
    const [bx, by, bz] = b.at;
    const [cx, cy, cz] = c.at;
    const area = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
    if (Math.abs(area) < 1e-9) return;
    for (let y = Math.max(0, Math.floor(Math.min(ay, by, cy))); y <= Math.min(h - 1, Math.ceil(Math.max(ay, by, cy))); y += 1) {
      for (let x = Math.max(0, Math.floor(Math.min(ax, bx, cx))); x <= Math.min(w - 1, Math.ceil(Math.max(ax, bx, cx))); x += 1) {
        const px = x + 0.5;
        const py = y + 0.5;
        const wa = ((bx - px) * (cy - py) - (by - py) * (cx - px)) / area;
        const wb = ((cx - px) * (ay - py) - (cy - py) * (ax - px)) / area;
        const wc = 1 - wa - wb;
        if (wa < 0 || wb < 0 || wc < 0) continue;
        const z = wa * az + wb * bz + wc * cz;
        const at = y * w + x;
        if (z >= (depth[at] ?? Infinity)) continue;
        depth[at] = z;
        colour[at] = rgb([0, 1, 2].map((ch) => Math.round(wa * (a.rgb[ch] ?? 0) + wb * (b.rgb[ch] ?? 0) + wc * (c.rgb[ch] ?? 0))));
      }
    }
  };
  for (let j = 0; j < n - 1; j += 1) {
    for (let i = 0; i < n - 1; i += 1) {
      triangle(i + j * n, i + 1 + j * n, i + (j + 1) * n);
      triangle(i + 1 + j * n, i + 1 + (j + 1) * n, i + (j + 1) * n);
    }
  }
  const line = (pts: readonly (readonly [number, number, number] | null)[]): void => {
    for (let k = 0; k + 1 < pts.length; k += 1) {
      const p = pts[k];
      const q = pts[k + 1];
      if (p == null || q == null) continue;
      const steps = Math.max(1, Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1])));
      for (let s = 0; s <= steps; s += 1) {
        const x = Math.floor(p[0] + ((q[0] - p[0]) * s) / steps);
        const y = Math.floor(p[1] + ((q[1] - p[1]) * s) / steps);
        if (x < 0 || y < 0 || x >= w || y >= h) continue;
        const at = y * w + x;
        if (p[2] + ((q[2] - p[2]) * s) / steps > (depth[at] ?? Infinity) + 0.02) continue;
        const base = colour[at] ?? BACKGROUND;
        colour[at] = rgb([0, 1, 2].map((c) => Math.round((base[c] ?? 0) * (1 - LINE_ALPHA) + (LINE[c] ?? 0) * LINE_ALPHA)));
      }
    }
  };
  for (let i = 0; i < TICKS; i += 1) {
    const fixed = -1 + (2 * i) / (TICKS - 1);
    const along = Array.from({ length: 101 }, (_, k) => -1 + (2 * k) / 100);
    line(along.map((v) => view.project([fixed, waveHeight(fixed, v, t) + 0.001, v])));
    line(along.map((v) => view.project([v, waveHeight(v, fixed, t) + 0.001, fixed])));
  }
  return colour;
}
