/**
 * Color manipulation utilities for theme tokens.
 *
 * Provides conversion between hex and RGB, plus manipulation functions
 * (lighten, darken, mix, complementary, saturate, desaturate) that
 * preserve token modifiers.
 */

import type { RGB, TokenValue } from './tokens.js';

// ── Conversion ─────────────────────────────────────────────────────

/**
 * Parse a hex color string to an RGB tuple. Supports `#RGB` and `#RRGGBB` (with or without `#`).
 * @param hex - Hex color string to parse.
 * @returns Parsed RGB tuple.
 * @throws {Error} If the hex string is not a valid 3- or 6-digit hex color.
 */
export function hexToRgb(hex: string): RGB {
  let h = hex.startsWith('#') ? hex.slice(1) : hex;
  if (h.length === 3) {
    h = h[0]! + h[0]! + h[1]! + h[1]! + h[2]! + h[2]!;
  }
  if (h.length !== 6 || !/^[0-9a-f]{6}$/i.test(h)) {
    throw new Error(`Invalid hex color: "${hex}"`);
  }
  const n = parseInt(h, 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

/**
 * Convert an RGB tuple to a `#rrggbb` hex string.
 * @param rgb - RGB tuple to convert. Values are clamped to [0, 255].
 * @returns Lowercase hex string with leading `#`.
 */
export function rgbToHex(rgb: RGB): string {
  const r = Math.max(0, Math.min(255, Math.round(rgb[0])));
  const g = Math.max(0, Math.min(255, Math.round(rgb[1])));
  const b = Math.max(0, Math.min(255, Math.round(rgb[2])));
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

// ── Internal HSL helpers ───────────────────────────────────────────

/**
 * Convert an RGB tuple to HSL (hue, saturation, lightness), all in [0, 1].
 * @param rgb - Input RGB color.
 * @returns HSL triple with each component normalized to [0, 1].
 */
function rgbToHsl(rgb: RGB): [number, number, number] {
  const r = rgb[0] / 255;
  const g = rgb[1] / 255;
  const b = rgb[2] / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return [0, 0, l];

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h: number;
  if (max === r) {
    h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  } else if (max === g) {
    h = ((b - r) / d + 2) / 6;
  } else {
    h = ((r - g) / d + 4) / 6;
  }

  return [h, s, l];
}

/**
 * Convert a single HSL hue sector to an RGB channel value.
 * @param p - Lower bound from lightness calculation.
 * @param q - Upper bound from lightness calculation.
 * @param t - Hue offset for this channel.
 * @returns Channel value in [0, 1].
 */
function hue2rgb(p: number, q: number, t: number): number {
  let tt = t;
  if (tt < 0) tt += 1;
  if (tt > 1) tt -= 1;
  if (tt < 1 / 6) return p + (q - p) * 6 * tt;
  if (tt < 1 / 2) return q;
  if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
  return p;
}

/**
 * Convert HSL values to an RGB tuple.
 * @param h - Hue in [0, 1].
 * @param s - Saturation in [0, 1].
 * @param l - Lightness in [0, 1].
 * @returns RGB tuple with each channel in [0, 255].
 */
function hslToRgb(h: number, s: number, l: number): RGB {
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ];
}

// ── Token helpers ──────────────────────────────────────────────────

/**
 * Clamp a numeric amount to the [0, 1] range.
 * @param amount - Value to clamp.
 * @returns Clamped value.
 */
function clampAmount(amount: number): number {
  return Math.max(0, Math.min(1, amount));
}

/**
 * Create a new TokenValue with the given hex, preserving the original's modifiers.
 * @param token - Source token whose modifiers are carried over.
 * @param hex - New hex color string.
 * @returns New TokenValue with the updated hex.
 */
function withHex(token: TokenValue, hex: string): TokenValue {
  return token.modifiers
    ? { hex, modifiers: [...token.modifiers] }
    : { hex };
}

// ── Manipulation ───────────────────────────────────────────────────

/**
 * Blend a token's color toward white by `amount` (0 = unchanged, 1 = white).
 * @param token - Source token to lighten.
 * @param amount - Blend factor, clamped to [0, 1].
 * @returns New TokenValue with the lightened hex, preserving modifiers.
 */
export function lighten(token: TokenValue, amount: number): TokenValue {
  const t = clampAmount(amount);
  const [r, g, b] = hexToRgb(token.hex);
  return withHex(token, rgbToHex([
    r + (255 - r) * t,
    g + (255 - g) * t,
    b + (255 - b) * t,
  ]));
}

/**
 * Blend a token's color toward black by `amount` (0 = unchanged, 1 = black).
 * @param token - Source token to darken.
 * @param amount - Blend factor, clamped to [0, 1].
 * @returns New TokenValue with the darkened hex, preserving modifiers.
 */
export function darken(token: TokenValue, amount: number): TokenValue {
  const t = clampAmount(amount);
  const [r, g, b] = hexToRgb(token.hex);
  return withHex(token, rgbToHex([
    r * (1 - t),
    g * (1 - t),
    b * (1 - t),
  ]));
}

/**
 * Blend two token colors by `ratio` (0 = first, 1 = second, default 0.5). Preserves modifiers from the first token.
 * @param a - First token (its modifiers are preserved).
 * @param b - Second token.
 * @param ratio - Blend ratio, clamped to [0, 1]. Default is 0.5.
 * @returns New TokenValue with the blended hex.
 */
export function mix(a: TokenValue, b: TokenValue, ratio = 0.5): TokenValue {
  const t = clampAmount(ratio);
  const [ar, ag, ab] = hexToRgb(a.hex);
  const [br, bg, bb] = hexToRgb(b.hex);
  return withHex(a, rgbToHex([
    ar + (br - ar) * t,
    ag + (bg - ag) * t,
    ab + (bb - ab) * t,
  ]));
}

/**
 * Rotate hue by 180 degrees to produce the complementary color.
 * @param token - Source token.
 * @returns New TokenValue with the complementary hex, preserving modifiers.
 */
export function complementary(token: TokenValue): TokenValue {
  const rgb = hexToRgb(token.hex);
  const [h, s, l] = rgbToHsl(rgb);
  const newH = (h + 0.5) % 1;
  return withHex(token, rgbToHex(hslToRgb(newH, s, l)));
}

/**
 * Increase saturation by `amount` (0 = unchanged, 1 = full saturation).
 * @param token - Source token.
 * @param amount - Saturation increase factor, clamped to [0, 1].
 * @returns New TokenValue with the saturated hex, preserving modifiers.
 */
export function saturate(token: TokenValue, amount: number): TokenValue {
  const t = clampAmount(amount);
  const rgb = hexToRgb(token.hex);
  const [h, s, l] = rgbToHsl(rgb);
  const newS = Math.min(1, s + (1 - s) * t);
  return withHex(token, rgbToHex(hslToRgb(h, newS, l)));
}

/**
 * Decrease saturation by `amount` (0 = unchanged, 1 = fully desaturated).
 * @param token - Source token.
 * @param amount - Desaturation factor, clamped to [0, 1].
 * @returns New TokenValue with the desaturated hex, preserving modifiers.
 */
export function desaturate(token: TokenValue, amount: number): TokenValue {
  const t = clampAmount(amount);
  const rgb = hexToRgb(token.hex);
  const [h, s, l] = rgbToHsl(rgb);
  const newS = s * (1 - t);
  return withHex(token, rgbToHex(hslToRgb(h, newS, l)));
}
