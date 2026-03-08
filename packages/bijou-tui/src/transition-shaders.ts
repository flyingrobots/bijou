/**
 * Transition shader system — composable pure functions for page transitions.
 *
 * Each shader receives cell metadata (position, dimensions, progress, random,
 * frame counter) and returns whether to show the next page or optionally
 * override the character.
 *
 * ## Shader types
 *
 * - **Instances** (`wipeShader`, `dissolveShader`, …) — zero-config, ready to use.
 * - **Factories** (`wipe()`, `radial()`, `blinds()`, …) — parameterized, return a shader.
 * - **Combinators** (`reverse()`, `chain()`, `overlay()`) — transform or compose shaders.
 */

import type { BijouContext } from '@flyingrobots/bijou';

// ---------------------------------------------------------------------------
// Core types
// ---------------------------------------------------------------------------

/** Input provided to a transition shader for each cell. */
export interface TransitionCell {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly progress: number;
  /** Stable pseudo-random [0, 1] based on coordinates — constant across frames. */
  readonly rand: number;
  /** Monotonic frame counter for temporal effects (glitch, static, etc.). */
  readonly frame: number;
  readonly ctx: BijouContext;
}

/**
 * Semantic role of a character override.
 *
 * - `'decoration'` — ambient visual noise (glitch blocks, static, scramble).
 *   Survives progress remapping in combinators like `reverse()` and `chain()`.
 * - `'marker'` — positional indicator tied to the shader's progress direction
 *   (e.g., typewriter cursor). Dropped by combinators that remap progress,
 *   since the marker's position becomes meaningless in the new space.
 */
export type CharRole = 'decoration' | 'marker';

/** Output from a transition shader for a single cell. */
export interface TransitionResult {
  readonly showNext: boolean;
  readonly char?: string;
  /** Semantic role of the char override. Defaults to `'decoration'` if omitted. */
  readonly charRole?: CharRole;
}

/** A pure function that determines how each cell transitions between pages. */
export type TransitionShaderFn = (cell: TransitionCell) => TransitionResult;

/** Direction for axis-aligned wipes and blinds. */
export type WipeDirection = 'left' | 'right' | 'up' | 'down';

/** Built-in transition names. */
export type BuiltinTransition =
  | 'none'
  | 'wipe'
  | 'dissolve'
  | 'grid'
  | 'fade'
  | 'melt'
  | 'matrix'
  | 'scramble'
  | 'radial'
  | 'diamond'
  | 'spiral'
  | 'blinds'
  | 'curtain'
  | 'pixelate'
  | 'typewriter'
  | 'glitch'
  | 'static';

// ---------------------------------------------------------------------------
// Pseudo-random helpers
// ---------------------------------------------------------------------------

/** Hash-based pseudo-random that incorporates spatial + temporal seeds. */
function noise(x: number, y: number, seed: number): number {
  // Constant offset (7.31) breaks the degenerate fixed point at (0, 0, 0).
  const v = Math.sin(x * 12.9898 + y * 78.233 + seed * 43.7585 + 7.31) * 43758.5453;
  return v - Math.floor(v);
}

// ---------------------------------------------------------------------------
// Original shaders (backward-compatible instances)
// ---------------------------------------------------------------------------

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
    const char = chars[Math.min(Math.floor(rand * 100) % chars.length, chars.length - 1)]!;
    return { showNext: false, char: ctx.style.styled(ctx.status('success'), char) };
  }
  return { showNext: false };
};

/** Scramble noise that resolves at midpoint. */
export const scrambleShader: TransitionShaderFn = ({ rand, progress, ctx }) => {
  const scrambleAmount = 1 - Math.abs(progress - 0.5) * 2;
  if (rand < scrambleAmount * 0.8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    const char = chars[Math.min(Math.floor(rand * 1000) % chars.length, chars.length - 1)]!;
    return { showNext: false, char: ctx.style.styled(ctx.semantic('muted'), char) };
  }
  return { showNext: progress > 0.5 };
};

// ---------------------------------------------------------------------------
// Shader factories
// ---------------------------------------------------------------------------

/** Directional wipe factory. Default: left-to-right. */
export function wipe(direction: WipeDirection = 'right'): TransitionShaderFn {
  return ({ x, y, width, height, progress }) => {
    const t = direction === 'right' ? x / width
      : direction === 'left' ? 1 - x / width
        : direction === 'down' ? y / height
          : 1 - y / height;
    return { showNext: t < progress };
  };
}

