// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// Line drawing in braille dots for the two-colour line demos (Truchet tiles, Some Triangles).
import type { Surface } from '@flyingrobots/bijou';
import { brailleMask } from '../panel.js';
import type { Rgb } from './pixels.js';

/** A grid of braille dots for `surface`: two dots per cell across and four down. */
export interface DotGrid {
  readonly width: number;
  readonly height: number;
  readonly dots: Uint8Array;
}

export function dotGrid(surface: Surface): DotGrid {
  const width = surface.width * 2;
  const height = surface.height * 4;
  return { width, height, dots: new Uint8Array(width * height) };
}

/** Light the dot whose square holds (x, y); points off the grid are dropped. */
export function plot(grid: DotGrid, x: number, y: number): void {
  const dx = Math.floor(x);
  const dy = Math.floor(y);
  if (dx < 0 || dy < 0 || dx >= grid.width || dy >= grid.height) return;
  grid.dots[dy * grid.width + dx] = 1;
}

/** Light the dots along the segment from (x0, y0) to (x1, y1), one step per dot along its longer axis. */
export function plotLine(grid: DotGrid, x0: number, y0: number, x1: number, y1: number): void {
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
  for (let t = 0; t <= steps; t += 1) plot(grid, x0 + ((x1 - x0) * t) / steps, y0 + ((y1 - y0) * t) / steps);
}

/** Paint every cell of `surface` as braille: lit dots in `ink`, the rest of the cell in `paper`. */
export function paintBraille(surface: Surface, grid: DotGrid, ink: Rgb, paper: Rgb): void {
  for (let y = 0; y < surface.height; y += 1) {
    for (let x = 0; x < surface.width; x += 1) {
      const mask = brailleMask(grid.dots, grid.width, x, y);
      surface.setRGB(x, y, mask === 0 ? ' ' : String.fromCharCode(0x2800 + mask), ink[0], ink[1], ink[2], paper[0], paper[1], paper[2]);
    }
  }
}
