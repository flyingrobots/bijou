// Licensed under the Apache License, Version 2.0, like the rest of this repository.
import type { Surface } from '@flyingrobots/bijou';
import { brailleMask } from '../panel.js';
import { hslToRgb } from './hsl.js';

/** A blob in braille-dot space: x and y in dots, radius in dots. */
export interface DotBlob {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly hue: number;
}

function influence(blob: DotBlob, x: number, y: number): number {
  const distSq = (x - blob.x) ** 2 + (y - blob.y) ** 2;
  return distSq > 0.01 ? (blob.radius * blob.radius) / distSq : 0;
}

/** The blended hue at a point: blob hues weighted by influence, averaged on the colour circle so red and violet do not wrap. */
function blendedHue(blobs: readonly DotBlob[], x: number, y: number): number {
  let weights = 0;
  let sumX = 0;
  let sumY = 0;
  for (const blob of blobs) {
    const w = influence(blob, x, y);
    const radians = (blob.hue * Math.PI) / 180;
    weights += w;
    sumX += w * Math.cos(radians);
    sumY += w * Math.sin(radians);
  }
  if (weights <= 0) return 0;
  const degrees = (Math.atan2(sumY / weights, sumX / weights) * 180) / Math.PI;
  return degrees < 0 ? degrees + 360 : degrees;
}

/** Threshold the summed field into dots, then paint each cell that has dots as braille in its blended colour. */
export function paintMetaballs(surface: Surface, blobs: readonly DotBlob[]): void {
  const gridW = surface.width * 2;
  const grid = new Uint8Array(gridW * surface.height * 4);
  for (let y = 0; y < surface.height * 4; y += 1) {
    for (let x = 0; x < gridW; x += 1) {
      let sum = 0;
      for (const blob of blobs) sum += influence(blob, x, y);
      if (sum >= 1) grid[y * gridW + x] = 1;
    }
  }
  for (let cy = 0; cy < surface.height; cy += 1) {
    for (let cx = 0; cx < surface.width; cx += 1) {
      const mask = brailleMask(grid, gridW, cx, cy);
      if (mask === 0) continue;
      const hue = blendedHue(blobs, cx * 2 + 1, cy * 4 + 2);
      const fg = hslToRgb(hue, 95, 60);
      const bg = hslToRgb(hue + 30, 95, 12);
      surface.setRGB(cx, cy, String.fromCharCode(0x2800 + mask), fg.r, fg.g, fg.b, bg.r, bg.g, bg.b);
    }
  }
}
