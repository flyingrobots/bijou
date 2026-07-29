import type { LayoutRect } from '../../ports/surface.js';
import { sanitizeNonNegativeInt } from '../numeric.js';
import { type GridRectOptions } from './geometry.part01.js';
import {
  clamp,
  clampRatio,
  solveTracks,
  sum,
  trackStarts,
} from './geometry.part03.js';

export function solveGridRects(
  options: GridRectOptions,
): ReadonlyMap<string, LayoutRect> {
  const width = sanitizeNonNegativeInt(options.width, 0);
  const height = sanitizeNonNegativeInt(options.height, 0);
  const gap = sanitizeNonNegativeInt(options.gap, 0);

  if (options.columns.length === 0 || options.rows.length === 0) {
    throw new Error('solveGridRects: columns and rows must be non-empty');
  }

  if (options.areas.length !== options.rows.length) {
    throw new Error(
      `solveGridRects: areas row count (${String(options.areas.length)}) must match rows track count (${String(options.rows.length)})`,
    );
  }

  const matrix = options.areas.map((row, rowIndex) => {
    const tokens = row.trim().length === 0 ? [] : row.trim().split(/\s+/);
    if (tokens.length !== options.columns.length) {
      throw new Error(
        `solveGridRects: area row ${String(rowIndex)} has ${String(tokens.length)} columns, expected ${String(options.columns.length)}`,
      );
    }
    return tokens;
  });

  const colSizes = solveTracks(width, options.columns, gap);
  const rowSizes = solveTracks(height, options.rows, gap);
  const colStarts = trackStarts(colSizes, gap);
  const rowStarts = trackStarts(rowSizes, gap);

  const areaCells = new Map<
    string,
    { readonly row: number; readonly col: number }[]
  >();
  for (const [rowIndex, row] of matrix.entries()) {
    for (const [colIndex, area] of row.entries()) {
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
        if (matrix[rowIndex]?.[colIndex] !== name) {
          throw new Error(
            `solveGridRects: area "${name}" must form a contiguous rectangle; gap at row ${String(rowIndex)}, column ${String(colIndex)}`,
          );
        }
      }
    }

    const colSpan = maxCol - minCol + 1;
    const rowSpan = maxRow - minRow + 1;
    const rectWidth = Math.min(
      width,
      sum(colSizes.slice(minCol, maxCol + 1)) + gap * Math.max(0, colSpan - 1),
    );
    const rectHeight = Math.min(
      height,
      sum(rowSizes.slice(minRow, maxRow + 1)) + gap * Math.max(0, rowSpan - 1),
    );

    rects.set(name, {
      x: colStarts[minCol] ?? 0,
      y: rowStarts[minRow] ?? 0,
      width: rectWidth,
      height: rectHeight,
    });
  }

  return rects;
}
export function solveSplitAxis(
  available: number,
  ratio: number,
  minA: number,
  minB: number,
): [number, number] {
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
