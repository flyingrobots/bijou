import type { Surface } from './surface-contract.js';
import {
  FULL_MASK,
  type CellMask,
} from './surface-cell.js';
import type { Matrix3x3, TransformOptions } from './surface-transform.js';
import { isPackedSurface } from './surface-contract.js';
import { applyMaskToBuffer } from './surface-packed-codec.js';
import { copyPackedSurfaceRegion } from './surface-packed-read.js';
import {
  markCellDirty,
  type PackedSurfaceState,
} from './surface-packed-state.js';

export function blitSurface(
  state: PackedSurfaceState,
  source: Surface,
  destinationX: number,
  destinationY: number,
  sourceX: number,
  sourceY: number,
  sourceWidth: number,
  sourceHeight: number,
  mask: CellMask,
): void {
  const sourceStartX = Math.max(0, sourceX);
  const sourceStartY = Math.max(0, sourceY);
  const width = Math.min(
    sourceWidth - (sourceStartX - sourceX),
    source.width - sourceStartX,
  );
  const height = Math.min(
    sourceHeight - (sourceStartY - sourceY),
    source.height - sourceStartY,
  );
  if (width <= 0 || height <= 0) return;
  const unclippedDestinationX =
    destinationX + (sourceStartX - sourceX);
  const unclippedDestinationY =
    destinationY + (sourceStartY - sourceY);
  const destinationStartX = Math.max(0, unclippedDestinationX);
  const destinationStartY = Math.max(0, unclippedDestinationY);
  const adjustedSourceX =
    sourceStartX + (destinationStartX - unclippedDestinationX);
  const adjustedSourceY =
    sourceStartY + (destinationStartY - unclippedDestinationY);
  const copyWidth = Math.min(
    state.width - destinationStartX,
    width - (adjustedSourceX - sourceStartX),
  );
  const copyHeight = Math.min(
    state.height - destinationStartY,
    height - (adjustedSourceY - sourceStartY),
  );
  if (copyWidth <= 0 || copyHeight <= 0) return;
  if (isPackedSurface(source) && mask === FULL_MASK) {
    copyPackedSurfaceRegion(
      state,
      source,
      destinationStartX,
      destinationStartY,
      adjustedSourceX,
      adjustedSourceY,
      copyWidth,
      copyHeight,
    );
    return;
  }
  for (let row = 0; row < copyHeight; row++) {
    for (let column = 0; column < copyWidth; column++) {
      const index =
        (destinationStartY + row) * state.width +
        destinationStartX +
        column;
      applyMaskToBuffer(
        state.buffer,
        index,
        source.get(adjustedSourceX + column, adjustedSourceY + row),
        mask,
        state.sideTable,
      );
      markCellDirty(state, index);
    }
  }
}

export function transformSurface(
  state: PackedSurfaceState,
  source: Surface,
  matrix: Matrix3x3,
  options: TransformOptions,
): void {
  const { charMap = {}, mask = FULL_MASK } = options;
  const [a, b, c, d, translateX, translateY] = matrix;
  const determinant = a * d - b * c;
  if (Math.abs(determinant) < 0.0001) return;
  for (let y = 0; y < state.height; y++) {
    for (let x = 0; x < state.width; x++) {
      const sourceX = Math.round(
        (d * (x - translateX) - b * (y - translateY)) / determinant,
      );
      const sourceY = Math.round(
        (a * (y - translateY) - c * (x - translateX)) / determinant,
      );
      if (
        sourceX < 0 ||
        sourceX >= source.width ||
        sourceY < 0 ||
        sourceY >= source.height
      ) {
        continue;
      }
      const sourceCell = source.get(sourceX, sourceY);
      if (sourceCell.empty) continue;
      const cell = {
        ...sourceCell,
        char: charMap[sourceCell.char] ?? sourceCell.char,
      };
      const index = y * state.width + x;
      applyMaskToBuffer(state.buffer, index, cell, mask, state.sideTable);
      markCellDirty(state, index);
    }
  }
}
