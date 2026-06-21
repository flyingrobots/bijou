import { dissolveShader, noise, tokenCell, wipeShader } from './transition-shaders.part01.js';

import type { BuiltinTransition, TransitionShaderFn } from './transition-shaders.part01.js';

import { blinds, diamond, fadeShader, gridShader, matrixShader, meltShader, radial, scrambleShader, spiral } from './transition-shaders.part02.js';

import { curtain, glitch, pixelate, typewriter } from './transition-shaders.part03.js';
export function tvStatic(density = 0.7): TransitionShaderFn {
  return ({ x, y, progress, frame, ctx }) => {
    // Static covers the screen then clears to reveal next page
    // Phase 1 (0–0.3): static fades in over previous page
    // Phase 2 (0.3–0.7): full static
    // Phase 3 (0.7–1): static clears to reveal next page
    const staticAmount = progress < 0.3
      ? progress / 0.3
      : progress > 0.7
        ? (1 - progress) / 0.3
        : 1;

    const cellNoise = noise(x, y, frame);
    if (cellNoise < staticAmount * density) {
      const intensity = noise(x + 1, y + 1, frame);
      const chars = ' ░▒▓█';
      const char = chars.charAt(Math.min(Math.floor(intensity * chars.length), chars.length - 1));
      return {
        showNext: false,
        overrideChar: char,
        overrideCell: tokenCell(char, ctx.semantic('muted')),
        overrideRole: 'decoration' as const,
      };
    }

    return { showNext: progress > 0.5 };
  };
}
export const radialShader: TransitionShaderFn = radial();
export const diamondShader: TransitionShaderFn = diamond();
export const spiralShader: TransitionShaderFn = spiral();
export const blindsShader: TransitionShaderFn = blinds();
export const curtainShader: TransitionShaderFn = curtain();
export const pixelateShader: TransitionShaderFn = pixelate();
export const typewriterShader: TransitionShaderFn = typewriter();
export const glitchShader: TransitionShaderFn = glitch();
export const staticShader: TransitionShaderFn = tvStatic();
export function reverse(shader: TransitionShaderFn): TransitionShaderFn {
  return (cell) => {
    const result = shader({ ...cell, progress: 1 - cell.progress });
    // Marker overrides (e.g., typewriter cursor) are positional — they become
    // stale when progress is remapped. Decoration overrides (glitch noise,
    // static blocks) are ambient and survive the reversal.
    const keepOverride = (result.overrideChar !== undefined || result.overrideCell !== undefined)
      && result.overrideRole !== 'marker';
    return keepOverride
      ? {
        showNext: !result.showNext,
        overrideChar: result.overrideChar,
        overrideCell: result.overrideCell,
        overrideRole: result.overrideRole,
      }
      : { showNext: !result.showNext };
  };
}
export function chain(a: TransitionShaderFn, b: TransitionShaderFn): TransitionShaderFn {
  return (cell) => {
    if (cell.progress <= 0.5) {
      return a({ ...cell, progress: cell.progress * 2 });
    }
    return b({ ...cell, progress: (cell.progress - 0.5) * 2 });
  };
}
export function overlay(base: TransitionShaderFn, top: TransitionShaderFn): TransitionShaderFn {
  return (cell) => {
    const topResult = top(cell);
    if (topResult.overrideChar !== undefined || topResult.overrideCell !== undefined) return topResult;
    const baseResult = base(cell);
    return {
      showNext: topResult.showNext || baseResult.showNext,
      overrideChar: baseResult.overrideChar,
      overrideCell: baseResult.overrideCell,
      overrideRole: baseResult.overrideRole,
    };
  };
}
export const TRANSITION_SHADERS: Record<BuiltinTransition, TransitionShaderFn | undefined> = {
  none: undefined,
  wipe: wipeShader,
  dissolve: dissolveShader,
  grid: gridShader,
  fade: fadeShader,
  melt: meltShader,
  matrix: matrixShader,
  scramble: scrambleShader,
  radial: radialShader,
  diamond: diamondShader,
  spiral: spiralShader,
  blinds: blindsShader,
  curtain: curtainShader,
  pixelate: pixelateShader,
  typewriter: typewriterShader,
  glitch: glitchShader,
  static: staticShader,
};
