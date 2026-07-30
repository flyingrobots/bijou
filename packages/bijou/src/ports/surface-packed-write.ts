import { cellAt } from '../core/render/safe-read.js';
import {
  CELL_STRIDE,
  packCell,
  encodeChar,
} from '../core/render/packed-cell.js';
import {
  FULL_MASK,
  copyCellInto,
  type Cell,
  type CellMask,
} from './surface-cell.js';
import {
  applyMaskToBuffer,
  encodeCellIntoBuffer,
} from './surface-packed-codec.js';
import {
  markAllClean,
  markCellDirty,
  type PackedSurfaceState,
} from './surface-packed-state.js';

export function clearSurface(state: PackedSurfaceState): void {
  if (state.size > 0) {
    encodeCellIntoBuffer(
      state.buffer,
      0,
      state.defaultCell,
      state.sideTable,
    );
    for (let index = 1; index < state.size; index++) {
      state.buffer.set(
        state.buffer.subarray(0, CELL_STRIDE),
        index * CELL_STRIDE,
      );
    }
  }
  for (let index = 0; index < state.size; index++) {
    copyCellInto(cellAt(state.cells, index), state.defaultCell);
  }
  markAllClean(state);
}

export function setSurfaceCell(
  state: PackedSurfaceState,
  x: number,
  y: number,
  cell: Cell,
  mask: CellMask = FULL_MASK,
): void {
  if (!inBounds(state, x, y) || cell.empty) return;
  const index = y * state.width + x;
  if (mask === FULL_MASK) {
    encodeCellIntoBuffer(state.buffer, index, cell, state.sideTable);
  } else {
    applyMaskToBuffer(state.buffer, index, cell, mask, state.sideTable);
  }
  if (mask.alpha) {
    cellAt(state.cells, index).opacity = cell.opacity ?? 1;
  }
  markCellDirty(state, index);
}

export function setSurfaceRgb(
  state: PackedSurfaceState,
  x: number,
  y: number,
  char: number | string,
  foregroundRed: number,
  foregroundGreen: number,
  foregroundBlue: number,
  backgroundRed: number,
  backgroundGreen: number,
  backgroundBlue: number,
  flags: number,
): void {
  if (!inBounds(state, x, y)) return;
  const index = y * state.width + x;
  const charCode =
    typeof char === 'string' ? encodeChar(char, state.sideTable) : char;
  const foregroundSet = foregroundRed >= 0;
  const backgroundSet = backgroundRed >= 0;
  packCell(
    state.buffer,
    index,
    charCode,
    foregroundSet ? foregroundRed : 0,
    foregroundSet ? foregroundGreen : 0,
    foregroundSet ? foregroundBlue : 0,
    foregroundSet,
    backgroundSet ? backgroundRed : 0,
    backgroundSet ? backgroundGreen : 0,
    backgroundSet ? backgroundBlue : 0,
    backgroundSet,
    flags,
    63,
  );
  cellAt(state.cells, index).opacity = 1;
  markCellDirty(state, index);
}

export function fillSurface(
  state: PackedSurfaceState,
  cell: Cell,
  x: number,
  y: number,
  width: number,
  height: number,
  mask: CellMask,
): void {
  const xStart = Math.max(0, x);
  const yStart = Math.max(0, y);
  const xEnd = Math.min(state.width, xStart + width);
  const yEnd = Math.min(state.height, yStart + height);
  if (xStart >= xEnd || yStart >= yEnd) return;
  const template =
    mask === FULL_MASK && !cell.empty ? packedTemplate(cell, state) : null;
  for (let row = yStart; row < yEnd; row++) {
    for (let column = xStart; column < xEnd; column++) {
      const index = row * state.width + column;
      if (template == null) {
        applyMaskToBuffer(state.buffer, index, cell, mask, state.sideTable);
      } else {
        state.buffer.set(template, index * CELL_STRIDE);
      }
      markCellDirty(state, index);
    }
  }
}

function packedTemplate(
  cell: Cell,
  state: PackedSurfaceState,
): Uint8Array {
  const template = new Uint8Array(CELL_STRIDE);
  encodeCellIntoBuffer(template, 0, cell, state.sideTable);
  return template;
}

function inBounds(state: PackedSurfaceState, x: number, y: number): boolean {
  return x >= 0 && x < state.width && y >= 0 && y < state.height;
}
