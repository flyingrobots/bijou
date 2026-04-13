/**
 * Constraint grid layout primitive.
 *
 * Supports fixed and fractional (`fr`) tracks, named areas, and a pure layout
 * solver returning per-area rectangles.
 */

import {
  createSurface,
  solveGridRects,
  type GridTrack as SharedGridTrack,
  type Surface,
} from '@flyingrobots/bijou';
import { composite, type Overlay } from './overlay.js';
import type { LayoutRect } from './layout-rect.js';
import { fitBlock } from './layout-utils.js';
import { placeSurface } from './surface-layout.js';

/** Grid track definition. */
export type GridTrack = SharedGridTrack;

/** Grid render options. */
export interface GridOptions {
  /** Total grid width in columns. */
  readonly width: number;
  /** Total grid height in rows. */
  readonly height: number;
  /** Column tracks. */
  readonly columns: readonly GridTrack[];
  /** Row tracks. */
  readonly rows: readonly GridTrack[];
  /** Named area template rows. */
  readonly areas: readonly string[];
  /** Gap between tracks in columns/rows. Default: 0. */
  readonly gap?: number;
  /** Renderer map for named areas. */
  readonly cells: Readonly<Record<string, (width: number, height: number) => string>>;
}

/** Grid render options for structured surface composition. */
export interface GridSurfaceOptions extends Omit<GridOptions, 'cells'> {
  /** Renderer map for named areas. */
  readonly cells: Readonly<Record<string, (width: number, height: number) => Surface>>;
}

/** Optional richer result type (kept for future convenience APIs). */
export interface GridLayoutResult {
  /** Solved rectangles by area name. */
  readonly rects: ReadonlyMap<string, LayoutRect>;
  /** Rendered output. */
  readonly output: string;
}

/**
 * Floor a numeric dimension and clamp NaN / Infinity to 0.
 *
 * @param value - Raw numeric dimension.
 * @returns Sanitised non-negative integer.
 */
function sanitiseDimension(value: number): number {
  const floored = Math.floor(value);
  return Number.isFinite(floored) ? Math.max(0, floored) : 0;
}

/**
 * Compute area rectangles from grid constraints and area template.
 */
export function gridLayout(options: Omit<GridOptions, 'cells'>): ReadonlyMap<string, LayoutRect> {
  const rects = solveGridRects(options);
  return new Map(
    [...rects.entries()].map(([name, rect]) => [
      name,
      {
        row: rect.y,
        col: rect.x,
        width: rect.width,
        height: rect.height,
      } satisfies LayoutRect,
    ]),
  );
}

/**
 * Render a named-area grid.
 */
export function grid(options: GridOptions): string {
  // gridLayout() already floors and clamps width/height/gap (NaN/Infinity → 0),
  // so we delegate all input validation to it and only derive canvas dimensions
  // from its sanitised output.
  const rects = gridLayout(options);

  // Mirror gridLayout()'s sanitisation for the canvas (same expression).
  const width = sanitiseDimension(options.width);
  const height = sanitiseDimension(options.height);

  if (width <= 0 || height <= 0) return '';

  const background = Array.from({ length: height }, () => ' '.repeat(width)).join('\n');
  const overlays: Overlay[] = [];

  for (const [name, rect] of rects) {
    const renderer = options.cells[name];
    if (renderer === undefined) {
      throw new Error(`grid: missing renderer for area "${name}"`);
    }
    const raw = renderer(rect.width, rect.height);
    overlays.push({
      row: rect.row,
      col: rect.col,
      content: fitBlock(raw, rect.width, rect.height).join('\n'),
    });
  }

  return composite(background, overlays);
}

/**
 * Render a named-area grid onto a structured surface.
 */
export function gridSurface(options: GridSurfaceOptions): Surface {
  const rects = gridLayout(options);
  const width = sanitiseDimension(options.width);
  const height = sanitiseDimension(options.height);

  if (width <= 0 || height <= 0) return createSurface(0, 0);

  const result = createSurface(width, height);

  for (const [name, rect] of rects) {
    const renderer = options.cells[name];
    if (renderer === undefined) {
      throw new Error(`gridSurface: missing renderer for area "${name}"`);
    }

    const cellSurface = placeSurface(renderer(rect.width, rect.height), {
      width: rect.width,
      height: rect.height,
    });
    result.blit(cellSurface, rect.col, rect.row, 0, 0, rect.width, rect.height);
  }

  return result;
}
