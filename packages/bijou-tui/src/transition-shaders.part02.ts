import { computeOriginMetrics, tokenCell } from './transition-shaders.part01.js';

import type { TransitionShaderFn, WipeDirection } from './transition-shaders.part01.js';
export const gridShader: TransitionShaderFn = ({ x, y, progress }) => {
  const gx = Math.floor(x / 8);
  const gy = Math.floor(y / 4);
  return { showNext: ((gx + gy) % 10) / 10 < progress };
};
export const fadeShader: TransitionShaderFn = ({ progress }) => ({
  showNext: progress > 0.5,
});
export const meltShader: TransitionShaderFn = ({ x, y, height, progress }) => {
  const variability = (Math.sin(x * 0.7) * 0.5 + 0.5) * 0.4;
  const dropStart = progress * 1.4 - variability;
  return { showNext: y / height < dropStart };
};
export const matrixShader: TransitionShaderFn = ({ rand, progress, ctx }) => {
  const threshold = progress;
  const edge = 0.1;
  if (rand < threshold) {
    return { showNext: true };
  }
  if (rand < threshold + edge) {
    const chars = '01$#@%&*';
    const char = chars.charAt(Math.min(Math.floor(rand * 100) % chars.length, chars.length - 1));
    return {
      showNext: false,
      overrideChar: char,
      overrideCell: tokenCell(char, ctx.status('success')),
      overrideRole: 'decoration' as const,
    };
  }
  return { showNext: false };
};
export const scrambleShader: TransitionShaderFn = ({ rand, progress, ctx }) => {
  const scrambleAmount = 1 - Math.abs(progress - 0.5) * 2;
  if (rand < scrambleAmount * 0.8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    const char = chars.charAt(Math.min(Math.floor(rand * 1000) % chars.length, chars.length - 1));
    return {
      showNext: false,
      overrideChar: char,
      overrideCell: tokenCell(char, ctx.semantic('muted')),
      overrideRole: 'decoration' as const,
    };
  }
  return { showNext: progress > 0.5 };
};
export function wipe(direction: WipeDirection = 'right'): TransitionShaderFn {
  return ({ x, y, width, height, progress }) => {
    const t = direction === 'right' ? x / width
      : direction === 'left' ? 1 - x / width
        : direction === 'down' ? y / height
          : 1 - y / height;
    return { showNext: t < progress };
  };
}
export function radial(originX = 0.5, originY = 0.5): TransitionShaderFn {
  return ({ x, y, width, height, progress }) => {
    const m = computeOriginMetrics(x, y, width, height, originX, originY);
    return { showNext: progress >= 1 || m.normDist < progress };
  };
}
export function diamond(originX = 0.5, originY = 0.5): TransitionShaderFn {
  return ({ x, y, width, height, progress }) => {
    const m = computeOriginMetrics(x, y, width, height, originX, originY);
    const dist = Math.abs(m.dx) + Math.abs(m.dy);
    const maxDist = Math.max(originX, 1 - originX) * m.aspect
      + Math.max(originY, 1 - originY);
    const normDist = maxDist > 0 ? dist / maxDist : 0;
    return { showNext: progress >= 1 || normDist < progress };
  };
}
export function spiral(turns = 3, originX = 0.5, originY = 0.5): TransitionShaderFn {
  return ({ x, y, width, height, progress }) => {
    const m = computeOriginMetrics(x, y, width, height, originX, originY);
    const angle = (Math.atan2(m.dy, m.dx) / (2 * Math.PI) + 0.5) % 1; // [0, 1]
    // Combine angle + distance into a spiral threshold
    const spiralT = (angle + m.normDist * turns) % 1;
    return { showNext: spiralT < progress };
  };
}
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
