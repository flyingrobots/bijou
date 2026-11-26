// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// The FLIP method here is after Matthias Mueller (Ten Minute Physics, 2022), MIT License.
import { createSurface, type Surface } from '@flyingrobots/bijou';
import { trianglePoints, type Point } from './flip-collide.js';
import { at, clamp, FLUID_CELL, type FlipFluid } from './flip-core.js';
import type { Circle } from './flip-simulate.js';

/** Characters from empty to dense for each letter of FLUID, so a cell's density picks one and the letters alternate. */
const CHAR_DICTS: readonly string[] = [' .-:~fF', ' .-:~lL', ' .-:~uU', ' .-:~iI', ' .-:~dD'];

/** Walk a line in the fluid's own coordinates, upward being positive, and mark each cell with the obstacle's outline. */
function drawLine(surface: Surface, from: Point, to: Point): void {
  let x0 = Math.round(from.x);
  let y0 = Math.round(from.y);
  const x1 = Math.round(to.x);
  const y1 = Math.round(to.y);
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  for (;;) {
    const renderY = surface.height - 1 - y0;
    if (x0 >= 0 && x0 < surface.width && renderY >= 0 && renderY < surface.height) {
      surface.setRGB(x0, renderY, '▲', 255, 120, 0, 0, 0, 0);
    }
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }
}

/** The fluid cells as letters from cyan (loose) to deep blue (dense), and the obstacle as an orange outline. */
export function paintFluid(f: FlipFluid, obstacle: Circle): Surface {
  const surface = createSurface(f.fNumX, f.fNumY);
  for (let x = 1; x < f.fNumX - 1; x += 1) {
    for (let y = 1; y < f.fNumY - 1; y += 1) {
      const cell = x * f.fNumY + y;
      if (f.cellType[cell] !== FLUID_CELL) continue;
      const color = at(f.cellColor, 3 * cell);
      const dict = CHAR_DICTS[(x + y * 3) % CHAR_DICTS.length] ?? ' ';
      const char = dict.charAt(clamp(Math.floor(color * dict.length), 0, dict.length - 1));
      const ratio = clamp(color, 0, 1);
      const [r, g, b] = [Math.round(30 * (1 - ratio)), Math.round(180 * (1 - ratio) + 30), Math.round(150 + 105 * ratio)];
      surface.setRGB(x, f.fNumY - 1 - y, char, r, g, b, 0, 0, 0);
    }
  }
  const [a, b, c] = trianglePoints(obstacle.x, obstacle.y, obstacle.radius);
  drawLine(surface, a, b);
  drawLine(surface, b, c);
  drawLine(surface, c, a);
  return surface;
}
