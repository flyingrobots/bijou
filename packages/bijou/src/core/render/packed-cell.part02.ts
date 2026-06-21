import { CELL_STRIDE, FLAG_BG_SET, FLAG_FG_SET, OFF_ALPHA, OFF_BG_B, OFF_BG_G, OFF_BG_R, OFF_CHAR, OFF_FG_B, OFF_FG_G, OFF_FG_R, OFF_FLAGS, OPACITY_MASK, RGB_OUT, SIDE_TABLE_THRESHOLD, hexPair } from './packed-cell.part01.js';
export function parseHex(hex: string): [number, number, number] | undefined {
  if (hex.length !== 7 || hex.charCodeAt(0) !== 0x23) return undefined;
  const r = hexPair(hex.charCodeAt(1), hex.charCodeAt(2));
  const g = hexPair(hex.charCodeAt(3), hex.charCodeAt(4));
  const b = hexPair(hex.charCodeAt(5), hex.charCodeAt(6));
  if (r < 0 || g < 0 || b < 0) return undefined;
  RGB_OUT[0] = r;
  RGB_OUT[1] = g;
  RGB_OUT[2] = b;
  return RGB_OUT;
}
export const HEX_BYTE = Array.from({ length: 256 }, (_value, i) => (i < 16 ? '0' : '') + i.toString(16));
export function parseHexInto(hex: string, out: Uint8Array, off: number): boolean {
  if (hex.length !== 7 || hex.charCodeAt(0) !== 0x23) return false;
  const r = hexPair(hex.charCodeAt(1), hex.charCodeAt(2));
  const g = hexPair(hex.charCodeAt(3), hex.charCodeAt(4));
  const b = hexPair(hex.charCodeAt(5), hex.charCodeAt(6));
  if (r < 0 || g < 0 || b < 0) return false;
  out[off] = r;
  out[off + 1] = g;
  out[off + 2] = b;
  return true;
}
export function toHex(r: number, g: number, b: number): string {
  return '#' + (HEX_BYTE[r] ?? '00') + (HEX_BYTE[g] ?? '00') + (HEX_BYTE[b] ?? '00');
}
export function encodeOpacity(opacity: number | undefined): number {
  if (opacity === undefined || opacity >= 1) return 63;
  if (opacity <= 0) return 0;
  return Math.round(opacity * 63);
}
export function decodeOpacity(quantized: number): number {
  if (quantized >= 63) return 1;
  if (quantized <= 0) return 0;
  return quantized / 63;
}
export const CHAR_EMPTY = 0;
export function encodeChar(
  char: string,
  sideTable: string[],
): number {
  if (char.length === 0) return CHAR_EMPTY;
  // Fast path: single JS char — guaranteed single BMP codepoint
  if (char.length === 1) {
    const code = char.charCodeAt(0);
    if (code < SIDE_TABLE_THRESHOLD) return code;
  }
  // Slow path: multi-char string (astral plane, grapheme cluster, etc.)
  let idx = sideTable.indexOf(char);
  if (idx === -1) {
    idx = sideTable.length;
    sideTable.push(char);
  }
  return SIDE_TABLE_THRESHOLD + idx;
}
export function decodeChar(code: number, sideTable: readonly string[]): string {
  if (code === CHAR_EMPTY) return '';
  if (code >= SIDE_TABLE_THRESHOLD) {
    const idx = code - SIDE_TABLE_THRESHOLD;
    return sideTable[idx] ?? ' ';
  }
  return String.fromCodePoint(code);
}
export function packCell(
  buf: Uint8Array,
  cellIndex: number,
  charCode: number,
  fgR: number, fgG: number, fgB: number, fgSet: boolean,
  bgR: number, bgG: number, bgB: number, bgSet: boolean,
  flags: number,
  opacity: number,
): void {
  const off = cellIndex * CELL_STRIDE;
  // char as uint16 LE
  buf[off + OFF_CHAR] = charCode & 0xFF;
  buf[off + OFF_CHAR + 1] = (charCode >> 8) & 0xFF;
  // fg
  buf[off + OFF_FG_R] = fgR;
  buf[off + OFF_FG_G] = fgG;
  buf[off + OFF_FG_B] = fgB;
  // bg
  buf[off + OFF_BG_R] = bgR;
  buf[off + OFF_BG_G] = bgG;
  buf[off + OFF_BG_B] = bgB;
  // flags
  buf[off + OFF_FLAGS] = flags;
  // alpha byte: opacity in bits 0-5, fg/bg presence in bits 6-7
  buf[off + OFF_ALPHA] = (opacity & OPACITY_MASK)
    | (fgSet ? FLAG_FG_SET : 0)
    | (bgSet ? FLAG_BG_SET : 0);
}
