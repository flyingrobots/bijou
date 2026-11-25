// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// After "Noise plane partition with peel animation" by Claudio Esperança
// (Observable): each piece lets go in turn, flies off the plane turning about a
// tilted axis, and the run plays back to reassemble it. The peel transform is a
// reconstruction of his "Peel animation" notebook, whose source this port lacks.
import { nextRandom } from '../random.js';
import { toRgb, type Hsl, type Piece } from './noise-partition-geometry.js';
import { boundingBox, lerp, type Point, type Polygon } from './noise-partition-polygon.js';
import type { Rgb } from './pixels.js';

export type PeelStyle = 'leftToRight' | 'topToBottom' | 'random';
export const PEEL_STYLES: readonly PeelStyle[] = ['leftToRight', 'topToBottom', 'random'];

type Axis = readonly [number, number, number];

export interface Flight {
  readonly polygon: Polygon;
  readonly front: Rgb;
  readonly back: Rgb;
  /** The piece's centre, and where the flight carries it. */
  readonly from: Point;
  readonly to: Point;
  /** A unit axis, and how many turns the piece makes about it over its flight. */
  readonly axis: Axis;
  readonly turns: number;
  /** When, as a fraction of the run, the piece lets go. */
  readonly start: number;
}

/** The original's 500-frame run, played forwards and then back; it holds whole for 30 frames first (the original holds 100). */
const FRAMES = 500;
const LEAD = 30;
const TAU = Math.PI * 2;

/** The original's backColor, reconstructed as the same colour in shadow. */
const backOf = (colour: Hsl): Rgb => toRgb({ ...colour, l: colour.l * 0.55 });

function unit([x, y, z]: Axis): Axis {
  const length = Math.hypot(x, y, z);
  return length === 0 ? [0, 0, 1] : [x / length, y / length, z / length];
}

/** Each piece's flight, drawing from the colour stream in the original's order, sorted so the first to go paints last. */
export function launch(pieces: readonly Piece[], style: PeelStyle, seed: number, width: number, height: number): Flight[] {
  let rng = seed;
  const rand = (lo: number, hi: number): number => {
    const [value, next] = nextRandom(rng);
    rng = next;
    return lo + value * (hi - lo);
  };
  const flights = pieces.map((piece): Flight => {
    const { min, max } = boundingBox(piece.polygon);
    const sides: Point = [max[0] - min[0], max[1] - min[1]];
    const size = Math.max(...sides);
    const from: Point = [min[0] + sides[0] / 2, min[1] + sides[1] / 2];
    const look = { polygon: piece.polygon, front: toRgb(piece.colour), back: backOf(piece.colour), from };
    if (style === 'topToBottom') {
      const start = (from[1] / height) * 0.5 + rand(0, 0.2);
      const axis = unit([1, rand(-0.5, 0.5), rand(-0.5, 0.5)]);
      const turns = rand(1, 2) + (1 - size / height) * 2;
      return { ...look, start, axis, turns, to: [from[0], from[1] + height + size] };
    }
    if (style === 'leftToRight') {
      const start = (from[0] / width) * 0.5 + rand(0, 0.2);
      const axis = unit([rand(-0.5, 0.5), 1, rand(-0.5, 0.5)]);
      const turns = rand(1, 2) + (1 - size / height) * 2;
      return { ...look, start, axis, turns, to: [from[0] + width + size, from[1]] };
    }
    const angle = rand(0, Math.PI);
    const reach = Math.hypot(width, height) + size;
    const to: Point = [min[0] + reach * Math.cos(angle), min[1] + reach * Math.sin(angle)];
    const start = rand(0, 0.5);
    const axis = unit([rand(-1, 1), rand(-1, 1), rand(-1, 1)]);
    return { ...look, start, axis, turns: rand(1, 3), to };
  });
  return flights.sort((a, b) => b.start - a.start);
}

/** The original's t after `clock` seconds at 60 frames a second: below 0 while the plane is held whole. */
export function runTime(clock: number): number {
  const k = (clock * 60) % (LEAD + 2 * FRAMES);
  const frame = k < LEAD + FRAMES ? k - LEAD : FRAMES - (k - LEAD - FRAMES);
  return frame / (FRAMES + 1);
}

/**
 * Where the flight has the piece at time `t`: a map from the plane, turning the piece about its axis (seen straight
 * on, so a turn foreshortens it) and carrying its centre towards `to`, and whether its front faces the viewer.
 */
export function place(flight: Flight, t: number): { readonly map: (p: Point) => Point; readonly front: boolean } {
  const u = Math.max(0, t - flight.start) / (1 - flight.start);
  const angle = TAU * flight.turns * u * u * (3 - 2 * u);
  const [kx, ky, kz] = flight.axis;
  const [c, s] = [Math.cos(angle), Math.sin(angle)];
  const v = 1 - c;
  const [m00, m01, m10, m11] = [c + kx * kx * v, kx * ky * v - kz * s, ky * kx * v + kz * s, c + ky * ky * v];
  const [cx, cy] = lerp(flight.from, flight.to, u * u);
  const [fx, fy] = flight.from;
  return {
    front: c + kz * kz * v > 0,
    map: ([x, y]) => [m00 * (x - fx) + m01 * (y - fy) + cx, m10 * (x - fx) + m11 * (y - fy) + cy],
  };
}
