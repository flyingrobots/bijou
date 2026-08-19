import type { RGB } from './tokens.js';

/** Perceptual rectangular colour in OKLAB using normalized lightness. */
export interface Oklab {
  readonly l: number;
  readonly a: number;
  readonly b: number;
}

/** Perceptual cylindrical colour in OKLCH; hue is expressed in degrees. */
export interface Oklch {
  readonly l: number;
  readonly c: number;
  readonly h: number;
}

type LinearSrgb = readonly [number, number, number];

function assertFinite(label: string, channels: readonly number[]): void {
  if (!channels.every(Number.isFinite)) throw new Error(`${label} channels must be finite numbers`);
}

function assertRgb(rgb: RGB): void {
  assertFinite('RGB', rgb);
  if (rgb.some((channel) => channel < 0 || channel > 255)) {
    throw new Error('RGB channels must be between 0 and 255');
  }
}

function assertOklab(color: Oklab): void {
  assertFinite('OKLAB', [color.l, color.a, color.b]);
}

function assertOklch(color: Oklch): void {
  assertFinite('OKLCH', [color.l, color.c, color.h]);
  if (color.c < 0) throw new Error('OKLCH chroma must be zero or greater');
}

function linearize(channel: number): number {
  const value = channel / 255;
  return value <= 0.04045
    ? value / 12.92
    : ((value + 0.055) / 1.055) ** 2.4;
}

function encode(channel: number): number {
  const value = channel <= 0.0031308
    ? 12.92 * channel
    : 1.055 * channel ** (1 / 2.4) - 0.055;
  return Math.round(Math.max(0, Math.min(1, value)) * 255);
}

/** Convert an 8-bit sRGB tuple into perceptual OKLAB coordinates. */
export function rgbToOklab(rgb: RGB): Oklab {
  assertRgb(rgb);
  const r = linearize(rgb[0]);
  const g = linearize(rgb[1]);
  const b = linearize(rgb[2]);
  const lRoot = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const mRoot = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const sRoot = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return {
    l: 0.2104542553 * lRoot + 0.793617785 * mRoot - 0.0040720468 * sRoot,
    a: 1.9779984951 * lRoot - 2.428592205 * mRoot + 0.4505937099 * sRoot,
    b: 0.0259040371 * lRoot + 0.7827717662 * mRoot - 0.808675766 * sRoot,
  };
}

/** Convert OKLAB to linear sRGB channels without gamut clipping. */
export function oklabToLinearSrgb(color: Oklab): LinearSrgb {
  assertOklab(color);
  const lRoot = color.l + 0.3963377774 * color.a + 0.2158037573 * color.b;
  const mRoot = color.l - 0.1055613458 * color.a - 0.0638541728 * color.b;
  const sRoot = color.l - 0.0894841775 * color.a - 1.291485548 * color.b;
  const l = lRoot ** 3;
  const m = mRoot ** 3;
  const s = sRoot ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

/** Convert OKLAB to a clipped 8-bit sRGB tuple. */
export function oklabToRgb(color: Oklab): RGB {
  const linear = oklabToLinearSrgb(color);
  return [encode(linear[0]), encode(linear[1]), encode(linear[2])];
}

/** Normalize a hue angle into the half-open range `[0, 360)`. */
export function normalizeHue(hue: number): number {
  if (!Number.isFinite(hue)) throw new Error('Hue must be a finite number');
  return ((hue % 360) + 360) % 360;
}

/** Convert rectangular OKLAB coordinates to cylindrical OKLCH. */
export function oklabToOklch(color: Oklab): Oklch {
  assertOklab(color);
  const c = Math.hypot(color.a, color.b);
  return {
    l: color.l,
    c,
    h: c < 1e-12 ? 0 : normalizeHue(Math.atan2(color.b, color.a) * 180 / Math.PI),
  };
}

/** Convert cylindrical OKLCH coordinates to rectangular OKLAB. */
export function oklchToOklab(color: Oklch): Oklab {
  assertOklch(color);
  const angle = normalizeHue(color.h) * Math.PI / 180;
  return { l: color.l, a: color.c * Math.cos(angle), b: color.c * Math.sin(angle) };
}

/** Convert an 8-bit sRGB tuple to OKLCH. */
export function rgbToOklch(rgb: RGB): Oklch {
  return oklabToOklch(rgbToOklab(rgb));
}

/** Convert OKLCH to a clipped 8-bit sRGB tuple. */
export function oklchToRgb(color: Oklch): RGB {
  return oklabToRgb(oklchToOklab(color));
}

/** Measure fast perceptual distance as Euclidean delta-E in OKLAB. */
export function deltaEOk(left: Oklab, right: Oklab): number {
  assertOklab(left);
  assertOklab(right);
  return Math.hypot(left.l - right.l, left.a - right.a, left.b - right.b);
}
