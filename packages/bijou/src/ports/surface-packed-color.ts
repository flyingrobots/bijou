import {
  isResolvedColor,
  type ColorRef,
} from '../core/theme/color.js';
import {
  OFF_ALPHA,
  OFF_BG_R,
  OFF_FG_R,
} from '../core/render/packed-cell.js';
import { byteAt } from '../core/render/safe-read.js';
import type { Cell } from './surface-cell.js';

export function writeColorRefInto(
  reference: ColorRef | undefined,
  rgb: readonly [number, number, number] | undefined,
  output: Uint8Array,
  offset: number,
): boolean {
  if (rgb !== undefined) {
    output[offset] = rgb[0];
    output[offset + 1] = rgb[1];
    output[offset + 2] = rgb[2];
    return true;
  }
  if (reference == null) return false;
  if (isResolvedColor(reference)) {
    output[offset] = reference.rgb[0];
    output[offset + 1] = reference.rgb[1];
    output[offset + 2] = reference.rgb[2];
    return true;
  }
  return inlineHexRgb(reference, output, offset);
}

export function writeMaskedColor(
  buffer: Uint8Array,
  cellOffset: number,
  colorOffset: typeof OFF_FG_R | typeof OFF_BG_R,
  presentFlag: number,
  reference: Cell['fg'],
  rgb: Cell['fgRGB'],
): void {
  const alphaOffset = cellOffset + OFF_ALPHA;
  if (writeColorRefInto(reference, rgb, buffer, cellOffset + colorOffset)) {
    buffer[alphaOffset] = byteAt(buffer, alphaOffset) | presentFlag;
    return;
  }
  clearRgb(buffer, cellOffset + colorOffset);
  buffer[alphaOffset] = byteAt(buffer, alphaOffset) & ~presentFlag;
}

export function clearRgb(buffer: Uint8Array, offset: number): void {
  buffer[offset] = 0;
  buffer[offset + 1] = 0;
  buffer[offset + 2] = 0;
}

function inlineHexRgb(
  hex: string,
  output: Uint8Array,
  offset: number,
): boolean {
  if (hex.length !== 7) return false;
  output[offset] =
    (hexDigit(hex.charCodeAt(1)) << 4) | hexDigit(hex.charCodeAt(2));
  output[offset + 1] =
    (hexDigit(hex.charCodeAt(3)) << 4) | hexDigit(hex.charCodeAt(4));
  output[offset + 2] =
    (hexDigit(hex.charCodeAt(5)) << 4) | hexDigit(hex.charCodeAt(6));
  return true;
}

function hexDigit(code: number): number {
  if (code >= 97) return code - 87;
  if (code >= 65) return code - 55;
  return code - 48;
}
