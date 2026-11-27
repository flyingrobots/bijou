// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// After "Generative Painting" by Karim Douieb (Observable): its canvas, as a supersampled RGB
// buffer that takes filled triangles and polygons at an opacity, as a 2D canvas does with
// `globalAlpha` and source-over.
import type { Rgb } from './pixels.js';

/** A 2D point in picture pixels. */
export type Point = readonly [number, number];

/** A picture `width` by `height` pixels, stored `scale` samples a side per pixel as 0–255 channels. */
export interface Canvas {
  readonly width: number;
  readonly height: number;
  readonly scale: number;
  readonly rgb: Float32Array;
}

/**
 * A coordinate or opacity on a 1/4096 grid. The shapes come from sin, cos, log and pow, whose last bit V8 may compute
 * differently on x64 and arm64; on the grid every later step is exact arithmetic, so the pixels match on both.
 */
const snap = (v: number): number => Math.round(v * 4096) / 4096;
const snapPoint = (p: Point): Point => [snap(p[0]), snap(p[1])];

/** A canvas of the ground colour. */
export function blankCanvas(width: number, height: number, scale: number, ground: Rgb): Canvas {
  const rgb = new Float32Array(width * scale * height * scale * 3);
  for (let i = 0; i < rgb.length; i += 3) {
    rgb[i] = ground[0];
    rgb[i + 1] = ground[1];
    rgb[i + 2] = ground[2];
  }
  return { width, height, scale, rgb };
}

/** A copy to paint on, so the canvas a state holds is never changed. */
export function copyCanvas(canvas: Canvas): Canvas {
  return { ...canvas, rgb: Float32Array.from(canvas.rgb) };
}

function blend(canvas: Canvas, index: number, colour: Rgb, alpha: number): void {
  const { rgb } = canvas;
  for (let k = 0; k < 3; k += 1) {
    const at = index * 3 + k;
    const dst = rgb[at] ?? 0;
    rgb[at] = dst + ((colour[k] ?? 0) - dst) * alpha;
  }
}

/** Fill a triangle over the samples whose centres it covers. Changes `canvas`: call it on a copy. */
export function fillTriangle(canvas: Canvas, triangle: readonly [Point, Point, Point], colour: Rgb, opacity: number): void {
  const [a, b, c] = [snapPoint(triangle[0]), snapPoint(triangle[1]), snapPoint(triangle[2])];
  const alpha = snap(opacity);
  const s = canvas.scale;
  const sw = canvas.width * s;
  const sh = canvas.height * s;
  const ax = a[0] * s;
  const ay = a[1] * s;
  const bx = b[0] * s;
  const by = b[1] * s;
  const cx = c[0] * s;
  const cy = c[1] * s;
  if (Math.abs((bx - ax) * (cy - ay) - (by - ay) * (cx - ax)) < 1e-9) return;
  const x0 = Math.max(0, Math.floor(Math.min(ax, bx, cx)));
  const x1 = Math.min(sw - 1, Math.ceil(Math.max(ax, bx, cx)));
  const y0 = Math.max(0, Math.floor(Math.min(ay, by, cy)));
  const y1 = Math.min(sh - 1, Math.ceil(Math.max(ay, by, cy)));
  const edge = (px: number, py: number, qx: number, qy: number, x: number, y: number): number => (qx - px) * (y - py) - (qy - py) * (x - px);
  for (let y = y0; y <= y1; y += 1) {
    for (let x = x0; x <= x1; x += 1) {
      const px = x + 0.5;
      const py = y + 0.5;
      const e0 = edge(bx, by, cx, cy, px, py);
      const e1 = edge(cx, cy, ax, ay, px, py);
      const e2 = edge(ax, ay, bx, by, px, py);
      if ((e0 >= 0 && e1 >= 0 && e2 >= 0) || (e0 <= 0 && e1 <= 0 && e2 <= 0)) blend(canvas, y * sw + x, colour, alpha);
    }
  }
}

/** Fill a polygon, even-odd, row by row of samples. Changes `canvas`: call it on a copy. */
export function fillPolygon(canvas: Canvas, shape: readonly Point[], colour: Rgb, opacity: number): void {
  const points = shape.map(snapPoint);
  const alpha = snap(opacity);
  const s = canvas.scale;
  const sw = canvas.width * s;
  const sh = canvas.height * s;
  for (let y = 0; y < sh; y += 1) {
    const py = y + 0.5;
    const crossings: number[] = [];
    points.forEach((p, i) => {
      const q = points[(i + 1) % points.length] ?? p;
      const [y0, y1] = [p[1] * s, q[1] * s];
      if ((y0 <= py && py < y1) || (y1 <= py && py < y0)) crossings.push(p[0] * s + ((py - y0) / (y1 - y0)) * (q[0] - p[0]) * s);
    });
    crossings.sort((m, n) => m - n);
    for (let k = 0; k + 1 < crossings.length; k += 2) {
      const from = Math.max(0, Math.ceil((crossings[k] ?? 0) - 0.5));
      const to = Math.min(sw - 1, Math.ceil((crossings[k + 1] ?? 0) - 0.5) - 1);
      for (let x = from; x <= to; x += 1) blend(canvas, y * sw + x, colour, alpha);
    }
  }
}

/** The canvas colour at picture point (x, y): the sample under it. */
export function canvasAt(canvas: Canvas, x: number, y: number): Rgb {
  const s = canvas.scale;
  const sw = canvas.width * s;
  const sx = Math.min(sw - 1, Math.max(0, Math.floor(x * s)));
  const sy = Math.min(canvas.height * s - 1, Math.max(0, Math.floor(y * s)));
  const i = (sy * sw + sx) * 3;
  return [canvas.rgb[i] ?? 0, canvas.rgb[i + 1] ?? 0, canvas.rgb[i + 2] ?? 0];
}
