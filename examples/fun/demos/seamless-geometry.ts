// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// After "(Day 8 of 30) Seamless Patterns in P5.js" by cdr6934 (Observable): rows
// of squares, each turned about its corner, rocking on a sine wave.
import { mix, type Rgb } from './pixels.js';

/** One square in the original's canvas units: its turned corner, its angle and its colour. */
export interface Placed {
  readonly x: number;
  readonly y: number;
  readonly angle: number;
  readonly colour: Rgb;
}

/** The original canvas is 1000 units wide; the demo scales that width to the pane. */
export const CANVAS_WIDTH = 1000;
/** Squares per row, the original's `n`. */
const COLUMNS = 20;
/** Row spacing: the original's 500-unit height over its 20 rows. */
const ROW_STEP = 25;
const TOP = 20;
/** Even rows shift right and odd rows left by this much before dividing by the column count. */
const SHIFT = 100;
/** The oscillator's amplitude, the original's `ocs`. */
const WAVE = 20;

/** Rows needed to cover a canvas `height` units tall, in the original's 25-unit steps. */
export function rowsFor(height: number): number {
  return Math.max(1, Math.ceil(height / ROW_STEP));
}

/** The squares at phase `j`, in drawing order. `inks` are the original's c1 to c4. */
export function placeSquares(rows: number, j: number, inks: readonly [Rgb, Rgb, Rgb, Rgb]): Placed[] {
  const out: Placed[] = [];
  for (let k = 0; k < rows; k += 1) {
    const even = k % 2 === 0;
    for (let i = 0; i < COLUMNS; i += 1) {
      out.push({
        x: ((even ? SHIFT : -SHIFT) + CANVAS_WIDTH * i) / COLUMNS,
        y: TOP + ROW_STEP * k + WAVE * Math.sin(((1 + i + j) / COLUMNS) * Math.PI),
        angle: even ? j * 0.5 : j * -0.5,
        colour: even ? mix(inks[0], inks[1], i / COLUMNS) : mix(inks[2], inks[3], i / COLUMNS),
      });
    }
  }
  return out;
}

/**
 * Each picture pixel's square, or -1 for the ground, painted square by square so later squares cover earlier ones.
 * `scale` is picture pixels per canvas unit; `size` is the square's side in canvas units.
 */
export function rasterize(squares: readonly Placed[], size: number, scale: number, w: number, h: number): Int16Array {
  const out = new Int16Array(w * h).fill(-1);
  squares.forEach((square, index) => {
    const c = Math.cos(square.angle);
    const s = Math.sin(square.angle);
    const xs = [0, size * c, -size * s, size * (c - s)].map((dx) => (square.x + dx) * scale);
    const ys = [0, size * s, size * c, size * (s + c)].map((dy) => (square.y + dy) * scale);
    const x0 = Math.max(0, Math.floor(Math.min(...xs)));
    const x1 = Math.min(w - 1, Math.ceil(Math.max(...xs)));
    const y0 = Math.max(0, Math.floor(Math.min(...ys)));
    const y1 = Math.min(h - 1, Math.ceil(Math.max(...ys)));
    for (let y = y0; y <= y1; y += 1) {
      for (let x = x0; x <= x1; x += 1) {
        const dx = (x + 0.5) / scale - square.x;
        const dy = (y + 0.5) / scale - square.y;
        const u = dx * c + dy * s;
        const v = dy * c - dx * s;
        if (u >= 0 && u <= size && v >= 0 && v <= size) out[y * w + x] = index;
      }
    }
  });
  return out;
}
