import { isPackedSurface, type PackedSurface, type Surface } from '@flyingrobots/bijou';
import {
  CELL_STRIDE,
  FLAG_BG_SET,
  FLAG_FG_SET,
  OFF_ALPHA,
  OFF_BG_R,
  OFF_FG_R,
} from '@flyingrobots/bijou/perf';
import type { RenderMiddleware } from '../pipeline.js';

export interface SurfaceShaderContext {
  readonly frame: number;
  readonly dt: number;
  readonly width: number;
  readonly height: number;
}

export type SurfaceShader = (
  surface: Surface,
  context: SurfaceShaderContext,
) => void;

export interface ScanlinesShaderOptions {
  /** Brightness multiplier applied to dimmed rows. */
  readonly dimFactor?: number;
  /** Whether the first row stays bright and the second row dims. */
  readonly startBright?: boolean;
}

export interface FlickerShaderOptions {
  /** Minimum frame-wide brightness multiplier. */
  readonly minFactor?: number;
  /** Maximum frame-wide brightness multiplier. */
  readonly maxFactor?: number;
}

export interface NoiseShaderOptions {
  /** Maximum per-cell brightness variance around 1.0. */
  readonly intensity?: number;
}

export interface VignetteShaderOptions {
  /** Brightness multiplier applied at the outermost edge. */
  readonly edgeFactor?: number;
  /** Curve shaping factor for the edge falloff. */
  readonly exponent?: number;
}

export function surfaceShaderFilter(
  ...shaders: readonly SurfaceShader[]
): RenderMiddleware {
  let frame = 0;
  return (state, next) => {
    if (shaders.length === 0) {
      next();
      return;
    }

    frame += 1;
    const context: SurfaceShaderContext = {
      frame,
      dt: state.dt,
      width: state.targetSurface.width,
      height: state.targetSurface.height,
    };

    for (const shader of shaders) {
      shader(state.targetSurface, context);
    }

    next();
  };
}

export function scanlines(
  options: ScanlinesShaderOptions = {},
): SurfaceShader {
  const dimFactor = clampFactor(options.dimFactor ?? 0.78);
  const startBright = options.startBright ?? true;

  return (surface, context) => {
    shadeSurface(surface, context, (_x, y) => {
      const dimmedRow = startBright ? (y % 2 === 1) : (y % 2 === 0);
      return dimmedRow ? dimFactor : 1;
    });
  };
}

export function flicker(
  options: FlickerShaderOptions = {},
): SurfaceShader {
  const minFactor = clampFactor(options.minFactor ?? 0.94);
  const maxFactor = clampFactor(options.maxFactor ?? 1.04);

  return (surface, context) => {
    const t = normalizedNoise(0, 0, context.frame);
    const factor = lerp(minFactor, maxFactor, t);
    shadeSurface(surface, context, () => factor);
  };
}

export function noise(
  options: NoiseShaderOptions = {},
): SurfaceShader {
  const intensity = Math.max(0, Math.min(options.intensity ?? 0.12, 1));

  return (surface, context) => {
    shadeSurface(surface, context, (x, y) => {
      const centered = (normalizedNoise(x, y, context.frame) - 0.5) * 2;
      return clampFactor(1 + centered * intensity);
    });
  };
}

export function vignette(
  options: VignetteShaderOptions = {},
): SurfaceShader {
  const edgeFactor = clampFactor(options.edgeFactor ?? 0.72);
  const exponent = Math.max(0.1, options.exponent ?? 1.6);

  return (surface, context) => {
    const cx = (context.width - 1) / 2;
    const cy = (context.height - 1) / 2;
    const maxDistance = Math.max(1, Math.hypot(cx, cy));

    shadeSurface(surface, context, (x, y) => {
      const distance = Math.hypot(x - cx, y - cy) / maxDistance;
      const edgeBias = Math.pow(Math.min(1, distance), exponent);
      return lerp(1, edgeFactor, edgeBias);
    });
  };
}

type BrightnessFactorFn = (
  x: number,
  y: number,
  context: SurfaceShaderContext,
) => number;

function shadeSurface(
  surface: Surface,
  context: SurfaceShaderContext,
  factorForCell: BrightnessFactorFn,
): void {
  if (surface.width === 0 || surface.height === 0) return;

  if (isPackedSurface(surface)) {
    shadePackedSurface(surface, context, factorForCell);
    return;
  }

  shadeCellSurface(surface, context, factorForCell);
}

function shadePackedSurface(
  surface: PackedSurface,
  context: SurfaceShaderContext,
  factorForCell: BrightnessFactorFn,
): void {
  const buf = surface.buffer;
  const width = surface.width;
  const height = surface.height;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const factor = factorForCell(x, y, context);
      if (factor === 1) continue;

      const index = y * width + x;
      const off = index * CELL_STRIDE;
      const alpha = buf[off + OFF_ALPHA]!;
      const cell = surface.cells[index]!;

      if (alpha & FLAG_FG_SET) {
        const nextFg = shadePackedRgb(buf, off + OFF_FG_R, factor);
        cell.fg = rgbToHex(nextFg[0], nextFg[1], nextFg[2]);
      }

      if (alpha & FLAG_BG_SET) {
        const nextBg = shadePackedRgb(buf, off + OFF_BG_R, factor);
        cell.bg = rgbToHex(nextBg[0], nextBg[1], nextBg[2]);
      }
    }
  }

  surface.markAllDirty();
}

function shadePackedRgb(
  buf: Uint8Array,
  start: number,
  factor: number,
): readonly [number, number, number] {
  const r = shadeChannel(buf[start]!, factor);
  const g = shadeChannel(buf[start + 1]!, factor);
  const b = shadeChannel(buf[start + 2]!, factor);
  buf[start] = r;
  buf[start + 1] = g;
  buf[start + 2] = b;
  return [r, g, b] as const;
}

function shadeCellSurface(
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

function shadeHex(hex: string, factor: number): string {
  if (hex.length !== 7 || hex[0] !== '#') return hex;

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

function shadeChannel(value: number, factor: number): number {
  return Math.max(0, Math.min(255, Math.round(value * factor)));
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function toHex(value: number): string {
  return value.toString(16).padStart(2, '0');
}

function clampFactor(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.max(0, Math.min(value, 2));
}

function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

function normalizedNoise(x: number, y: number, frame: number): number {
  let value = Math.imul(x + 1, 374761393);
  value = (value + Math.imul(y + 1, 668265263)) >>> 0;
  value = (value + Math.imul(frame + 1, 982451653)) >>> 0;
  value ^= value >>> 13;
  value = Math.imul(value, 1274126177) >>> 0;
  value ^= value >>> 16;
  return value / 0xffffffff;
}
