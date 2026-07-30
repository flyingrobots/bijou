import type { WritePort } from '../../ports/index.js';
import {
  FLAG_BG_SET,
  FLAG_BOLD,
  FLAG_DASHED,
  FLAG_DIM,
  FLAG_FG_SET,
  FLAG_INVERSE,
  FLAG_STRIKETHROUGH,
  OFF_BG_R,
  OFF_FG_R,
} from './packed-cell.js';
import { byteAt } from './safe-read.js';
const textDecoder = new TextDecoder('utf-8');
let scratchOutput: Uint8Array | null = null;
export function acquirePackedOutputBuffer(
  supplied: Uint8Array | undefined, cellCount: number,
): Uint8Array {
  if (supplied !== undefined) return supplied;
  const needed = cellCount * 96 + 8192;
  if (scratchOutput == null || scratchOutput.length < needed) {
    scratchOutput = new Uint8Array(needed);
  }
  return scratchOutput;
}
export function flushPackedOutput(
  io: WritePort, buffer: Uint8Array, length: number,
): void {
  if (length === 0) return;
  if (io.writeBytes !== undefined) io.writeBytes(buffer, length);
  else io.write(textDecoder.decode(buffer.subarray(0, length)));
}
export function writeCursorBytes(
  buffer: Uint8Array, offset: number, x: number, y: number,
): number {
  buffer[offset] = 0x1b;
  buffer[offset + 1] = 0x5b;
  offset = writeDecimal(buffer, offset + 2, y + 1);
  buffer[offset++] = 0x3b;
  offset = writeDecimal(buffer, offset, x + 1);
  buffer[offset++] = 0x48;
  return offset;
}
export function writeSgrFromBuffer(
  output: Uint8Array, offset: number,
  source: Uint8Array, sourceOffset: number,
): number {
  offset = writeModifier(output, offset, 0x30);
  const flags = byteAt(source, sourceOffset + 8);
  const alpha = byteAt(source, sourceOffset + 9);
  if (alpha & FLAG_FG_SET) {
    offset = writeRgbPrefix(output, offset, 0x33);
    offset = writeRgb(output, offset, source, sourceOffset + OFF_FG_R);
  }
  if (alpha & FLAG_BG_SET) {
    offset = writeRgbPrefix(output, offset, 0x34);
    offset = writeRgb(output, offset, source, sourceOffset + OFF_BG_R);
  }
  if (flags & FLAG_BOLD) offset = writeModifier(output, offset, 0x31);
  if (flags & FLAG_DIM) offset = writeModifier(output, offset, 0x32);
  if (flags & FLAG_STRIKETHROUGH) {
    offset = writeModifier(output, offset, 0x39);
  }
  if (flags & FLAG_INVERSE) offset = writeModifier(output, offset, 0x37);
  const underline = (flags >> 4) & 0x03;
  if (underline === 1) offset = writeModifier(output, offset, 0x34);
  else if (underline === 2) offset = writeUnderline(output, offset, 0x33);
  else if (underline === 3) {
    offset = writeUnderline(
      output,
      offset,
      flags & FLAG_DASHED ? 0x35 : 0x34,
    );
  }
  return offset;
}
export function writeResetBytes(
  output: Uint8Array, offset: number,
): number {
  return writeModifier(output, offset, 0x30);
}
function writeDecimal(
  buffer: Uint8Array, offset: number, value: number,
): number {
  let remaining = value;
  let divisor =
    value >= 1000 ? 1000 : value >= 100 ? 100 : value >= 10 ? 10 : 1;
  do {
    const digit = (remaining / divisor) | 0;
    buffer[offset++] = 0x30 + digit;
    remaining -= digit * divisor;
    divisor /= 10;
  } while (divisor >= 1);
  return offset;
}
function writeRgb(
  output: Uint8Array,
  offset: number,
  source: Uint8Array,
  sourceOffset: number,
): number {
  offset = writeDecimal(output, offset, byteAt(source, sourceOffset));
  output[offset++] = 0x3b;
  offset = writeDecimal(output, offset, byteAt(source, sourceOffset + 1));
  output[offset++] = 0x3b;
  offset = writeDecimal(output, offset, byteAt(source, sourceOffset + 2));
  output[offset++] = 0x6d;
  return offset;
}
function writeRgbPrefix(
  output: Uint8Array,
  offset: number,
  colorCode: number,
): number {
  output[offset] = 0x1b;
  output[offset + 1] = 0x5b;
  output[offset + 2] = colorCode;
  output[offset + 3] = 0x38;
  output[offset + 4] = 0x3b;
  output[offset + 5] = 0x32;
  output[offset + 6] = 0x3b;
  return offset + 7;
}

function writeModifier(
  output: Uint8Array,
  offset: number,
  code: number,
): number {
  output[offset] = 0x1b;
  output[offset + 1] = 0x5b;
  output[offset + 2] = code;
  output[offset + 3] = 0x6d;
  return offset + 4;
}

function writeUnderline(
  output: Uint8Array,
  offset: number,
  style: number,
): number {
  output[offset] = 0x1b;
  output[offset + 1] = 0x5b;
  output[offset + 2] = 0x34;
  output[offset + 3] = 0x3a;
  output[offset + 4] = style;
  output[offset + 5] = 0x6d;
  return offset + 6;
}
