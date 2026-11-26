// Licensed under the Apache License, Version 2.0, like the rest of this repository.
import { createSurface, type Surface } from '@flyingrobots/bijou';
import { isPointInObstacle, type Particle } from './fluid-collide.js';

const H = 1.9;
const TEXT = 'FLUIDfluid';

/** Splat each particle's falloff into a grid of cell densities, then carve the well out of it. */
function densities(particles: readonly Particle[], width: number, height: number): Float32Array {
  const grid = new Float32Array(width * height);
  for (const p of particles) {
    for (let cy = Math.max(0, Math.floor(p.y - H)); cy <= Math.min(height - 1, Math.ceil(p.y + H)); cy += 1) {
      for (let cx = Math.max(0, Math.floor(p.x - H)); cx <= Math.min(width - 1, Math.ceil(p.x + H)); cx += 1) {
        const d2 = (cx - p.x) * (cx - p.x) + (cy - p.y) * (cy - p.y);
        const d = Math.sqrt(d2);
        if (d2 < H * H) grid[cy * width + cx] = (grid[cy * width + cx] ?? 0) + (1.0 - d / H) * (1.0 - d / H);
      }
    }
  }
  const ox = width * 0.5;
  const oy = height * 0.55;
  for (let cy = Math.max(0, Math.floor(oy - 14)); cy <= Math.min(height - 1, Math.ceil(oy + 14)); cy += 1) {
    for (let cx = Math.max(0, Math.floor(ox - 20)); cx <= Math.min(width - 1, Math.ceil(ox + 20)); cx += 1) {
      if (isPointInObstacle(cx, cy, ox, oy)) grid[cy * width + cx] = 0;
    }
  }
  return grid;
}

/** The tank's cells: letters of FLUID in the body, a neon spray character at the surface, nothing elsewhere. */
export function paintTank(particles: readonly Particle[], width: number, height: number): Surface {
  const surface = createSurface(width, height);
  const grid = densities(particles, width, height);
  for (let y = 0; y < height; y += 1) {
    const ratio = y / height;
    const r = Math.max(10, Math.min(100, Math.round(50 * (1 - ratio))));
    const g = Math.max(40, Math.min(220, Math.round(180 * (1 - ratio) + 30)));
    const b = Math.max(120, Math.min(255, Math.round(200 + 55 * ratio)));
    for (let x = 0; x < width; x += 1) {
      const d = grid[y * width + x] ?? 0;
      if (d > 0.28) surface.setRGB(x, y, TEXT.charAt((x + y * 3) % TEXT.length), r, g, b, 0, 0, 0);
      else if (d > 0.08) {
        const char = d > 0.22 ? '+' : d > 0.16 ? '~' : d > 0.11 ? ':' : '.';
        surface.setRGB(x, y, char, 200, 240, 255, 0, 0, 0);
      }
    }
  }
  return surface;
}
