/**
 * Transition shader system — composable pure functions for page transitions.
 *
 * Each shader receives cell metadata (position, dimensions, progress, random)
 * and returns whether to show the next page or optionally override the character.
 */

import type { BijouContext } from '@flyingrobots/bijou';

/** Input provided to a transition shader for each cell. */
export interface TransitionCell {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly progress: number;
  readonly rand: number;
  readonly ctx: BijouContext;
}

/** Output from a transition shader for a single cell. */
export interface TransitionResult {
  readonly showNext: boolean;
  readonly char?: string;
}

/** A pure function that determines how each cell transitions between pages. */
export type TransitionShaderFn = (cell: TransitionCell) => TransitionResult;

/** Built-in transition names. */
export type BuiltinTransition = 'none' | 'wipe' | 'dissolve' | 'grid' | 'fade' | 'melt' | 'matrix' | 'scramble';

/** Left-to-right wipe. */
export const wipeShader: TransitionShaderFn = ({ x, width, progress }) => ({
  showNext: x / width < progress,
});

/** Random pixel dissolve. */
export const dissolveShader: TransitionShaderFn = ({ rand, progress }) => ({
  showNext: rand < progress,
});

/** Checkerboard block reveal. */
export const gridShader: TransitionShaderFn = ({ x, y, progress }) => {
  const gx = Math.floor(x / 8);
  const gy = Math.floor(y / 4);
  return { showNext: ((gx + gy) % 10) / 10 < progress };
};

/** Hard cut at midpoint. */
export const fadeShader: TransitionShaderFn = ({ progress }) => ({
  showNext: progress > 0.5,
});

/** Doom-style top-down melt with per-column variation. */
export const meltShader: TransitionShaderFn = ({ x, y, height, progress }) => {
  const variability = (Math.sin(x * 0.7) * 0.5 + 0.5) * 0.4;
  const dropStart = progress * 1.4 - variability;
  return { showNext: y / height < dropStart };
};

/** Code rain leading edge with matrix characters. */
export const matrixShader: TransitionShaderFn = ({ rand, progress, ctx }) => {
  const threshold = progress;
  const edge = 0.1;
  if (rand < threshold) {
    return { showNext: true };
  }
  if (rand < threshold + edge) {
    const chars = '01$#@%&*';
    const char = chars[Math.floor(rand * 100) % chars.length]!;
    return { showNext: false, char: ctx.style.styled(ctx.status('success'), char) };
  }
  return { showNext: false };
};

/** Scramble noise that resolves at midpoint. */
export const scrambleShader: TransitionShaderFn = ({ rand, progress, ctx }) => {
  const scrambleAmount = 1 - Math.abs(progress - 0.5) * 2;
  if (rand < scrambleAmount * 0.8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    const char = chars[Math.floor(rand * 1000) % chars.length]!;
    return { showNext: false, char: ctx.style.styled(ctx.semantic('muted'), char) };
  }
  return { showNext: progress > 0.5 };
};

/** Registry mapping built-in transition names to shader functions. `none` maps to `undefined`. */
export const TRANSITION_SHADERS: Record<BuiltinTransition, TransitionShaderFn | undefined> = {
  none: undefined,
  wipe: wipeShader,
  dissolve: dissolveShader,
  grid: gridShader,
  fade: fadeShader,
  melt: meltShader,
  matrix: matrixShader,
  scramble: scrambleShader,
};
