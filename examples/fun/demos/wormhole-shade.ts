// Licensed under the Apache License, Version 2.0, like the rest of this repository.
import type { Surface } from '@flyingrobots/bijou';
import { brailleMask } from '../panel.js';
import { funnelHeight, project } from './wormhole-geometry.js';

export type RenderMode = 'braille' | 'ascii';

const ASCII = [' ', '.', ':', '+', '=', 'x', 'z', '0', 'A'];
const CELL_ASPECT = 3.67;
const INNER_RADIUS = 6.9;

function byte(value: number, floor = 0): number {
  return Math.max(floor, Math.min(255, Math.round(value)));
}

/** The line glyph that follows the photon ring at `angle`. */
function ringGlyph(angle: number): string {
  const deg = Math.abs((angle * 180) / Math.PI);
  if (deg > 70 && deg < 110) return '│';
  if (deg < 20 || deg > 160) return '─';
  const rising = (angle > 0 && angle < Math.PI / 2) || (angle < -Math.PI / 2 && angle > -Math.PI);
  return rising ? '\\' : '/';
}

function dotCount(mask: number): number {
  let count = 0;
  for (let bits = mask; bits > 0; bits >>= 1) count += bits & 1;
  return count;
}

/** Lower the dot grid to cells and shade them: a glow around the well, the wire in a cyan-to-magenta ramp, a dark mouth with a bright rim. */
export function shade(surface: Surface, grid: Uint8Array, elapsed: number, mode: RenderMode): void {
  const { width, height } = surface;
  const centre = project(0, funnelHeight(1), 12, width, height);
  const cx = (centre?.sx ?? width) / 2;
  const cy = (centre?.sy ?? height * 4 * 0.55) / 4;
  const maxRadius = Math.max(width, height) * 0.9;
  const pulse = Math.sin(elapsed * 1.2) * 0.15 + 0.85;
  for (let y = 0; y < height; y += 1) {
    const yRatio = y / height;
    const dy = (y - cy) * CELL_ASPECT;
    for (let x = 0; x < width; x += 1) {
      const dx = x - cx;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const glow = Math.max(0, 1 - dist / maxRadius);
      const cyan = (1 - yRatio) * glow;
      const purple = yRatio * glow;
      const bg: readonly [number, number, number] =
        [byte(purple * 40 * pulse), byte(cyan * 35 * pulse), byte((cyan * 50 + purple * 60) * pulse)];
      if (dist < INNER_RADIUS) {
        if (dist >= INNER_RADIUS - 1.2) surface.setRGB(x, y, ringGlyph(Math.atan2((dx * 2) / CELL_ASPECT, -dy)), 255, 180, 255, 0, 0, 0);
        else surface.setRGB(x, y, ' ', 0, 0, 0, 0, 0, 0);
        continue;
      }
      const mask = brailleMask(grid, width * 2, x, y);
      if (mask === 0) {
        surface.setRGB(x, y, ' ', 0, 0, 0, bg[0], bg[1], bg[2]);
        continue;
      }
      const brightness = 0.3 + 0.7 * glow;
      const blend = Math.min(1, yRatio / 0.7);
      const glyph = mode === 'braille' ? String.fromCharCode(0x2800 + mask) : (ASCII[dotCount(mask)] ?? ' ');
      surface.setRGB(
        x, y, glyph,
        byte(blend * 255 * brightness, 15), byte(((1 - blend) * 240 + blend * 30) * brightness, 15),
        byte(((1 - blend) * 255 + blend * 220) * brightness, 25), bg[0], bg[1], bg[2],
      );
    }
  }
}
