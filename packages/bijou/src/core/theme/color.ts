/**
 * Color manipulation utilities for theme tokens.
 *
 * Provides conversion between hex and RGB, plus manipulation functions
 * (lighten, darken, mix, complementary, saturate, desaturate) that
 * preserve token modifiers.
 */

import type { RGB, TokenValue } from './tokens.js';

// ── Conversion ─────────────────────────────────────────────────────

/** Parse a hex color string to an RGB tuple. Supports `#RGB` and `#RRGGBB` (with or without `#`). */
export function hexToRgb(hex: string): RGB {
  let h = hex.startsWith('#') ? hex.slice(1) : hex;
  if (h.length === 3) {
    h = h[0]! + h[0]! + h[1]! + h[1]! + h[2]! + h[2]!;
  }
  if (h.length !== 6) {
    throw new Error(`Invalid hex color: "${hex}"`);
  }
  const n = parseInt(h, 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

/** Convert an RGB tuple to a `#rrggbb` hex string. */
export function rgbToHex(rgb: RGB): string {
  const r = Math.max(0, Math.min(255, Math.round(rgb[0])));
  const g = Math.max(0, Math.min(255, Math.round(rgb[1])));
  const b = Math.max(0, Math.min(255, Math.round(rgb[2])));
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

// ── Internal HSL helpers ───────────────────────────────────────────

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

function hue2rgb(p: number, q: number, t: number): number {
  let tt = t;
  if (tt < 0) tt += 1;
  if (tt > 1) tt -= 1;
  if (tt < 1 / 6) return p + (q - p) * 6 * tt;
  if (tt < 1 / 2) return q;
  if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
  return p;
}

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

function clampAmount(amount: number): number {
  return Math.max(0, Math.min(1, amount));
}

function withHex(token: TokenValue, hex: string): TokenValue {
  return token.modifiers
    ? { hex, modifiers: [...token.modifiers] }
    : { hex };
}

// ── Manipulation ───────────────────────────────────────────────────

/** Blend a token's color toward white by `amount` (0 = unchanged, 1 = white). */
export function lighten(token: TokenValue, amount: number): TokenValue {
  const t = clampAmount(amount);
  const [r, g, b] = hexToRgb(token.hex);
  return withHex(token, rgbToHex([
    r + (255 - r) * t,
    g + (255 - g) * t,
    b + (255 - b) * t,
  ]));
}

/** Blend a token's color toward black by `amount` (0 = unchanged, 1 = black). */
export function darken(token: TokenValue, amount: number): TokenValue {
  const t = clampAmount(amount);
  const [r, g, b] = hexToRgb(token.hex);
  return withHex(token, rgbToHex([
    r * (1 - t),
    g * (1 - t),
    b * (1 - t),
  ]));
}

/** Blend two token colors by `ratio` (0 = first, 1 = second, default 0.5). Preserves modifiers from the first token. */
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

/** Rotate hue by 180° to produce the complementary color. */
export function complementary(token: TokenValue): TokenValue {
  const rgb = hexToRgb(token.hex);
  const [h, s, l] = rgbToHsl(rgb);
  const newH = (h + 0.5) % 1;
  return withHex(token, rgbToHex(hslToRgb(newH, s, l)));
}

/** Increase saturation by `amount` (0 = unchanged, 1 = full saturation). */
export function saturate(token: TokenValue, amount: number): TokenValue {
  const t = clampAmount(amount);
  const rgb = hexToRgb(token.hex);
  const [h, s, l] = rgbToHsl(rgb);
  const newS = Math.min(1, s + (1 - s) * t);
  return withHex(token, rgbToHex(hslToRgb(h, newS, l)));
}

/** Decrease saturation by `amount` (0 = unchanged, 1 = fully desaturated). */
export function desaturate(token: TokenValue, amount: number): TokenValue {
  const t = clampAmount(amount);
  const rgb = hexToRgb(token.hex);
  const [h, s, l] = rgbToHsl(rgb);
  const newS = s * (1 - t);
  return withHex(token, rgbToHex(hslToRgb(h, newS, l)));
}