/** Circle expanding from an origin point. Default: center. */
export function radial(originX = 0.5, originY = 0.5): TransitionShaderFn {
  return ({ x, y, width, height, progress }) => {
    // Normalize to [0, 1] space, accounting for 2:1 character aspect ratio
    const nx = x / width;
    const ny = y / height;
    const aspect = width / Math.max(1, height) * 0.5; // chars are ~2:1 tall
    const dx = (nx - originX) * aspect;
    const dy = ny - originY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    // Max possible distance (corner to origin) for normalization
    const maxDist = Math.sqrt(
      Math.max(originX, 1 - originX) ** 2 * aspect * aspect
      + Math.max(originY, 1 - originY) ** 2,
    );
    return { showNext: progress >= 1 || dist / maxDist < progress };
  };
}

/** Diamond/rhombus shape expanding from center. */
export function diamond(originX = 0.5, originY = 0.5): TransitionShaderFn {
  return ({ x, y, width, height, progress }) => {
    const nx = x / width;
    const ny = y / height;
    const aspect = width / Math.max(1, height) * 0.5;
    const dx = Math.abs(nx - originX) * aspect;
    const dy = Math.abs(ny - originY);
    const dist = dx + dy; // Manhattan distance
    const maxDist = Math.max(originX, 1 - originX) * aspect
      + Math.max(originY, 1 - originY);
    return { showNext: progress >= 1 || dist / maxDist < progress };
  };
}

/** Angular sweep that spirals outward from center. */
export function spiral(turns = 3, originX = 0.5, originY = 0.5): TransitionShaderFn {
  return ({ x, y, width, height, progress }) => {
    const nx = x / width;
    const ny = y / height;
    const aspect = width / Math.max(1, height) * 0.5;
    const dx = (nx - originX) * aspect;
    const dy = ny - originY;
    const angle = (Math.atan2(dy, dx) / (2 * Math.PI) + 0.5) % 1; // [0, 1]
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = Math.sqrt(
      Math.max(originX, 1 - originX) ** 2 * aspect * aspect
      + Math.max(originY, 1 - originY) ** 2,
    );
    const normDist = dist / maxDist;
    // Combine angle + distance into a spiral threshold
    const spiralT = (angle + normDist * turns) % 1;
    return { showNext: spiralT < progress };
  };
}

/** Venetian blinds (horizontal or vertical bands). */
export function blinds(
  count = 8,
  direction: 'horizontal' | 'vertical' = 'horizontal',
): TransitionShaderFn {
  return ({ x, y, width, height, progress }) => {
    const pos = direction === 'horizontal' ? y / height : x / width;
    const band = (pos * count) % 1;
    return { showNext: band < progress };
  };
}

/** Two halves sliding apart from center (vertical split). */
export function curtain(direction: 'horizontal' | 'vertical' = 'vertical'): TransitionShaderFn {
  return ({ x, y, width, height, progress }) => {
    const pos = direction === 'vertical' ? x / width : y / height;
    const distFromCenter = Math.abs(pos - 0.5) * 2; // 0 at center, 1 at edges
    return { showNext: progress >= 1 || distFromCenter < progress };
  };
}

/** Progressively shrinking block pixelation that resolves to the next page. */
export function pixelate(maxBlockSize = 16): TransitionShaderFn {
  return ({ x, y, progress, rand }) => {
    // Phase 1 (0–0.5): pixelate the previous page with growing blocks
    // Phase 2 (0.5–1): de-pixelate to reveal next page with shrinking blocks
    const showNext = progress > 0.5;
    const phase = showNext ? 1 - (progress - 0.5) * 2 : progress * 2;
    const blockSize = Math.max(1, Math.round(phase * maxBlockSize));
    const bx = Math.floor(x / blockSize);
    const by = Math.floor(y / blockSize);
    // Stable random per block
    const blockRand = noise(bx, by, 0);
    // Within each block, either all show or all hide (pixelation effect)
    if (blockSize <= 1) return { showNext };
    const scramble = phase > 0.3 && blockRand < phase * 0.6;
    if (scramble) {
      const chars = '░▒▓█';
      const char = chars[Math.min(Math.floor(rand * chars.length), chars.length - 1)]!;
      return { showNext: false, char };
    }
    return { showNext };
  };
}

/**
 * Left-to-right, top-to-bottom typewriter reveal.
 * Shows a cursor character at the leading edge.
 */
export function typewriter(cursor = '▌'): TransitionShaderFn {
  return ({ x, y, width, height, progress, ctx }) => {
    const totalCells = width * height;
    const revealed = Math.floor(progress * totalCells);
    const cellIndex = y * width + x;
    if (cellIndex < revealed) return { showNext: true };
    if (cellIndex === revealed) {
      return { showNext: false, char: ctx.style.styled(ctx.status('info'), cursor), charRole: 'marker' };
    }
    return { showNext: false };
  };
}

/**
 * Horizontal glitch displacement with RGB-split-style character noise.
 * Uses the frame counter for temporal variation.
 */
