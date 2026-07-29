import type { LayoutRect } from '../../ports/surface.js';
import { sanitizeNonNegativeInt } from '../numeric.js';
import { solveSplitAxis } from './geometry.part02.js';

export type GridTrack = number | `${number}fr`;
export type SplitLayoutDirection = 'row' | 'column';
export interface SplitPaneRectOptions {
  readonly direction?: SplitLayoutDirection;
  readonly width: number;
  readonly height: number;
  readonly ratio: number;
  readonly minA?: number;
  readonly minB?: number;
  readonly dividerSize?: number;
}
export interface SplitPaneRects {
  readonly paneA: LayoutRect;
  readonly paneB: LayoutRect;
  readonly divider: LayoutRect;
}
export interface SplitAxisOptions {
  readonly available: number;
  readonly ratio: number;
  readonly minA?: number;
  readonly minB?: number;
}
export interface SplitAxisSizes {
  readonly paneA: number;
  readonly paneB: number;
}
export interface GridRectOptions {
  readonly width: number;
  readonly height: number;
  readonly columns: readonly GridTrack[];
  readonly rows: readonly GridTrack[];
  readonly areas: readonly string[];
  readonly gap?: number;
}
export function solveSplitPaneRects(
  options: SplitPaneRectOptions,
): SplitPaneRects {
  const direction = options.direction ?? 'row';
  const width = sanitizeNonNegativeInt(options.width, 0);
  const height = sanitizeNonNegativeInt(options.height, 0);
  const dividerSize = sanitizeNonNegativeInt(options.dividerSize, 1);

  if (direction === 'row') {
    const available = Math.max(0, width - dividerSize);
    const { paneA: a, paneB: b } = solveSplitAxisSizes({
      available,
      ratio: options.ratio,
      minA: options.minA,
      minB: options.minB,
    });
    return {
      paneA: { x: 0, y: 0, width: a, height },
      divider: { x: a, y: 0, width: dividerSize, height },
      paneB: { x: a + dividerSize, y: 0, width: b, height },
    };
  }

  const available = Math.max(0, height - dividerSize);
  const { paneA: a, paneB: b } = solveSplitAxisSizes({
    available,
    ratio: options.ratio,
    minA: options.minA,
    minB: options.minB,
  });
  return {
    paneA: { x: 0, y: 0, width, height: a },
    divider: { x: 0, y: a, width, height: dividerSize },
    paneB: { x: 0, y: a + dividerSize, width, height: b },
  };
}
export function solveSplitAxisSizes(options: SplitAxisOptions): SplitAxisSizes {
  const available = sanitizeNonNegativeInt(options.available, 0);
  const minA = sanitizeNonNegativeInt(options.minA, 0);
  const minB = sanitizeNonNegativeInt(options.minB, 0);
  const [paneA, paneB] = solveSplitAxis(available, options.ratio, minA, minB);
  return { paneA, paneB };
}
