// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// After "Line Integral Convolution" by stwind (Observable): the two passes of its advected LIC,
// after Jobard et al. One advects a noise texture along the field; the other convolves the
// blended noise along each pixel's streamline and colours it by speed through viridis.
import { fit, hash13, hash23, viridis, type LicField, type Vec2 } from './lic-fields.js';
import type { Rgb } from './pixels.js';

/** The advected noise, one entry per picture pixel. Never mutated: each step makes new arrays. */
export interface Flow {
  readonly width: number;
  readonly height: number;
  /** Where each pixel's noise came from, as x, y pairs in pixels. */
  readonly coords: Float64Array;
  /** The advected binary noise. */
  readonly noise: Float32Array;
  /** The noise blended over time, which the convolution reads. */
  readonly blended: Float32Array;
  /** The step counter the hashes read. */
  readonly time: number;
}

/** The original's injection rate and blend weight. */
const INJECT = 0.02;
const ALPHA = 0.97;

/** The field's velocity at picture point (x, y) in pixels, y down, over the original's extent of 10 units tall. */
export function velocity(field: LicField, x: number, y: number, w: number, h: number): Vec2 {
  const aspect = w / h;
  const [u, v] = field.at(-5 * aspect + (10 * aspect * x) / w, 5 - (10 * y) / h);
  return [u, -v];
}

/** Linear sampling of a w by h texture at (x, y) in pixels, texel centres at half pixels, clamped at the edges. */
function sample(tex: Float32Array, w: number, h: number, x: number, y: number): number {
  const u = Math.min(w - 1, Math.max(0, x - 0.5));
  const v = Math.min(h - 1, Math.max(0, y - 0.5));
  const x0 = Math.floor(u);
  const y0 = Math.floor(v);
  const x1 = Math.min(w - 1, x0 + 1);
  const y1 = Math.min(h - 1, y0 + 1);
  const fx = u - x0;
  const fy = v - y0;
  const top = (tex[y0 * w + x0] ?? 0) * (1 - fx) + (tex[y0 * w + x1] ?? 0) * fx;
  const bottom = (tex[y1 * w + x0] ?? 0) * (1 - fx) + (tex[y1 * w + x1] ?? 0) * fx;
  return top * (1 - fy) + bottom * fy;
}

/** The original's Initialize pass: binary noise and a jittered source per pixel. */
export function seedFlow(width: number, height: number, time: number): Flow {
  const n = width * height;
  const coords = new Float64Array(n * 2);
  const noise = new Float32Array(n);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = y * width + x;
      const [jx, jy] = hash23(x + 0.5, y + 0.5, time);
      coords[i * 2] = x + jx;
      coords[i * 2 + 1] = y + jy;
      noise[i] = hash13(x + 0.5, y + 0.5, time) >= 0.5 ? 1 : 0;
    }
  }
  return { width, height, coords, noise, blended: Float32Array.from(noise), time };
}

/** The original's Advection pass: trace each pixel back along the field (RK2), carry the noise, inject flips, blend. */
export function advect(flow: Flow, field: LicField): Flow {
  const { width: w, height: h, time } = flow;
  const step = field.h(w / h);
  const n = w * h;
  const coords = new Float64Array(n * 2);
  const noise = new Float32Array(n);
  const blended = new Float32Array(n);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = y * w + x;
      const cx = flow.coords[i * 2] ?? x;
      const cy = flow.coords[i * 2 + 1] ?? y;
      const bx = x + cx - Math.floor(cx);
      const by = y + cy - Math.floor(cy);
      const [f1x, f1y] = velocity(field, bx, by, w, h);
      const [f2x, f2y] = velocity(field, bx - 0.5 * step * f1x, by - 0.5 * step * f1y, w, h);
      coords[i * 2] = bx - step * f2x;
      coords[i * 2 + 1] = by - step * f2y;
      let texel: number;
      let carried: number;
      if (cx > w || cx < 0 || cy > h || cy < 0) {
        texel = hash13(cx, cy, time) >= 0.5 ? 1 : 0;
        carried = texel;
      } else {
        texel = flow.noise[Math.min(h - 1, Math.floor(cy)) * w + Math.min(w - 1, Math.floor(cx))] ?? 0;
        carried = sample(flow.noise, w, h, cx, cy);
      }
      if (hash13(cx, cy, time % 257) < INJECT) {
        texel = 1 - texel;
        carried = 1 - carried;
      }
      noise[i] = texel;
      blended[i] = carried + ((flow.blended[i] ?? 0) - carried) * ALPHA;
    }
  }
  return { width: w, height: h, coords, noise, blended, time: time + 1 };
}

const wrap = (v: number, size: number): number => ((v % size) + size) % size;

/** The original's ALIC pass: the colour of pixel (x, y), convolving `length` samples along its streamline. */
export function licPixel(flow: Flow, field: LicField, length: number, x: number, y: number): Rgb {
  const { width: w, height: h, blended } = flow;
  const step = field.h(w / h);
  const [lo, hi] = field.range(w / h);
  const k = 1 / (length + 1);
  let res = (blended[y * w + x] ?? 0) * k;
  let bx = x + 0.5;
  let by = y + 0.5;
  let fx = bx;
  let fy = by;
  for (let i = 0; i < length / 2; i += 1) {
    const [bu, bv] = velocity(field, bx, by, w, h);
    bx = wrap(bx + bu * step, w);
    by = wrap(by + bv * step, h);
    const [fu, fv] = velocity(field, fx, fy, w, h);
    fx = wrap(fx - fu * step, w);
    fy = wrap(fy - fv * step, h);
    res += (sample(blended, w, h, bx, by) + sample(blended, w, h, fx, fy)) * k;
  }
  const [u, v] = velocity(field, x + 0.5, y + 0.5, w, h);
  const [r, g, b] = viridis(fit(Math.hypot(u, v), lo, hi, 0.05, 1));
  const level = (c: number): number => Math.round(255 * Math.min(1, Math.max(0, c * res * 1.5)));
  return [level(r), level(g), level(b)];
}
