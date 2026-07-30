import type { PackedSurface } from '../../ports/surface.js';
import type { WritePort } from '../../ports/index.js';
import { CELL_STRIDE, MAX_PACKED_CELL_UTF8_BYTES } from './packed-cell.js';
import { wordAt } from './safe-read.js';
import {
  EMPTY_PACKED,
  packedBytesEqual,
  packedCellsSemanticallyEqual,
  packedHasVisibleStyle,
  packedStyleBytesEqual,
  writeCharBytes,
} from './differ-cell.js';
import {
  acquirePackedOutputBuffer,
  flushPackedOutput,
  writeCursorBytes,
  writeResetBytes,
  writeSgrFromBuffer,
} from './differ-packed-bytes.js';

export function renderDiffPacked(
  current: PackedSurface,
  target: PackedSurface,
  io: WritePort,
  suppliedOutput?: Uint8Array,
): void {
  const { width, height, buffer: targetBuffer } = target;
  const { buffer: currentBuffer } = current;
  const targetDirty = target.renderDirtyWords;
  const currentDirty = current.renderDirtyWords;
  const cellCount = width * height;
  if (!hasAnyDirty(targetDirty, currentDirty, cellCount)) return;
  const output = acquirePackedOutputBuffer(suppliedOutput, cellCount);
  let outputOffset = 0;
  const flush = (): void => {
    flushPackedOutput(io, output, outputOffset);
    outputOffset = 0;
  };
  let cursorX = -1;
  let cursorY = -1;
  const checkSideTables =
    target.sideTable.length > 0 || current.sideTable.length > 0;
  const batchBudget = 128 + width * MAX_PACKED_CELL_UTF8_BYTES;
  const cellsEqual = (targetOffset: number, currentOffset: number): boolean =>
    checkSideTables
      ? packedCellsSemanticallyEqual(
          targetBuffer, targetOffset, target.sideTable,
          currentBuffer, currentOffset, current.sideTable,
        )
      : packedBytesEqual(targetBuffer, targetOffset,
          currentBuffer, currentOffset);
  for (let y = 0; y < height; y++) {
    let x = 0;
    while (x < width) {
      const targetIndex = y * width + x;
      if (!isCellDirty(targetDirty, currentDirty, targetIndex)) {
        x++;
        continue;
      }
      const targetOffset = targetIndex * CELL_STRIDE;
      const inBounds = y < current.height && x < current.width;
      const currentOffset = inBounds
        ? (y * current.width + x) * CELL_STRIDE
        : -1;
      const same = inBounds
        ? cellsEqual(targetOffset, currentOffset)
        : packedBytesEqual(targetBuffer, targetOffset, EMPTY_PACKED, 0);
      if (same) {
        x++;
        continue;
      }
      if (outputOffset + batchBudget > output.length) flush();
      if (x !== cursorX || y !== cursorY) {
        outputOffset = writeCursorBytes(output, outputOffset, x, y);
      }
      const styled = packedHasVisibleStyle(targetBuffer, targetOffset);
      if (styled) {
        outputOffset = writeSgrFromBuffer(
          output, outputOffset, targetBuffer, targetOffset,
        );
      }
      outputOffset = writeCharBytes(
        output, outputOffset, targetBuffer, targetOffset, target.sideTable,
      );
      let batchX = x + 1;
      while (batchX < width) {
        const nextOffset = (y * width + batchX) * CELL_STRIDE;
        if (!packedStyleBytesEqual(
          targetBuffer, targetOffset, targetBuffer, nextOffset,
        )) {
          break;
        }
        const nextInBounds =
          y < current.height && batchX < current.width;
        const nextCurrentOffset = nextInBounds
          ? (y * current.width + batchX) * CELL_STRIDE
          : -1;
        const nextSame = nextInBounds
          ? cellsEqual(nextOffset, nextCurrentOffset)
          : packedBytesEqual(targetBuffer, nextOffset, EMPTY_PACKED, 0);
        if (nextSame) break;
        outputOffset = writeCharBytes(
          output, outputOffset, targetBuffer, nextOffset, target.sideTable,
        );
        batchX++;
      }
      if (styled) {
        outputOffset = writeResetBytes(output, outputOffset);
      }
      cursorX = batchX;
      cursorY = y;
      x = batchX;
    }
  }
  flush();
}

function hasAnyDirty(
  target: Uint32Array, current: Uint32Array, cellCount: number,
): boolean {
  const words = Math.min(Math.ceil(cellCount / 32), Math.max(
    target.length,
    current.length,
  ));
  for (let index = 0; index < words; index++) {
    if ((wordAt(target, index) | wordAt(current, index)) !== 0) return true;
  }
  return false;
}

function isCellDirty(
  target: Uint32Array, current: Uint32Array, index: number,
): boolean {
  const word = index >>> 5;
  const bit = 1 << (index & 31);
  return (
    (wordAt(target, word) & bit) !== 0 ||
    (wordAt(current, word) & bit) !== 0
  );
}
