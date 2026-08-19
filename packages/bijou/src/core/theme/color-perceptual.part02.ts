import {
  normalizeHue,
  oklabToLinearSrgb,
  oklchToOklab,
  type Oklch,
} from './color-perceptual.part01.js';

const GAMUT_EPSILON = 1e-7;
const SEARCH_STEPS = 32;

function finiteColor(color: Oklch): boolean {
  return Number.isFinite(color.l) && Number.isFinite(color.c) && Number.isFinite(color.h);
}

function assertFinite(label: string, values: readonly number[]): void {
  if (!values.every(Number.isFinite)) throw new Error(`${label} must use finite numbers`);
}

/** Whether an OKLCH colour can be represented without clipping in sRGB. */
export function isOklchInSrgb(color: Oklch): boolean {
  if (!finiteColor(color) || color.l < 0 || color.l > 1 || color.c < 0) return false;
  const linear = oklabToLinearSrgb(oklchToOklab(color));
  return linear.every((channel) => channel >= -GAMUT_EPSILON && channel <= 1 + GAMUT_EPSILON);
}

/** Maximum in-gamut sRGB chroma at one OKLCH lightness and hue. */
export function maxSrgbChroma(lightness: number, hue: number): number {
  assertFinite('OKLCH gamut coordinates', [lightness, hue]);
  const l = Math.max(0, Math.min(1, lightness));
  const h = normalizeHue(hue);
  if (l === 0 || l === 1) return 0;
  let low = 0;
  let high = 0.5;
  for (let step = 0; step < SEARCH_STEPS; step++) {
    const middle = (low + high) / 2;
    if (isOklchInSrgb({ l, c: middle, h })) low = middle;
    else high = middle;
  }
  return low;
}

/**
 * Map into sRGB by preserving OKLCH lightness and hue and reducing chroma.
 * Lightness outside the normalized OKLAB range is clamped before mapping.
 */
export function gamutMapOklch(color: Oklch): Oklch {
  if (!finiteColor(color)) throw new Error('OKLCH channels must be finite numbers');
  if (isOklchInSrgb(color)) return color;
  const l = Math.max(0, Math.min(1, color.l));
  const h = normalizeHue(color.h);
  const c = Math.max(0, Math.min(color.c, maxSrgbChroma(l, h)));
  return { l, c, h };
}

/** Construct OKLCH chroma as a normalized fraction of the local sRGB shell. */
export function gamutRelativeOklch(lightness: number, relativeChroma: number, hue: number): Oklch {
  assertFinite('Gamut-relative OKLCH coordinates', [lightness, relativeChroma, hue]);
  const l = Math.max(0, Math.min(1, lightness));
  const h = normalizeHue(hue);
  const relC = Math.max(0, Math.min(1, relativeChroma));
  return { l, c: maxSrgbChroma(l, h) * relC, h };
}

export type HueInterpolationPath = 'shorter' | 'longer';

/** Interpolate degrees around the hue circle along an explicit arc. */
export function interpolateHue(
  from: number,
  to: number,
  progress: number,
  path: HueInterpolationPath = 'shorter',
): number {
  assertFinite('Hue interpolation coordinates', [from, to, progress]);
  const start = normalizeHue(from);
  const end = normalizeHue(to);
  const t = Math.max(0, Math.min(1, progress));
  let delta = ((end - start + 540) % 360) - 180;
  if (path === 'longer' && Math.abs(delta) > 1e-12) {
    delta += delta > 0 ? -360 : 360;
  }
  return normalizeHue(start + delta * t);
}
