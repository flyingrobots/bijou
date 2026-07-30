import type { Cell } from '../../ports/surface.js';
import {
  CELL_STRIDE,
  FLAG_BG_SET,
  FLAG_EMPTY,
  FLAG_FG_SET,
  OFF_FG_R,
  SIDE_TABLE_THRESHOLD,
  decodeChar,
} from './packed-cell.js';
import { byteAt } from './safe-read.js';

const textEncoder = new TextEncoder();

export function hasVisibleStyle(cell: Cell): boolean {
  return (
    cell.fg !== undefined ||
    cell.bg !== undefined ||
    (cell.modifiers?.length ?? 0) > 0
  );
}

export function isSameCell(a: Cell, b: Cell): boolean {
  if (a === b) return true;
  if (
    a.char !== b.char ||
    a.fg !== b.fg ||
    a.bg !== b.bg ||
    a.empty !== b.empty
  ) {
    return false;
  }
  const aModifiers = a.modifiers ?? [];
  const bModifiers = b.modifiers ?? [];
  return (
    aModifiers === bModifiers ||
    (aModifiers.length === bModifiers.length &&
      aModifiers.every((modifier) => bModifiers.includes(modifier)))
  );
}

export const EMPTY_PACKED = new Uint8Array(CELL_STRIDE);
EMPTY_PACKED[0] = 0x20;
EMPTY_PACKED[8] = FLAG_EMPTY;
EMPTY_PACKED[9] = 63;

export function packedBytesEqual(
  a: Uint8Array,
  aOffset: number,
  b: Uint8Array,
  bOffset: number,
): boolean {
  for (let index = 0; index < CELL_STRIDE; index++) {
    if (a[aOffset + index] !== b[bOffset + index]) return false;
  }
  return true;
}

export function packedStyleBytesEqual(
  a: Uint8Array,
  aOffset: number,
  b: Uint8Array,
  bOffset: number,
): boolean {
  for (let index = OFF_FG_R; index < CELL_STRIDE; index++) {
    if (a[aOffset + index] !== b[bOffset + index]) return false;
  }
  return true;
}

export function packedHasVisibleStyle(
  buffer: Uint8Array,
  offset: number,
): boolean {
  const alpha = byteAt(buffer, offset + 9);
  return (
    (alpha & (FLAG_FG_SET | FLAG_BG_SET)) !== 0 ||
    (byteAt(buffer, offset + 8) & ~FLAG_EMPTY) !== 0
  );
}

export function packedCellsSemanticallyEqual(
  aBuffer: Uint8Array,
  aOffset: number,
  aSideTable: readonly string[],
  bBuffer: Uint8Array,
  bOffset: number,
  bSideTable: readonly string[],
): boolean {
  if (!packedBytesEqual(aBuffer, aOffset, bBuffer, bOffset)) return false;
  const aChar =
    byteAt(aBuffer, aOffset) | (byteAt(aBuffer, aOffset + 1) << 8);
  if (aChar < SIDE_TABLE_THRESHOLD) return true;
  const bChar =
    byteAt(bBuffer, bOffset) | (byteAt(bBuffer, bOffset + 1) << 8);
  return (
    aChar === bChar &&
    decodeChar(aChar, aSideTable) === decodeChar(bChar, bSideTable)
  );
}

export function writeCharBytes(
  output: Uint8Array,
  offset: number,
  source: Uint8Array,
  sourceOffset: number,
  sideTable: readonly string[],
): number {
  const code =
    byteAt(source, sourceOffset) | (byteAt(source, sourceOffset + 1) << 8);
  if (code < 0x80) {
    output[offset] = code;
    return offset + 1;
  }
  if (code < SIDE_TABLE_THRESHOLD) {
    return writeBmpCodePoint(output, offset, code);
  }
  const grapheme = sideTable[code - SIDE_TABLE_THRESHOLD] ?? '';
  const { written } = textEncoder.encodeInto(
    grapheme,
    output.subarray(offset),
  );
  return offset + written;
}

function writeBmpCodePoint(
  output: Uint8Array,
  offset: number,
  code: number,
): number {
  if (code < 0x800) {
    output[offset] = 0xc0 | (code >> 6);
    output[offset + 1] = 0x80 | (code & 0x3f);
    return offset + 2;
  }
  output[offset] = 0xe0 | (code >> 12);
  output[offset + 1] = 0x80 | ((code >> 6) & 0x3f);
  output[offset + 2] = 0x80 | (code & 0x3f);
  return offset + 3;
}
