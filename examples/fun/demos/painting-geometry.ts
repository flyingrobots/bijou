// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// After "Generative Painting" by Karim Douieb (Observable), a recreation of Tyler Hobbs's
// watercolour technique: each edge of a shape grows a random "ear" triangle, each ear grows two
// more, and past the core depth the ears are drawn again and again at a falling opacity.
import { nextRandom } from '../random.js';
import type { Point } from './painting-raster.js';

/** The original's sliders: total steps, core depth, and the layer default. */
export const TOTAL_STEPS = 7;
export const CORE_DEPTH = 2;
export const DEFAULT_LAYERS = 100;

/** A seeded source of the original's two kinds of randomness. */
export interface Brush {
  /** Uniform in [0, 1) from the seeded generator, where the original drew from its global random source. */
  readonly uniform: () => number;
  /** A gaussian around 0.5 with deviation 0.4, clamped to [0, 1]: the original's `random()`. */
  readonly random: () => number;
  /** The seed to carry on from. */
  readonly seed: () => number;
}

export function brush(start: number): Brush {
  let seed = start;
  const uniform = (): number => {
    const [value, next] = nextRandom(seed);
    seed = next;
    return value;
  };
  const random = (): number => {
    const z = Math.sqrt(-2 * Math.log(1 - uniform())) * Math.cos(2 * Math.PI * uniform());
    return Math.min(1, Math.max(0, 0.5 + 0.4 * z));
  };
  return { uniform, random, seed: () => seed };
}

/** A triangle and the opacity it is drawn at. */
export type Stroke = (triangle: readonly [Point, Point, Point], alpha: number) => void;

/** An ear at the core depth: its layers are drawn later, `layers` times, two sub-ears each. */
export interface CoreEar {
  readonly p1: Point;
  readonly tip: Point;
  readonly p2: Point;
  readonly lengthFactor: number;
}

/** The original's `findThirdPoint`: from A, turn the direction to C by angle `a` and go `c` along it (`b` is |AC|'s stand-in). */
function thirdPoint(a: Point, c: Point, b: number, length: number, angle: number): Point {
  const ux = (c[0] - a[0]) / b;
  const uy = (c[1] - a[1]) / b;
  const rx = ux * Math.cos(angle) - uy * Math.sin(angle);
  const ry = ux * Math.sin(angle) + uy * Math.cos(angle);
  return [a[0] + length * rx, a[1] + length * ry];
}

/** The original's `drawEar`, except that a core ear is handed to `core` instead of drawing its layers at once. */
export function drawEar(rng: Brush, p1: Point, p2: Point, depth: number, lengthFactor: number, noRecursion: boolean, stroke: Stroke, core: (ear: CoreEar) => void): void {
  if (depth > TOTAL_STEPS) return;
  const t = rng.random();
  const start: Point = [p1[0] + (p2[0] - p1[0]) * t, p1[1] + (p2[1] - p1[1]) * t];
  const angle = rng.uniform() > 0.5 ? Math.PI * rng.random() : Math.PI - Math.PI * rng.random();
  const distance = Math.hypot(p1[0] - p2[0], p1[1] - p2[1]);
  if (distance === 0) return;
  const tip = thirdPoint(start, p2, distance, distance * lengthFactor * rng.random(), angle);
  stroke([p1, p2, tip], depth <= CORE_DEPTH ? 1 : 1 / depth ** 1.5);
  if (depth === CORE_DEPTH && !noRecursion) {
    core({ p1, tip, p2, lengthFactor });
    return;
  }
  drawEar(rng, p1, tip, depth + 1, lengthFactor, false, stroke, core);
  drawEar(rng, tip, p2, depth + 1, lengthFactor, false, stroke, core);
}

/** One layer of a core ear: the two sub-ears the original's layer loop draws. */
export function drawLayer(rng: Brush, ear: CoreEar, stroke: Stroke): void {
  const none = (): void => undefined;
  drawEar(rng, ear.p1, ear.tip, CORE_DEPTH + 1, ear.lengthFactor, true, stroke, none);
  drawEar(rng, ear.tip, ear.p2, CORE_DEPTH + 1, ear.lengthFactor, true, stroke, none);
}

/** One colour of a painting: a filled base shape and the edges that grow ears. */
export interface Pass {
  readonly colour: string;
  readonly base: readonly Point[];
  readonly edges: readonly (readonly [Point, Point])[];
}

/** The original's `paint`: each edge's length factor, then its ear tree down to the core. Returns the core ears. */
export function paintEdges(rng: Brush, pass: Pass, stroke: Stroke): readonly CoreEar[] {
  const cores: CoreEar[] = [];
  for (const [p1, p2] of pass.edges) {
    const lengthFactor = Math.max(0.6, rng.random() * 1.2);
    drawEar(rng, p1, p2, 1, lengthFactor, false, stroke, (ear) => cores.push(ear));
  }
  return cores;
}

const edgesOf = (points: readonly Point[], closed: boolean): readonly (readonly [Point, Point])[] =>
  points.slice(0, closed ? points.length : points.length - 1).map((p, i): readonly [Point, Point] => [p, points[(i + 1) % points.length] ?? p]);

/** The first canvas: a decagon of radius a fifth of the shorter side, centred, in one colour. */
export function blobPasses(colour: string, w: number, h: number): readonly Pass[] {
  const radius = Math.min(w, h) * 0.2;
  const angle = (Math.PI * 2) / 10;
  const points = Array.from({ length: 10 }, (_, i): Point => [w / 2 + radius * Math.sin(angle * i), h / 2 + radius * Math.cos(angle * i)]);
  return [{ colour, base: points, edges: edgesOf(points, true) }];
}

/** The colour painting: one wavy band per palette colour, first colour highest, each filled down to the bottom. */
export function bandPasses(palette: readonly string[], w: number, h: number): readonly Pass[] {
  const count = 8;
  return palette.map((colour, i): Pass => {
    const index = palette.length - i - 1;
    const points = Array.from({ length: count }, (_, j): Point => [
      (w / (count - 1)) * (count - 1 - j),
      h - (h / (palette.length - 1)) * (0.5 + index + Math.sin(Math.PI * 2 * (j / count)) / 2),
    ]);
    return { colour, base: [...points, [0, h], [w, h]], edges: edgesOf(points, false) };
  });
}
