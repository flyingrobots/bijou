// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// One universe as coloured braille: dim arms, fading tip trails and bright bobs, a hue per pendulum.
import type { Surface } from '@flyingrobots/bijou';
import { PENDULUMS, TRAIL, type Universe } from './butterfly-physics.js';
import { hslToRgb, type Rgb } from './hsl.js';

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** Hue per pendulum across most of the wheel, so neighbours in the fan sit next to each other in colour. */
const HUES: readonly Rgb[] = Array.from({ length: PENDULUMS }, (_, i) => hslToRgb(330 - (300 * i) / PENDULUMS, 90, 62));
const ARM_COLOUR = PENDULUMS;
const ARM: Rgb = { r: 150, g: 160, b: 185 };
/** Braille bit for the dot at (column, row) of a cell. */
const BITS = [[0x01, 0x08], [0x02, 0x10], [0x04, 0x20], [0x40, 0x80]] as const;
/** Only every this-many-th pendulum draws its arms; every pendulum draws its trail and bob. */
const ARM_STRIDE = 6;

interface Dots {
  readonly width: number;
  readonly height: number;
  readonly light: Float32Array;
  readonly colour: Uint16Array;
}

function plot(dots: Dots, x: number, y: number, light: number, colour: number): void {
  const px = Math.round(x);
  const py = Math.round(y);
  if (px < 0 || py < 0 || px >= dots.width || py >= dots.height) return;
  const at = py * dots.width + px;
  if (light <= (dots.light[at] ?? 0)) return;
  dots.light[at] = light;
  dots.colour[at] = colour;
}

function line(dots: Dots, x0: number, y0: number, x1: number, y1: number, light: number, colour: number): void {
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
  for (let s = 0; s <= steps; s += 1) plot(dots, x0 + ((x1 - x0) * s) / steps, y0 + ((y1 - y0) * s) / steps, light, colour);
}

/** Draw the ensemble into a dot grid: pivot at the centre, two arm lengths reaching the nearer edge. */
function draw(dots: Dots, universe: Universe): void {
  const cx = dots.width / 2;
  const cy = dots.height / 2;
  const arm = Math.max(1, Math.min(dots.width, dots.height) / 4 - 1);
  for (let age = universe.count - 1; age >= 1; age -= 1) {
    const newer = (universe.head - age + 1 + TRAIL) % TRAIL;
    const older = (universe.head - age + TRAIL) % TRAIL;
    const light = 0.75 * (1 - age / TRAIL);
    for (let i = 0; i < PENDULUMS; i += 1) {
      const a = (older * PENDULUMS + i) * 2;
      const b = (newer * PENDULUMS + i) * 2;
      const t = universe.trail;
      line(dots, cx + (t[a] ?? 0) * arm, cy + (t[a + 1] ?? 0) * arm, cx + (t[b] ?? 0) * arm, cy + (t[b + 1] ?? 0) * arm, light, i);
    }
  }
  for (let i = 0; i < PENDULUMS; i += 1) {
    const t1 = universe.state[i * 4] ?? 0;
    const t2 = universe.state[i * 4 + 1] ?? 0;
    const x1 = cx + Math.sin(t1) * arm;
    const y1 = cy + Math.cos(t1) * arm;
    const x2 = x1 + Math.sin(t2) * arm;
    const y2 = y1 + Math.cos(t2) * arm;
    if (i % ARM_STRIDE === 0) {
      line(dots, cx, cy, x1, y1, 0.5, ARM_COLOUR);
      line(dots, x1, y1, x2, y2, 0.8, i);
    }
    plot(dots, x2, y2, 1, i);
  }
  plot(dots, cx, cy, 1, ARM_COLOUR);
}

/** Paint `universe` into `rect` of `surface` as braille on `paper`, each cell in the colour of its brightest dot. */
export function paintUniverse(surface: Surface, rect: Rect, universe: Universe, paper: Rgb): void {
  const width = rect.width * 2;
  const height = rect.height * 4;
  const dots: Dots = { width, height, light: new Float32Array(width * height), colour: new Uint16Array(width * height) };
  draw(dots, universe);
  for (let cy = 0; cy < rect.height; cy += 1) {
    for (let cx = 0; cx < rect.width; cx += 1) {
      let mask = 0;
      let best = 0;
      let colour = 0;
      for (let dy = 0; dy < 4; dy += 1) {
        for (let dx = 0; dx < 2; dx += 1) {
          const at = (cy * 4 + dy) * width + cx * 2 + dx;
          const light = dots.light[at] ?? 0;
          if (light < 0.04) continue;
          mask |= BITS[dy]?.[dx] ?? 0;
          if (light > best) { best = light; colour = dots.colour[at] ?? 0; }
        }
      }
      const ink = colour === ARM_COLOUR ? ARM : HUES[colour] ?? ARM;
      const k = 0.2 + 0.8 * best;
      const glyph = mask === 0 ? ' ' : String.fromCharCode(0x2800 + mask);
      surface.setRGB(rect.x + cx, rect.y + cy, glyph, Math.round(ink.r * k), Math.round(ink.g * k), Math.round(ink.b * k), paper.r, paper.g, paper.b);
    }
  }
}
