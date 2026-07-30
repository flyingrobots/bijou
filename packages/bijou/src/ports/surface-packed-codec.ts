import {
  byteAt,
  hexAt,
  rgbAt,
} from '../core/render/safe-read.js';
import {
  CELL_STRIDE,
  FLAG_BG_SET,
  FLAG_EMPTY,
  FLAG_FG_SET,
  OFF_ALPHA,
  OFF_BG_R,
  OFF_CHAR,
  OFF_FG_R,
  OFF_FLAGS,
  OPACITY_MASK,
  decodeChar,
  decodeModifiers,
  decodeOpacity,
  encodeChar,
  encodeModifiers,
  encodeOpacity,
} from '../core/render/packed-cell.js';
import { colorHex, colorRgb } from '../core/theme/color.js';
import type { Cell, CellMask } from './surface-cell.js';
import {
  clearRgb,
  writeColorRefInto,
  writeMaskedColor,
} from './surface-packed-color.js';

export function encodeCellIntoBuffer(
  buffer: Uint8Array,
  index: number,
  cell: Cell,
  sideTable: string[],
): void {
  const offset = index * CELL_STRIDE;
  const charCode = encodeChar(cell.char, sideTable);
  buffer[offset + OFF_CHAR] = charCode & 0xff;
  buffer[offset + OFF_CHAR + 1] = (charCode >> 8) & 0xff;
  let alphaBits = 0;
  if (writeColorRefInto(cell.fg, cell.fgRGB, buffer, offset + OFF_FG_R)) {
    alphaBits |= FLAG_FG_SET;
  } else {
    clearRgb(buffer, offset + OFF_FG_R);
  }
  if (writeColorRefInto(cell.bg, cell.bgRGB, buffer, offset + OFF_BG_R)) {
    alphaBits |= FLAG_BG_SET;
  } else {
    clearRgb(buffer, offset + OFF_BG_R);
  }
  buffer[offset + OFF_FLAGS] =
    encodeModifiers(cell.modifiers) | (cell.empty ? FLAG_EMPTY : 0);
  buffer[offset + OFF_ALPHA] =
    (encodeOpacity(cell.opacity) & OPACITY_MASK) | alphaBits;
}

export function decodeCellFromBuffer(
  buffer: Uint8Array,
  index: number,
  sideTable: readonly string[],
): Cell {
  const offset = index * CELL_STRIDE;
  const charCode =
    byteAt(buffer, offset + OFF_CHAR) |
    (byteAt(buffer, offset + OFF_CHAR + 1) << 8);
  const alpha = byteAt(buffer, offset + OFF_ALPHA);
  const flags = byteAt(buffer, offset + OFF_FLAGS);
  const fgSet = (alpha & FLAG_FG_SET) !== 0;
  const bgSet = (alpha & FLAG_BG_SET) !== 0;
  return {
    char: decodeChar(charCode, sideTable),
    fg: fgSet ? hexAt(buffer, offset + OFF_FG_R) : undefined,
    bg: bgSet ? hexAt(buffer, offset + OFF_BG_R) : undefined,
    fgRGB: fgSet ? rgbAt(buffer, offset + OFF_FG_R) : undefined,
    bgRGB: bgSet ? rgbAt(buffer, offset + OFF_BG_R) : undefined,
    modifiers: decodeModifiers(flags & ~FLAG_EMPTY),
    empty: (flags & FLAG_EMPTY) !== 0,
    opacity: decodeOpacity(alpha & OPACITY_MASK),
  };
}

export function syncCellFromBuffer(
  cell: Cell,
  buffer: Uint8Array,
  index: number,
  sideTable: readonly string[],
  exactOpacity?: number,
): void {
  const decoded = decodeCellFromBuffer(buffer, index, sideTable);
  cell.char = decoded.char;
  cell.fg = colorHex(decoded.fg);
  cell.bg = colorHex(decoded.bg);
  cell.fgRGB = colorRgb(decoded.fg);
  cell.bgRGB = colorRgb(decoded.bg);
  cell.modifiers = decoded.modifiers;
  cell.empty = decoded.empty;
  cell.opacity = exactOpacity ?? decoded.opacity;
}

export function applyMaskToBuffer(
  buffer: Uint8Array,
  index: number,
  source: Cell,
  mask: CellMask,
  sideTable: string[],
): void {
  if (source.empty) return;
  const offset = index * CELL_STRIDE;
  if (mask.char) {
    const code = encodeChar(source.char, sideTable);
    buffer[offset + OFF_CHAR] = code & 0xff;
    buffer[offset + OFF_CHAR + 1] = (code >> 8) & 0xff;
  }
  if (mask.fg) {
    writeMaskedColor(
      buffer,
      offset,
      OFF_FG_R,
      FLAG_FG_SET,
      source.fg,
      source.fgRGB,
    );
  }
  if (mask.bg) {
    writeMaskedColor(
      buffer,
      offset,
      OFF_BG_R,
      FLAG_BG_SET,
      source.bg,
      source.bgRGB,
    );
  }
  if (mask.modifiers) {
    const existing = byteAt(buffer, offset + OFF_FLAGS);
    buffer[offset + OFF_FLAGS] =
      (existing & FLAG_EMPTY) | encodeModifiers(source.modifiers);
  }
  if (mask.alpha) {
    buffer[offset + OFF_FLAGS] =
      byteAt(buffer, offset + OFF_FLAGS) & ~FLAG_EMPTY;
    const alpha = byteAt(buffer, offset + OFF_ALPHA);
    buffer[offset + OFF_ALPHA] =
      (alpha & ~OPACITY_MASK) | encodeOpacity(source.opacity ?? 1);
  }
}
