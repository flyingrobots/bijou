import {
  FLAG_BG_SET,
  FLAG_DASHED,
  FLAG_FG_SET,
  OFF_ALPHA,
  OFF_BG_B,
  OFF_BG_G,
  OFF_BG_R,
  OFF_FG_B,
  OFF_FG_G,
  OFF_FG_R,
  OFF_FLAGS,
  UNDERLINE_DOTDASH,
  UNDERLINE_MASK,
} from './render/packed-cell.js';
import { PACKED_BIJOU_CELL_STRIDE } from './packed-bijou-cells-contract.js';
import { failPackedCells } from './packed-bijou-cells-schema.js';

export function validateCellColorsAndModifiers(bytes: readonly number[]): void {
  for (
    let offset = 0;
    offset < bytes.length;
    offset += PACKED_BIJOU_CELL_STRIDE
  ) {
    const alpha = byte(bytes, offset + OFF_ALPHA);
    validateAbsentColor(bytes, offset, alpha, true);
    validateAbsentColor(bytes, offset, alpha, false);
    const flags = byte(bytes, offset + OFF_FLAGS);
    if (
      (flags & FLAG_DASHED) !== 0 &&
      (flags & UNDERLINE_MASK) !== UNDERLINE_DOTDASH
    ) {
      failPackedCells(
        'invalid-modifier',
        `$.bytes[${String(offset + OFF_FLAGS)}]`,
        'dashed flag requires dotted/dashed underline bits',
      );
    }
  }
}

function validateAbsentColor(
  bytes: readonly number[],
  offset: number,
  alpha: number,
  foreground: boolean,
): void {
  const presence = foreground ? FLAG_FG_SET : FLAG_BG_SET;
  const channels = foreground
    ? [OFF_FG_R, OFF_FG_G, OFF_FG_B]
    : [OFF_BG_R, OFF_BG_G, OFF_BG_B];
  if ((alpha & presence) !== 0) return;
  const nonzero = channels.find(
    (channel) => byte(bytes, offset + channel) !== 0,
  );
  if (nonzero !== undefined) {
    failPackedCells(
      'invalid-color',
      `$.bytes[${String(offset + nonzero)}]`,
      'terminal-default color channels must be zero',
    );
  }
}

function byte(bytes: readonly number[], index: number): number {
  return bytes[index] ?? 0;
}
