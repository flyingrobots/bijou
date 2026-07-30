import {
  cellAt,
  wordAt,
} from '../core/render/safe-read.js';
import { CELL_STRIDE } from '../core/render/packed-cell.js';
import { sanitizeNonNegativeInt } from '../core/numeric.js';
import type { Cell } from './surface-cell.js';
import { cloneCell } from './surface-cell.js';
import {
  encodeCellIntoBuffer,
  syncCellFromBuffer,
} from './surface-packed-codec.js';

export interface PackedSurfaceState {
  readonly width: number;
  readonly height: number;
  readonly size: number;
  readonly defaultCell: Cell;
  readonly sideTable: string[];
  readonly buffer: Uint8Array;
  readonly dirtyWords: Uint32Array;
  readonly renderDirtyWords: Uint32Array;
  readonly cells: Cell[];
}

export function createPackedSurfaceState(
  width: number,
  height: number,
  fill?: Cell,
): PackedSurfaceState {
  const state: PackedSurfaceState = {
    width: sanitizeNonNegativeInt(width, 0),
    height: sanitizeNonNegativeInt(height, 0),
    size: 0,
    defaultCell: fill ?? { char: ' ', empty: true },
    sideTable: [],
    buffer: new Uint8Array(0),
    dirtyWords: new Uint32Array(0),
    renderDirtyWords: new Uint32Array(0),
    cells: [],
  };
  const size = state.width * state.height;
  const initialized: PackedSurfaceState = {
    ...state,
    size,
    buffer: new Uint8Array(size * CELL_STRIDE),
    dirtyWords: new Uint32Array(Math.ceil(size / 32)),
    renderDirtyWords: new Uint32Array(Math.ceil(size / 32)),
    cells: Array.from({ length: size }, () => cloneCell(state.defaultCell)),
  };
  for (let index = 0; index < size; index++) {
    encodeCellIntoBuffer(
      initialized.buffer,
      index,
      initialized.defaultCell,
      initialized.sideTable,
    );
  }
  return initialized;
}

export function markCellDirty(
  state: PackedSurfaceState,
  index: number,
): void {
  const wordIndex = index >> 5;
  const bit = 1 << (index & 31);
  state.dirtyWords[wordIndex] = wordAt(state.dirtyWords, wordIndex) | bit;
  state.renderDirtyWords[wordIndex] =
    wordAt(state.renderDirtyWords, wordIndex) | bit;
}

export function ensureCellClean(
  state: PackedSurfaceState,
  index: number,
): void {
  const wordIndex = index >> 5;
  const word = wordAt(state.dirtyWords, wordIndex);
  const bit = 1 << (index & 31);
  if ((word & bit) === 0) return;
  const cell = cellAt(state.cells, index);
  syncCellFromBuffer(
    cell,
    state.buffer,
    index,
    state.sideTable,
    cell.opacity,
  );
  state.dirtyWords[wordIndex] = word & ~bit;
}

export function markAllClean(state: PackedSurfaceState): void {
  state.dirtyWords.fill(0);
  state.renderDirtyWords.fill(0);
}

export function markAllDirty(state: PackedSurfaceState): void {
  state.dirtyWords.fill(0xffffffff);
  state.renderDirtyWords.fill(0xffffffff);
}

export function markAllRenderClean(state: PackedSurfaceState): void {
  state.renderDirtyWords.fill(0);
}
