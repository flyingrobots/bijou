import type { RGB, TokenValue } from './tokens.js';

import { hexToRgb, rgbToHex, rgbToHsl } from './color.part01.js';
export function hue2rgb(p: number, q: number, t: number): number {
  let tt = t;
  if (tt < 0) tt += 1;
  if (tt > 1) tt -= 1;
  if (tt < 1 / 6) return p + (q - p) * 6 * tt;
  if (tt < 1 / 2) return q;
  if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
  return p;
}
export function hslToRgb(h: number, s: number, l: number): RGB {
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
export function clampAmount(amount: number): number {
  return Math.max(0, Math.min(1, amount));
}
export function withHex(token: TokenValue, hex: string): TokenValue {
  return token.modifiers
    ? { hex, modifiers: [...token.modifiers] }
    : { hex };
}
export function lighten(token: TokenValue, amount: number): TokenValue {
  const t = clampAmount(amount);
  const [r, g, b] = hexToRgb(token.hex);
  return withHex(token, rgbToHex([
    r + (255 - r) * t,
    g + (255 - g) * t,
    b + (255 - b) * t,
  ]));
}
export function darken(token: TokenValue, amount: number): TokenValue {
  const t = clampAmount(amount);
  const [r, g, b] = hexToRgb(token.hex);
  return withHex(token, rgbToHex([
    r * (1 - t),
    g * (1 - t),
    b * (1 - t),
  ]));
}
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
export function complementary(token: TokenValue): TokenValue {
  const rgb = hexToRgb(token.hex);
  const [h, s, l] = rgbToHsl(rgb);
  const newH = (h + 0.5) % 1;
  return withHex(token, rgbToHex(hslToRgb(newH, s, l)));
}
export function saturate(token: TokenValue, amount: number): TokenValue {
  const t = clampAmount(amount);
  const rgb = hexToRgb(token.hex);
  const [h, s, l] = rgbToHsl(rgb);
  const newS = Math.min(1, s + (1 - s) * t);
  return withHex(token, rgbToHex(hslToRgb(h, newS, l)));
}
export function desaturate(token: TokenValue, amount: number): TokenValue {
  const t = clampAmount(amount);
  const rgb = hexToRgb(token.hex);
  const [h, s, l] = rgbToHsl(rgb);
  const newS = s * (1 - t);
  return withHex(token, rgbToHex(hslToRgb(h, newS, l)));
}
