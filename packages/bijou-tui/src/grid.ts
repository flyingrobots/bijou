/**
 * Constraint grid layout primitive.
 *
 * Supports fixed and fractional (`fr`) tracks, named areas, and a pure layout
 * solver returning per-area rectangles.
 */

import { composite, type Overlay } from './overlay.js';
import type { LayoutRect } from './layout-rect.js';
import { fitBlock } from './layout-utils.js';

/** Grid track definition. */
export type GridTrack = number | `${number}fr`;

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

/** Optional richer result type (kept for future convenience APIs). */
export interface GridLayoutResult {
  /** Solved rectangles by area name. */
  readonly rects: ReadonlyMap<string, LayoutRect>;
  /** Rendered output. */
  readonly output: string;
}

/**
 * Compute area rectangles from grid constraints and area template.
 */
export function gridLayout(options: Omit<GridOptions, 'cells'>): ReadonlyMap<string, LayoutRect> {
  const width = Math.max(0, Math.floor(options.width));
  const height = Math.max(0, Math.floor(options.height));
  const gap = Math.max(0, Math.floor(options.gap ?? 0));

  if (options.columns.length === 0 || options.rows.length === 0) {
    throw new Error('gridLayout: columns and rows must be non-empty');
  }

  if (options.areas.length !== options.rows.length) {
    throw new Error(
      `gridLayout: areas row count (${options.areas.length}) must match rows track count (${options.rows.length})`,
    );
  }

  const matrix = options.areas.map((row, r) => {
    const tokens = row.trim().length === 0 ? [] : row.trim().split(/\s+/);
    if (tokens.length !== options.columns.length) {
      throw new Error(
        `gridLayout: area row ${r} has ${tokens.length} columns, expected ${options.columns.length}`,
      );
    }
    return tokens;
  });

  const colSizes = solveTracks(width, options.columns, gap);
  const rowSizes = solveTracks(height, options.rows, gap);

  const colStarts = trackStarts(colSizes, gap);
  const rowStarts = trackStarts(rowSizes, gap);

  const areaCells = new Map<string, Array<{ r: number; c: number }>>();
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r]!.length; c++) {
      const area = matrix[r]![c]!;
      if (area === '.') continue;
      const list = areaCells.get(area) ?? [];
      list.push({ r, c });
      areaCells.set(area, list);
    }
  }

  const rects = new Map<string, LayoutRect>();
  for (const [name, cells] of areaCells) {
    const rows = cells.map((x) => x.r);
    const cols = cells.map((x) => x.c);
    const minR = Math.min(...rows);
    const maxR = Math.max(...rows);
    const minC = Math.min(...cols);
    const maxC = Math.max(...cols);

    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        if (matrix[r]![c] !== name) {
          throw new Error(
            `gridLayout: area "${name}" must form a contiguous rectangle; gap at row ${r}, column ${c}`,
          );
        }
      }
    }

    const colSpan = maxC - minC + 1;
    const rowSpan = maxR - minR + 1;
    const rectWidth = sum(colSizes.slice(minC, maxC + 1)) + gap * Math.max(0, colSpan - 1);
    const rectHeight = sum(rowSizes.slice(minR, maxR + 1)) + gap * Math.max(0, rowSpan - 1);

    rects.set(name, {
      row: rowStarts[minR] ?? 0,
      col: colStarts[minC] ?? 0,
      width: rectWidth,
      height: rectHeight,
    });
  }

  return rects;
}

/**
 * Render a named-area grid.
 */
export function grid(options: GridOptions): string {
  const width = Math.max(0, Math.floor(options.width));
  const height = Math.max(0, Math.floor(options.height));
  const rects = gridLayout(options);

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

/** Distribute space among fixed-pixel and fractional tracks, respecting gaps. */
function solveTracks(total: number, tracks: readonly GridTrack[], gap: number): number[] {
  const available = Math.max(0, total - gap * Math.max(0, tracks.length - 1));
  const sizes = new Array<number>(tracks.length).fill(0);

  let fixed = 0;
  let frTotal = 0;

  for (let i = 0; i < tracks.length; i++) {
    const t = tracks[i]!;
    if (typeof t === 'number') {
      const sz = Math.max(0, Math.floor(t));
      sizes[i] = sz;
      fixed += sz;
    } else {
      const fr = parseFr(t);
      frTotal += fr;
    }
  }

  // If fixed tracks over-allocate the container, clamp them in declaration order
  // and leave all fractional tracks at 0. This keeps total size deterministic and bounded.
  if (fixed > available) {
    let remainingBudget = available;
    for (let i = 0; i < tracks.length; i++) {
      if (typeof tracks[i] !== 'number') continue;
      const next = Math.min(sizes[i] ?? 0, remainingBudget);
      sizes[i] = next;
      remainingBudget -= next;
      if (remainingBudget <= 0) remainingBudget = 0;
    }
    return sizes.map((x) => Math.max(0, x));
  }

  const remaining = Math.max(0, available - fixed);
  if (frTotal > 0) {
    let assigned = 0;
    const frAllocations: Array<{ index: number; remainder: number }> = [];
    for (let i = 0; i < tracks.length; i++) {
      const t = tracks[i]!;
      if (typeof t !== 'number') {
        const fr = parseFr(t);
        const rawShare = (remaining * fr) / frTotal;
        const sz = Math.floor(rawShare);
        sizes[i] = sz;
        assigned += sz;
        frAllocations.push({ index: i, remainder: rawShare - sz });
      }
    }
    let leftover = remaining - assigned;
    // Prefer largest fractional remainders first to reduce declaration-order bias.
    frAllocations.sort((a, b) => {
      if (b.remainder !== a.remainder) return b.remainder - a.remainder;
      return a.index - b.index;
    });
    for (let i = 0; i < frAllocations.length && leftover > 0; i++) {
      const idx = frAllocations[i]!.index;
      sizes[idx] = (sizes[idx] ?? 0) + 1;
      leftover -= 1;
    }
  }

  return sizes.map((x) => Math.max(0, x));
}

/** Parse a CSS-grid-style `fr` unit string into a positive integer. */
function parseFr(track: `${number}fr`): number {
  const raw = track.slice(0, -2);
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) {
    throw new Error(`gridLayout: invalid fr track "${track}"`);
  }
  return n;
}

/** Compute cumulative start positions from solved track sizes and gap. */
function trackStarts(sizes: readonly number[], gap: number): number[] {
  const starts: number[] = [];
  let cursor = 0;
  for (let i = 0; i < sizes.length; i++) {
    starts.push(cursor);
    cursor += sizes[i]! + (i < sizes.length - 1 ? gap : 0);
  }
  return starts;
}

/** Sum an array of numbers. */
function sum(values: readonly number[]): number {
  let acc = 0;
  for (const n of values) acc += n;
  return acc;
}
