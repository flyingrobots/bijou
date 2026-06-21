import { noise, tokenCell } from './transition-shaders.part01.js';

import type { TransitionShaderFn } from './transition-shaders.part01.js';
export function curtain(direction: 'horizontal' | 'vertical' = 'vertical'): TransitionShaderFn {
  return ({ x, y, width, height, progress }) => {
    const pos = direction === 'vertical' ? x / width : y / height;
    const distFromCenter = Math.abs(pos - 0.5) * 2; // 0 at center, 1 at edges
    return { showNext: progress >= 1 || distFromCenter < progress };
  };
}
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
      const char = chars.charAt(Math.min(Math.floor(rand * chars.length), chars.length - 1));
      return { showNext: false, overrideChar: char, overrideRole: 'decoration' as const };
    }
    return { showNext };
  };
}
export function typewriter(cursor = '▌'): TransitionShaderFn {
  return ({ x, y, width, height, progress, ctx }) => {
    const totalCells = width * height;
    const revealed = Math.floor(progress * totalCells);
    const cellIndex = y * width + x;
    if (cellIndex < revealed) return { showNext: true };
    if (cellIndex === revealed) {
      return {
        showNext: false,
        overrideChar: cursor,
        overrideCell: tokenCell(cursor, ctx.status('info')),
        overrideRole: 'marker',
      };
    }
    return { showNext: false };
  };
}
export function glitch(intensity = 0.5): TransitionShaderFn {
  return ({ x, y, progress, frame, ctx }) => {
    // Glitch peaks at midpoint, ramps up then down
    const glitchAmount = (1 - Math.abs(progress - 0.5) * 2) * intensity;
    const rowNoise = noise(0, y, frame * 0.3);

    // Selected rows show block-char corruption across all their cells
    if (rowNoise < glitchAmount * 0.6) {
      const glitchChars = '▓░▒█▄▀';
      const n = noise(x, y, frame);
      const char = glitchChars.charAt(Math.min(Math.floor(n * glitchChars.length), glitchChars.length - 1));
      return {
        showNext: false,
        overrideChar: char,
        overrideCell: tokenCell(char, ctx.status('error')),
        overrideRole: 'decoration' as const,
      };
    }

    // Scattered cells get individual scramble
    const cellNoise = noise(x, y, frame * 0.5);
    if (cellNoise < glitchAmount * 0.3) {
      const glitchChars = '▓░▒█▄▀╪╫╬';
      const char = glitchChars.charAt(Math.min(Math.floor(cellNoise * 100) % glitchChars.length, glitchChars.length - 1));
      return {
        showNext: false,
        overrideChar: char,
        overrideCell: tokenCell(char, ctx.status('warning')),
        overrideRole: 'decoration' as const,
      };
    }

    return { showNext: progress > 0.5 };
  };
}
