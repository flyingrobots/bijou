import { type Cell, type Surface } from '@flyingrobots/bijou';
import {
  linesToSurface,
  overlayLines,
  sideBySideLines,
} from './surface-diff.part02.js';
import { diffSurfaces } from './surface-diff-engine.js';

export type SurfaceDiffCellKind = 'char' | 'style';
export type SurfaceDiffRenderMode = 'side-by-side' | 'overlay';
export interface SurfaceDiffBounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}
export interface SurfaceDiffCell {
  readonly x: number;
  readonly y: number;
  readonly kind: SurfaceDiffCellKind;
  readonly before: Cell;
  readonly after: Cell;
}
export interface SurfaceDiff {
  readonly width: number;
  readonly height: number;
  readonly beforeWidth: number;
  readonly beforeHeight: number;
  readonly afterWidth: number;
  readonly afterHeight: number;
  readonly changedCells: number;
  readonly charChanges: number;
  readonly styleOnlyChanges: number;
  readonly bounds: SurfaceDiffBounds | undefined;
  readonly cells: readonly SurfaceDiffCell[];
}
export interface SurfaceDiffRenderOptions {
  readonly mode?: SurfaceDiffRenderMode;
}
export function surfaceDiffSurface(
  before: Surface,
  after: Surface,
  options: SurfaceDiffRenderOptions = {},
): Surface {
  const diff = diffSurfaces(before, after);
  const mode = options.mode ?? 'side-by-side';
  const lines =
    mode === 'overlay'
      ? overlayLines(diff, after)
      : sideBySideLines(diff, before, after);

  return linesToSurface(lines, diff);
}
