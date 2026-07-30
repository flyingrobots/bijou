import {
  createSurface,
  type BijouContext,
  type Cell,
  type Surface,
} from '@flyingrobots/bijou';
import type { PageTransition } from './app-frame.js';
import {
  TRANSITION_SHADERS,
  type TransitionResult,
} from './transition-shaders.js';

/**
 * Apply a transition shader to blend between previous and next page views.
 *
 * @param frame - Monotonic frame counter for temporal shader effects.
 */
export function renderTransition(
  prev: Surface,
  next: Surface,
  style: PageTransition,
  progress: number,
  width: number,
  height: number,
  ctx: BijouContext,
  frame = 0,
): Surface {
  const shader =
    typeof style === 'function' ? style : TRANSITION_SHADERS[style];
  if (!shader || width <= 0 || height <= 0) return next;
  const surface = createSurface(width, height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const seed = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      const rand = seed - Math.floor(seed);
      const result = shader({
        x,
        y,
        width,
        height,
        progress,
        rand,
        frame,
        ctx,
      });
      const base = result.showNext ? next.get(x, y) : prev.get(x, y);
      surface.set(x, y, applyTransitionCell(base, result));
    }
  }
  return surface;
}

function applyTransitionCell(baseCell: Cell, result: TransitionResult): Cell {
  if (result.overrideCell != null) {
    return {
      ...baseCell,
      ...result.overrideCell,
      char: result.overrideCell.char,
      empty: false,
    };
  }
  return result.overrideChar === undefined
    ? { ...baseCell, empty: false }
    : { ...baseCell, char: result.overrideChar, empty: false };
}
