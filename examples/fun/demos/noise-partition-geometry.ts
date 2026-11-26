// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// After "Noise plane partition" by Claudio Esperança (Observable): cut a polygon
// in two along a flow line of a noise field, traced both ways from a point inside
// it until it meets the border, and recurse, alternating lines across the flow
// with lines along it. Shared by the partition and its peel animation.
import { nextRandom } from '../random.js';
import { hslToRgb } from './hsl.js';
import { flow, split, type Flow } from './noise-partition-flow.js';
import { boundingBox, polygonArea, polygonPerimeter, subdividePolygon, type Polygon } from './noise-partition-polygon.js';
import type { Rgb } from './pixels.js';

/** Hue in degrees, saturation and lightness in percent. */
export interface Hsl {
  readonly h: number;
  readonly s: number;
  readonly l: number;
}

export interface Piece {
  readonly polygon: Polygon;
  readonly colour: Hsl;
}

/** A polygon and, unless it is too small or too thin to cut, the two halves a flow line cuts it into. */
export interface Cell {
  readonly polygon: Polygon;
  readonly halves: readonly [Cell, Cell] | null;
}

/** A composition: the world it fills, the tree of cuts, the base colour and the colour stream's seed. */
export interface Composition {
  readonly width: number;
  readonly height: number;
  readonly tree: Cell;
  readonly base: Hsl;
  readonly seed: number;
}

/** The original's canvas is 800 wide; the world's height follows the pane's shape. */
export const WORLD_WIDTH = 800;
/** The original's minimum area and perimeter-to-root-area cut-off. */
const MIN_AREA = 500;
const MAX_RATIO = 10;
/** The deepest the tree grows: the original's max recursion slider tops out here. */
const DEPTH = 16;

/** A pane of `columns` by `rows` cells is a picture two pixels per row: the world keeps that shape. */
export function worldHeight(columns: number, rows: number): number {
  return Math.max(200, Math.min(2400, Math.round((WORLD_WIDTH * 2 * rows) / Math.max(1, columns))));
}

export const toRgb = ({ h, s, l }: Hsl): Rgb => {
  const { r, g, b } = hslToRgb(h, s, l);
  return [r, g, b];
};

function grow(polygon: Polygon, level: number, sideways: boolean, field: Flow): Cell {
  const { min, max } = boundingBox(polygon);
  const area = Math.abs(polygonArea(polygon));
  const leaf: Cell = { polygon, halves: null };
  const small = Math.min(max[0] - min[0], max[1] - min[1]) < 10 || area < MIN_AREA;
  if (level < 1 || small || polygonPerimeter(polygon) / Math.sqrt(area) > MAX_RATIO) return leaf;
  const halves = split(polygon, sideways, field);
  if (halves === null) return leaf;
  return { polygon, halves: [grow(halves[0], level - 1, !sideways, field), grow(halves[1], level - 1, !sideways, field)] };
}

/** A new composition from the seed, `height` world units tall, the flow field at 2^`scaleLog2` noise units a unit. */
export function compose(seed: number, height: number, scaleLog2: number, luminosity: number): Composition {
  const [hue, s1] = nextRandom(seed);
  const [saturation, s2] = nextRandom(s1);
  const outline = subdividePolygon([[0, 0], [WORLD_WIDTH, 0], [WORLD_WIDTH, height], [0, height]], 5);
  const tree = grow(outline, DEPTH, false, flow((seed ^ 0x9e3779b9) >>> 0, scaleLog2));
  return { width: WORLD_WIDTH, height, tree, base: { h: hue * 360, s: 50 + saturation * 10, l: luminosity * 100 }, seed: s2 };
}

/**
 * The tree cut `level` deep, coloured as the original does: the first half keeps its parent's colour and the second
 * drifts in hue by up to `variation` of a turn, in saturation by as much, and in lightness by a fifth of it.
 * Returns the pieces and the colour stream's next seed.
 */
export function colourAt(tree: Cell, level: number, base: Hsl, variation: number, seed: number): readonly [Piece[], number] {
  let rng = seed;
  const rand = (lo: number, hi: number): number => {
    const [value, next] = nextRandom(rng);
    rng = next;
    return lo + value * (hi - lo);
  };
  const pieces: Piece[] = [];
  const walk = (cell: Cell, colour: Hsl, left: number): void => {
    if (left < 1 || cell.halves === null) {
      pieces.push({ polygon: cell.polygon, colour });
      return;
    }
    walk(cell.halves[0], colour, left - 1);
    const [dh, ds, dl] = [rand(-variation, variation), rand(-variation, variation), rand(-variation * 0.2, variation * 0.2)];
    const clamp = (v: number): number => Math.max(0, Math.min(100, v));
    walk(cell.halves[1], { h: (colour.h + dh * 360) % 360, s: clamp(colour.s + ds * 100), l: clamp(colour.l + dl * 100) }, left - 1);
  };
  walk(tree, base, level);
  return [pieces, rng];
}
