import { ANSI16_PALETTE, ansi256ToRgb, colorDistance } from './downsample.part01.js';
export function rgbToAnsi16(r: number, g: number, b: number): number {
  let bestIdx = 0;
  let bestDist = Infinity;

  for (let i = 0; i < ANSI16_PALETTE.length; i++) {
    const candidate = ANSI16_PALETTE[i];
    if (candidate === undefined) continue;
    const [pr, pg, pb] = candidate;
    const dist = colorDistance(r, g, b, pr, pg, pb);
    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = i;
    }
  }

  return bestIdx;
}
export function ansi256ToAnsi16(code: number): number {
  const clamped = Math.max(0, Math.min(255, Math.round(code)));
  // Standard colors pass through
  if (clamped < 16) return clamped;

  const [r, g, b] = ansi256ToRgb(clamped);
  return rgbToAnsi16(r, g, b);
}
