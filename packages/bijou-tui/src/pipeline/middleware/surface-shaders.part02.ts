import {
  isPackedSurface,
  type PackedSurface,
  type Surface,
} from '@flyingrobots/bijou';
import {
  CELL_STRIDE,
  FLAG_BG_SET,
  FLAG_FG_SET,
  OFF_ALPHA,
  OFF_BG_R,
  OFF_FG_R,
} from '@flyingrobots/bijou/perf';
import {
  type SurfaceShader,
  type SurfaceShaderContext,
  type VignetteShaderOptions,
} from './surface-shaders.part01.js';
import {
  clampFactor,
  lerp,
  rgbToHex,
  shadeCellSurface,
  shadeChannel,
} from './surface-shaders.part03.js';

export function vignette(options: VignetteShaderOptions = {}): SurfaceShader {
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
export type BrightnessFactorFn = (
  x: number,
  y: number,
  context: SurfaceShaderContext,
) => number;
export function shadeSurface(
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
export function shadePackedSurface(
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
      const a = buf[off + OFF_ALPHA];
      const cell = surface.cells[index];
      if (a == null || !cell) continue;

      if (a & FLAG_FG_SET) {
        const [r, g, b] = shadePackedRgb(buf, off + OFF_FG_R, factor);
        cell.fg = rgbToHex(r, g, b);
      }

      if (a & FLAG_BG_SET) {
        const [r, g, b] = shadePackedRgb(buf, off + OFF_BG_R, factor);
        cell.bg = rgbToHex(r, g, b);
      }
    }
  }

  surface.markAllDirty();
}
export function shadePackedRgb(
  buf: Uint8Array,
  start: number,
  factor: number,
): readonly [number, number, number] {
  const r = shadeChannel(buf[start] ?? 0, factor);
  const g = shadeChannel(buf[start + 1] ?? 0, factor);
  const b = shadeChannel(buf[start + 2] ?? 0, factor);
  buf[start] = r;
  buf[start + 1] = g;
  buf[start + 2] = b;
  return [r, g, b];
}
