// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// The brush of "Oil painting brushstrokes" by akngs (Observable): a stroke is a bundle of hairs spread over a disc;
// each hair lays a light line offset one way, a dark line offset the other, then its colour, all jittered.
import { nextRandom } from '../random.js';
import type { Rgb } from './pixels.js';

/** The painting in sub-pixels, three floats each. */
export interface Canvas {
  readonly width: number;
  readonly height: number;
  readonly rgb: Float32Array;
}

export interface StrokeSpec {
  /** Ends as fractions of the canvas, thickness as a fraction of its shorter side. */
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
  readonly thickness: number;
  readonly colour: Rgb;
  /** Seeds the hairs and their jitter. */
  readonly seed: number;
}

const PAPER: Rgb = [255, 255, 255];
const WHITE: Rgb = [255, 255, 255];
const BLACK: Rgb = [0, 0, 0];
/** The original grows hairs with thickness squared times 0.1 on a page-wide canvas; a pane needs more per pixel. */
const HAIR_DENSITY = 0.6;
const MIN_HAIRS = 12;
const MAX_HAIRS = 400;
/** How much a colour line covers: the original's 2 to 4 wide line, laid one sub-pixel wide. */
const COLOUR_ALPHA = 0.85;

/** The original's stroke list: ends in [0.1, 0.9) of the canvas, thickness [0.05, 0.1) of it, a colour from the set. */
export function planStrokes(seed: number, count: number, colours: readonly Rgb[]): readonly [readonly StrokeSpec[], number] {
  let s = seed;
  const draw = (): number => {
    const [r, next] = nextRandom(s);
    s = next;
    return r;
  };
  const strokes = Array.from({ length: count }, (): StrokeSpec => ({
    x1: draw() * 0.8 + 0.1, y1: draw() * 0.8 + 0.1, x2: draw() * 0.8 + 0.1, y2: draw() * 0.8 + 0.1,
    thickness: draw() * 0.05 + 0.05,
    colour: colours[Math.floor(draw() * colours.length)] ?? BLACK,
    seed: Math.floor(draw() * 0x100000000),
  }));
  return [strokes, s];
}

export function blankCanvas(width: number, height: number): Canvas {
  const rgb = new Float32Array(width * height * 3);
  for (let i = 0; i < width * height; i += 1) rgb.set(PAPER, i * 3);
  return { width, height, rgb };
}

/** Blend `colour` at `alpha` along the segment, one sub-pixel per step along its longer axis. */
function line(canvas: Canvas, x0: number, y0: number, x1: number, y1: number, colour: Rgb, alpha: number): void {
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
  for (let k = 0; k < steps; k += 1) {
    const x = Math.floor(x0 + ((x1 - x0) * k) / steps);
    const y = Math.floor(y0 + ((y1 - y0) * k) / steps);
    if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) continue;
    const i = (y * canvas.width + x) * 3;
    for (let c = 0; c < 3; c += 1) canvas.rgb[i + c] = (canvas.rgb[i + c] ?? 0) * (1 - alpha) + (colour[c] ?? 0) * alpha;
  }
}

/** Paint one stroke into `canvas` in place, hair by hair as the original does. */
function drawStroke(canvas: Canvas, spec: StrokeSpec): void {
  let s = spec.seed;
  const random = (): number => {
    const [r, next] = nextRandom(s);
    s = next;
    return r;
  };
  const x1 = spec.x1 * canvas.width;
  const y1 = spec.y1 * canvas.height;
  const dx = spec.x2 * canvas.width - x1;
  const dy = spec.y2 * canvas.height - y1;
  const thickness = spec.thickness * Math.min(canvas.width, canvas.height);
  const shadow = (Math.abs(Math.atan2(dx, dy)) / 2 / Math.PI) * 4;
  const segments = Math.max(2, Math.ceil(Math.hypot(dx, dy) * 0.1));
  const hairs = Math.min(MAX_HAIRS, Math.max(MIN_HAIRS, Math.ceil(thickness ** 2 * HAIR_DENSITY)));
  for (let h = 0; h < hairs; h += 1) {
    const t = random() * Math.PI * 2;
    const rad = Math.sin(random() * Math.PI * 0.5) * 0.2 + random() * 0.8;
    const hx = Math.cos(t) * rad * thickness * 0.5;
    const hy = Math.sin(t) * rad * thickness * 0.5;
    const passes: readonly (readonly [Rgb, number, number])[] = [
      [WHITE, random() * 0.5 * random(), -shadow],
      [BLACK, random() * 0.5 * random(), shadow],
      [spec.colour, COLOUR_ALPHA, 0],
    ];
    for (const [colour, alpha, offset] of passes) {
      // As the original: from the start, out to the far end and back, every vertex jittered by up to a pixel.
      let px = x1 + hx + offset;
      let py = y1 + hy + offset;
      for (let i = segments - 1; i >= 0; i -= 1) {
        const nx = x1 + (dx * i) / segments + hx + offset + random() * 2 - 1;
        const ny = y1 + (dy * i) / segments + hy + offset + random() * 2 - 1;
        line(canvas, px, py, nx, ny, colour, alpha);
        px = nx;
        py = ny;
      }
    }
  }
}

/** A copy of `canvas` with `strokes` painted over it in order. */
export function withStrokes(canvas: Canvas, strokes: readonly StrokeSpec[]): Canvas {
  const next: Canvas = { width: canvas.width, height: canvas.height, rgb: canvas.rgb.slice() };
  for (const spec of strokes) drawStroke(next, spec);
  return next;
}
