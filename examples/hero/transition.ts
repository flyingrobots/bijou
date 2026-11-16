import { createSurface, type BijouContext, type Surface } from '../../packages/bijou/src/index.js';
import type { TransitionShaderFn } from '../../packages/bijou-tui/src/index.js';

function cellRand(x: number, y: number): number {
  const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

/**
 * Composite two same-sized surfaces through one of Bijou's transition shaders.
 * `progress` 0 shows `from`, 1 shows `to`; override cells (matrix rain, glitch) draw on top.
 */
export function applyTransition(
  from: Surface, to: Surface, shader: TransitionShaderFn,
  progress: number, frame: number, ctx: BijouContext, overrideBg?: string,
): Surface {
  const width = to.width;
  const height = to.height;
  const out = createSurface(width, height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const result = shader({ x, y, width, height, progress, rand: cellRand(x, y), frame, ctx });
      const base = result.showNext ? to.get(x, y) : from.get(x, y);
      if (result.overrideCell !== undefined) {
        const bg = overrideBg ?? base.bg;
        const merged = { ...base, ...result.overrideCell, empty: false };
        out.set(x, y, bg === undefined ? merged : { ...merged, bg });
      } else if (result.overrideChar !== undefined) {
        out.set(x, y, { ...base, char: result.overrideChar, empty: false });
      } else {
        out.set(x, y, { ...base, empty: false });
      }
    }
  }
  return out;
}