export function glitch(intensity = 0.5): TransitionShaderFn {
  return ({ x, y, progress, frame, ctx }) => {
    // Glitch peaks at midpoint, ramps up then down
    const glitchAmount = (1 - Math.abs(progress - 0.5) * 2) * intensity;
    const rowNoise = noise(0, y, frame * 0.3);

    // Selected rows show block-char corruption across all their cells
    if (rowNoise < glitchAmount * 0.6) {
      const glitchChars = '▓░▒█▄▀';
      const n = noise(x, y, frame);
      const char = glitchChars[Math.min(Math.floor(n * glitchChars.length), glitchChars.length - 1)]!;
      return { showNext: false, char: ctx.style.styled(ctx.status('error'), char) };
    }

    // Scattered cells get individual scramble
    const cellNoise = noise(x, y, frame * 0.5);
    if (cellNoise < glitchAmount * 0.3) {
      const glitchChars = '▓░▒█▄▀╪╫╬';
      const char = glitchChars[Math.min(Math.floor(cellNoise * 100) % glitchChars.length, glitchChars.length - 1)]!;
      return { showNext: false, char: ctx.style.styled(ctx.status('warning'), char) };
    }

    return { showNext: progress > 0.5 };
  };
}

/**
 * TV static noise that clears to reveal the next page.
 * Uses the frame counter for flickering.
 */
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
      const char = chars[Math.min(Math.floor(intensity * chars.length), chars.length - 1)]!;
      return { showNext: false, char: ctx.style.styled(ctx.semantic('muted'), char) };
    }

    return { showNext: progress > 0.5 };
  };
}

// ---------------------------------------------------------------------------
// Default instances for the new shaders (zero-config)
// ---------------------------------------------------------------------------

/** Circle expanding from center. */
export const radialShader: TransitionShaderFn = radial();

/** Diamond expanding from center. */
export const diamondShader: TransitionShaderFn = diamond();

/** Spiral sweep from center. */
export const spiralShader: TransitionShaderFn = spiral();

/** 8-band horizontal blinds. */
export const blindsShader: TransitionShaderFn = blinds();

/** Vertical curtain split from center. */
export const curtainShader: TransitionShaderFn = curtain();

/** Block pixelation with 16px max block size. */
export const pixelateShader: TransitionShaderFn = pixelate();

/** Typewriter reveal with ▌ cursor. */
export const typewriterShader: TransitionShaderFn = typewriter();

/** Horizontal glitch at 50% intensity. */
export const glitchShader: TransitionShaderFn = glitch();

/** TV static noise at 70% density. */
export const staticShader: TransitionShaderFn = tvStatic();

// ---------------------------------------------------------------------------
// Combinators
// ---------------------------------------------------------------------------

/**
 * Reverse a shader's spatial reveal order.
 *
 * Cells that would be revealed last are revealed first, and vice versa.
 * At progress=0 nothing is revealed; at progress=1 everything is revealed.
 */
export function reverse(shader: TransitionShaderFn): TransitionShaderFn {
  return (cell) => {
    const result = shader({ ...cell, progress: 1 - cell.progress });
    // Marker chars (e.g., typewriter cursor) are positional — they become
    // stale when progress is remapped. Decoration chars (glitch noise,
    // static blocks) are ambient and survive the reversal.
    const keepChar = result.char !== undefined && result.charRole !== 'marker';
    return keepChar
      ? { showNext: !result.showNext, char: result.char, charRole: result.charRole }
      : { showNext: !result.showNext };
  };
}

/**
 * Chain two shaders sequentially: `a` runs during progress [0, 0.5],
 * `b` runs during (0.5, 1]. Each sub-shader receives a normalized 0→1
 * progress for its half.
 *
 * **Note:** There is a hard cut at the midpoint — shader `a` completes
 * (all cells revealed) then shader `b` starts from scratch (no cells
 * revealed). This is intentional for effects like "dissolve out → wipe in"
 * but will flash if both shaders reveal in the same direction.
 */
export function chain(a: TransitionShaderFn, b: TransitionShaderFn): TransitionShaderFn {
  return (cell) => {
    if (cell.progress <= 0.5) {
      return a({ ...cell, progress: cell.progress * 2 });
    }
    return b({ ...cell, progress: (cell.progress - 0.5) * 2 });
  };
}

/**
 * Overlay two shaders: `top` shader's char override wins when present,
 * otherwise falls through to `base` shader's result.
 */
export function overlay(base: TransitionShaderFn, top: TransitionShaderFn): TransitionShaderFn {
  return (cell) => {
    const topResult = top(cell);
    if (topResult.char !== undefined) return topResult;
    const baseResult = base(cell);
    return {
      showNext: topResult.showNext || baseResult.showNext,
      char: baseResult.char,
      charRole: baseResult.charRole,
    };
  };
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

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
