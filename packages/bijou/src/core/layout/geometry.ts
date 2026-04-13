import type { LayoutRect } from '../../ports/surface.js';
import { sanitizeNonNegativeInt } from '../numeric.js';

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

export function solveSplitPaneRects(options: SplitPaneRectOptions): SplitPaneRects {
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

export function solveGridRects(options: GridRectOptions): ReadonlyMap<string, LayoutRect> {
  const width = sanitizeNonNegativeInt(options.width, 0);
  const height = sanitizeNonNegativeInt(options.height, 0);
  const gap = sanitizeNonNegativeInt(options.gap, 0);

  if (options.columns.length === 0 || options.rows.length === 0) {
    throw new Error('solveGridRects: columns and rows must be non-empty');
  }

  if (options.areas.length !== options.rows.length) {
    throw new Error(
      `solveGridRects: areas row count (${options.areas.length}) must match rows track count (${options.rows.length})`,
    );
  }

  const matrix = options.areas.map((row, rowIndex) => {
    const tokens = row.trim().length === 0 ? [] : row.trim().split(/\s+/);
    if (tokens.length !== options.columns.length) {
      throw new Error(
        `solveGridRects: area row ${rowIndex} has ${tokens.length} columns, expected ${options.columns.length}`,
      );
    }
    return tokens;
  });

  const colSizes = solveTracks(width, options.columns, gap);
  const rowSizes = solveTracks(height, options.rows, gap);
  const colStarts = trackStarts(colSizes, gap);
  const rowStarts = trackStarts(rowSizes, gap);

  const areaCells = new Map<string, Array<{ readonly row: number; readonly col: number }>>();
  for (let rowIndex = 0; rowIndex < matrix.length; rowIndex++) {
    for (let colIndex = 0; colIndex < matrix[rowIndex]!.length; colIndex++) {
      const area = matrix[rowIndex]![colIndex]!;
      if (area === '.') continue;
      const cells = areaCells.get(area) ?? [];
      cells.push({ row: rowIndex, col: colIndex });
      areaCells.set(area, cells);
    }
  }

  const rects = new Map<string, LayoutRect>();
  for (const [name, cells] of areaCells) {
    const rows = cells.map((cell) => cell.row);
    const cols = cells.map((cell) => cell.col);
    const minRow = Math.min(...rows);
    const maxRow = Math.max(...rows);
    const minCol = Math.min(...cols);
    const maxCol = Math.max(...cols);

    for (let rowIndex = minRow; rowIndex <= maxRow; rowIndex++) {
      for (let colIndex = minCol; colIndex <= maxCol; colIndex++) {
        if (matrix[rowIndex]![colIndex] !== name) {
          throw new Error(
            `solveGridRects: area "${name}" must form a contiguous rectangle; gap at row ${rowIndex}, column ${colIndex}`,
          );
        }
      }
    }

    const colSpan = maxCol - minCol + 1;
    const rowSpan = maxRow - minRow + 1;
    const rectWidth = Math.min(width, sum(colSizes.slice(minCol, maxCol + 1)) + gap * Math.max(0, colSpan - 1));
    const rectHeight = Math.min(height, sum(rowSizes.slice(minRow, maxRow + 1)) + gap * Math.max(0, rowSpan - 1));

    rects.set(name, {
      x: colStarts[minCol] ?? 0,
      y: rowStarts[minRow] ?? 0,
      width: rectWidth,
      height: rectHeight,
    });
  }

  return rects;
}

function solveSplitAxis(available: number, ratio: number, minA: number, minB: number): [number, number] {
  if (available <= 0) return [0, 0];

  const maxAFromMinB = Math.max(0, available - Math.min(minB, available));
  const clampedMinA = Math.min(minA, maxAFromMinB);

  let desiredA = Math.round(clampRatio(ratio) * available);
  desiredA = clamp(desiredA, clampedMinA, maxAFromMinB);

  const desiredB = available - desiredA;
  if (desiredB < Math.min(minB, available)) {
    desiredA = Math.max(clampedMinA, available - Math.min(minB, available));
  }

  const a = clamp(desiredA, 0, available);
  const b = Math.max(0, available - a);
  return [a, b];
}

function solveTracks(total: number, tracks: readonly GridTrack[], gap: number): number[] {
  const available = Math.max(0, total - gap * Math.max(0, tracks.length - 1));
  const sizes = new Array<number>(tracks.length).fill(0);

  let fixed = 0;
  let frTotal = 0;

  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i]!;
    if (typeof track === 'number') {
      const size = Math.max(0, Math.floor(track));
      sizes[i] = size;
      fixed += size;
    } else {
      frTotal += parseFr(track);
    }
  }

  if (fixed > available) {
    let remainingBudget = available;
    for (let i = 0; i < tracks.length; i++) {
      if (typeof tracks[i] !== 'number') continue;
      const next = Math.min(sizes[i] ?? 0, remainingBudget);
      sizes[i] = next;
      remainingBudget -= next;
      if (remainingBudget <= 0) remainingBudget = 0;
    }
    return sizes.map((size) => Math.max(0, size));
  }

  const remaining = Math.max(0, available - fixed);
  if (frTotal > 0) {
    let assigned = 0;
    const fractionalShares: Array<{ readonly index: number; readonly remainder: number }> = [];
    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i]!;
      if (typeof track === 'number') continue;
      const fr = parseFr(track);
      const rawShare = (remaining * fr) / frTotal;
      const size = Math.floor(rawShare);
      sizes[i] = size;
      assigned += size;
      fractionalShares.push({ index: i, remainder: rawShare - size });
    }
    let leftover = remaining - assigned;
    fractionalShares.sort((left, right) => right.remainder - left.remainder || left.index - right.index);
    for (let i = 0; i < fractionalShares.length && leftover > 0; i++) {
      const index = fractionalShares[i]!.index;
      sizes[index] = (sizes[index] ?? 0) + 1;
      leftover -= 1;
    }
  }

  return sizes.map((size) => Math.max(0, size));
}

function parseFr(track: `${number}fr`): number {
  const raw = track.slice(0, -2);
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`solveGridRects: invalid fr track "${track}"`);
  }
  return parsed;
}

function trackStarts(sizes: readonly number[], gap: number): number[] {
  const starts: number[] = [];
  let cursor = 0;
  for (let i = 0; i < sizes.length; i++) {
    starts.push(cursor);
    cursor += sizes[i]! + (i < sizes.length - 1 ? gap : 0);
  }
  return starts;
}

function sum(values: readonly number[]): number {
  let acc = 0;
  for (const value of values) acc += value;
  return acc;
}

function clampRatio(value: number): number {
  if (!Number.isFinite(value)) return 0.5;
  return Math.max(0, Math.min(1, value));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
