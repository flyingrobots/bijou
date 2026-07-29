import { type Surface } from '@flyingrobots/bijou';
import { type SurfaceShaderContext } from './surface-shaders.part01.js';
import { type BrightnessFactorFn } from './surface-shaders.part02.js';

export function shadeCellSurface(
  surface: Surface,
  context: SurfaceShaderContext,
  factorForCell: BrightnessFactorFn,
): void {
  for (let y = 0; y < surface.height; y++) {
    for (let x = 0; x < surface.width; x++) {
      const factor = factorForCell(x, y, context);
      if (factor === 1) continue;

      const cell = surface.get(x, y);
      const fgHex = typeof cell.fg === 'string' ? cell.fg : cell.fg?.hex;
      const bgHex = typeof cell.bg === 'string' ? cell.bg : cell.bg?.hex;
      const nextFg = fgHex ? shadeHex(fgHex, factor) : undefined;
      const nextBg = bgHex ? shadeHex(bgHex, factor) : undefined;

      if (nextFg !== cell.fg || nextBg !== cell.bg) {
        surface.set(x, y, { ...cell, fg: nextFg, bg: nextBg });
      }
    }
  }
}
export function shadeHex(hex: string, factor: number): string {
  if (hex.length !== 7 || !hex.startsWith('#')) return hex;

  const digits = hex.slice(1);
  if (!/^[0-9A-Fa-f]{6}$/.test(digits)) return hex;

  const r = parseInt(digits.slice(0, 2), 16);
  const g = parseInt(digits.slice(2, 4), 16);
  const b = parseInt(digits.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return hex;

  return rgbToHex(
    shadeChannel(r, factor),
    shadeChannel(g, factor),
    shadeChannel(b, factor),
  );
}
export function shadeChannel(value: number, factor: number): number {
  return Math.max(0, Math.min(255, Math.round(value * factor)));
}
export function rgbToHex(r: number, g: number, b: number): string {
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
export function toHex(value: number): string {
  return value.toString(16).padStart(2, '0');
}
export function clampFactor(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.max(0, Math.min(value, 2));
}
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}
export function normalizedNoise(x: number, y: number, frame: number): number {
  let value = Math.imul(x + 1, 374761393);
  value = (value + Math.imul(y + 1, 668265263)) >>> 0;
  value = (value + Math.imul(frame + 1, 982451653)) >>> 0;
  value ^= value >>> 13;
  value = Math.imul(value, 1274126177) >>> 0;
  value ^= value >>> 16;
  return value / 0xffffffff;
}
