import { type Surface } from '@flyingrobots/bijou';
import type { RenderMiddleware } from '../pipeline.js';
import { shadeSurface } from './surface-shaders.part02.js';
import {
  clampFactor,
  lerp,
  normalizedNoise,
} from './surface-shaders.part03.js';

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
export function scanlines(options: ScanlinesShaderOptions = {}): SurfaceShader {
  const dimFactor = clampFactor(options.dimFactor ?? 0.78);
  const startBright = options.startBright ?? true;

  return (surface, context) => {
    shadeSurface(surface, context, (_x, y) => {
      const dimmedRow = startBright ? y % 2 === 1 : y % 2 === 0;
      return dimmedRow ? dimFactor : 1;
    });
  };
}
export function flicker(options: FlickerShaderOptions = {}): SurfaceShader {
  const minFactor = clampFactor(options.minFactor ?? 0.94);
  const maxFactor = clampFactor(options.maxFactor ?? 1.04);

  return (surface, context) => {
    const t = normalizedNoise(0, 0, context.frame);
    const factor = lerp(minFactor, maxFactor, t);
    shadeSurface(surface, context, () => factor);
  };
}
export function noise(options: NoiseShaderOptions = {}): SurfaceShader {
  const intensity = Math.max(0, Math.min(options.intensity ?? 0.12, 1));

  return (surface, context) => {
    shadeSurface(surface, context, (x, y) => {
      const centered = (normalizedNoise(x, y, context.frame) - 0.5) * 2;
      return clampFactor(1 + centered * intensity);
    });
  };
}
