import { byteAt, cellAt } from '../core/render/safe-read.js';
import {
  CELL_STRIDE,
  FLAG_EMPTY,
  OFF_CHAR,
  OFF_FLAGS,
  SIDE_TABLE_THRESHOLD,
  encodeChar,
} from '../core/render/packed-cell.js';
import type { PackedSurface, Surface } from './surface-contract.js';
import {
  FULL_MASK,
  maskCell,
  type Cell,
  type CellMask,
} from './surface-cell.js';
import { applyMaskToBuffer } from './surface-packed-codec.js';
import {
  ensureCellClean,
  markCellDirty,
  type PackedSurfaceState,
} from './surface-packed-state.js';

export function getSurfaceCell(
  state: PackedSurfaceState,
  x: number,
  y: number,
  mask: CellMask = FULL_MASK,
): Cell {
  if (!inBounds(state, x, y)) return { char: ' ', empty: true };
  const index = y * state.width + x;
  ensureCellClean(state, index);
  return maskCell(cellAt(state.cells, index), mask);
}

export function getSurfaceRow(
  state: PackedSurfaceState,
  y: number,
  x: number,
  width: number,
  mask: CellMask,
): Cell[] {
  if (y < 0 || y >= state.height) return [];
  const startX = Math.max(0, x);
  const count = Math.min(state.width - startX, width);
  if (count <= 0) return [];
  const start = y * state.width + startX;
  for (let index = 0; index < count; index++) {
    ensureCellClean(state, start + index);
  }
  return state.cells
    .slice(start, start + count)
    .map((cell) => maskCell(cell, mask));
}

export function setSurfaceRow(
  state: PackedSurfaceState,
  y: number,
  row: Cell[],
  x: number,
  mask: CellMask,
): void {
  if (y < 0 || y >= state.height) return;
  const startX = Math.max(0, x);
  const count = Math.min(state.width - startX, row.length);
  for (let offset = 0; offset < count; offset++) {
    const index = y * state.width + startX + offset;
    applyMaskToBuffer(
      state.buffer,
      index,
      cellAt(row, offset),
      mask,
      state.sideTable,
    );
    markCellDirty(state, index);
  }
}

export function copySurfaceIntoClone(
  state: PackedSurfaceState,
  clone: PackedSurface,
): Surface {
  clone.buffer.set(state.buffer);
  for (const entry of state.sideTable) {
    if (!clone.sideTable.includes(entry)) clone.sideTable.push(entry);
  }
  clone.markAllDirty();
  return clone;
}

export function copyPackedSurfaceRegion(
  state: PackedSurfaceState,
  source: PackedSurface,
  destinationX: number,
  destinationY: number,
  sourceX: number,
  sourceY: number,
  width: number,
  height: number,
): void {
  for (let row = 0; row < height; row++) {
    for (let column = 0; column < width; column++) {
      const sourceIndex =
        (sourceY + row) * source.width + sourceX + column;
      const sourceOffset = sourceIndex * CELL_STRIDE;
      if (byteAt(source.buffer, sourceOffset + OFF_FLAGS) & FLAG_EMPTY) {
        continue;
      }
      const targetIndex =
        (destinationY + row) * state.width + destinationX + column;
      const targetOffset = targetIndex * CELL_STRIDE;
      state.buffer.set(
        source.buffer.subarray(sourceOffset, sourceOffset + CELL_STRIDE),
        targetOffset,
      );
      copySideTableCharacter(state, source, sourceOffset, targetOffset);
      markCellDirty(state, targetIndex);
    }
  }
}

function copySideTableCharacter(
  state: PackedSurfaceState,
  source: PackedSurface,
  sourceOffset: number,
  targetOffset: number,
): void {
  const code =
    byteAt(source.buffer, sourceOffset) |
    (byteAt(source.buffer, sourceOffset + 1) << 8);
  if (code < SIDE_TABLE_THRESHOLD) return;
  const char = source.sideTable[code - SIDE_TABLE_THRESHOLD] ?? ' ';
  const targetCode = encodeChar(char, state.sideTable);
  state.buffer[targetOffset + OFF_CHAR] = targetCode & 0xff;
  state.buffer[targetOffset + OFF_CHAR + 1] = (targetCode >> 8) & 0xff;
}

function inBounds(state: PackedSurfaceState, x: number, y: number): boolean {
  return x >= 0 && x < state.width && y >= 0 && y < state.height;
}
