import type { RGB } from './tokens.js';
export interface ResolvedColor {
  readonly kind: 'resolved-color';
  readonly hex: string;
  readonly rgb: RGB;
}
export type ColorRef = string | ResolvedColor;
export function color(hex: string): ColorRef {
  return hex;
}
export function isResolvedColor(value: unknown): value is ResolvedColor {
  if (typeof value !== 'object' || value === null || !('kind' in value) || value.kind !== 'resolved-color') return false;
  if (!('hex' in value) || typeof value.hex !== 'string' || !('rgb' in value)) return false;
  const rgb = value.rgb;
  return Array.isArray(rgb) && rgb.length === 3
    && typeof rgb[0] === 'number' && typeof rgb[1] === 'number' && typeof rgb[2] === 'number';
}
export function resolveColor(ref: ColorRef): ResolvedColor {
  if (isResolvedColor(ref)) return ref;
  const rgb = hexToRgb(ref);
  return {
    kind: 'resolved-color',
    hex: rgbToHex(rgb),
    rgb,
  };
}
export function tryResolveColor(ref: ColorRef | undefined): ResolvedColor | undefined {
  if (ref == null) return undefined;
  if (isResolvedColor(ref)) return ref;
  const rgb = tryHexToRgb(ref);
  if (rgb == null) return undefined;
  return {
    kind: 'resolved-color',
    hex: rgbToHex(rgb),
    rgb,
  };
}
export function colorHex(ref: ColorRef | undefined): string | undefined {
  if (ref == null) return undefined;
  return isResolvedColor(ref) ? ref.hex : ref;
}
export function colorRgb(ref: ColorRef | undefined): RGB | undefined {
  return tryResolveColor(ref)?.rgb;
}
export function hexToRgb(hex: string): RGB {
  let h = hex.startsWith('#') ? hex.slice(1) : hex;
  if (h.length === 3) {
    h = h.split('').map((ch) => ch + ch).join('');
  }
  if (h.length !== 6 || !/^[0-9a-f]{6}$/i.test(h)) {
    throw new Error(`Invalid hex color: "${hex}"`);
  }
  const n = parseInt(h, 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}
export function tryHexToRgb(hex: string): RGB | undefined {
  try {
    return hexToRgb(hex);
  } catch {
    return undefined;
  }
}
export function rgbToHex(rgb: RGB): string {
  const r = Math.max(0, Math.min(255, Math.round(rgb[0])));
  const g = Math.max(0, Math.min(255, Math.round(rgb[1])));
  const b = Math.max(0, Math.min(255, Math.round(rgb[2])));
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}
export function rgbToHsl(rgb: RGB): [number, number, number] {
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
