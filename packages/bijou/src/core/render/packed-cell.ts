/**
 * Byte-packed cell encoding for zero-allocation surface rendering.
 *
 * Layout per cell: 10 bytes
 *   [0-1]  char (uint16 LE code point, or side-table index if >= SIDE_TABLE_THRESHOLD)
 *   [2-4]  fg R, G, B
 *   [5-7]  bg R, G, B
 *   [8]    flags bitfield
 *   [9]    alpha byte
 *
 * Flags byte [8]:
 *   bit 0: bold
 *   bit 1: dim
 *   bit 2: strikethrough
 *   bit 3: inverse
 *   bit 4-5: underline style (00=none, 01=underline, 10=curly, 11=dotted-or-dashed)
 *   bit 6: dashed (disambiguates dotted vs dashed when bits 4-5 = 11)
 *   bit 7: empty
 *
 * Alpha byte [9]:
 *   bits 0-5: opacity (0-63, quantized from 0.0-1.0)
 *   bit 6: fg present (0 = terminal default, 1 = explicit RGB)
 *   bit 7: bg present (0 = terminal default, 1 = explicit RGB)
 */

/** Bytes per packed cell. */
export const CELL_STRIDE = 10;

/** Offset of the char code (uint16 LE) within a cell. */
export const OFF_CHAR = 0;
/** Offset of fg R within a cell. */
export const OFF_FG_R = 2;
/** Offset of fg G within a cell. */
export const OFF_FG_G = 3;
/** Offset of fg B within a cell. */
export const OFF_FG_B = 4;
/** Offset of bg R within a cell. */
export const OFF_BG_R = 5;
/** Offset of bg G within a cell. */
export const OFF_BG_G = 6;
/** Offset of bg B within a cell. */
export const OFF_BG_B = 7;
/** Offset of the flags byte within a cell. */
export const OFF_FLAGS = 8;
/** Offset of the alpha/presence byte within a cell. */
export const OFF_ALPHA = 9;

// --- Flags byte bits ---
export const FLAG_BOLD          = 1 << 0;
export const FLAG_DIM           = 1 << 1;
export const FLAG_STRIKETHROUGH = 1 << 2;
export const FLAG_INVERSE       = 1 << 3;
/** Underline style occupies bits 4–5. */
export const UNDERLINE_SHIFT    = 4;
export const UNDERLINE_MASK     = 0b11 << UNDERLINE_SHIFT;
export const UNDERLINE_NONE     = 0b00 << UNDERLINE_SHIFT;
export const UNDERLINE_SOLID    = 0b01 << UNDERLINE_SHIFT;
export const UNDERLINE_CURLY    = 0b10 << UNDERLINE_SHIFT;
export const UNDERLINE_DOTDASH  = 0b11 << UNDERLINE_SHIFT;
/** When underline style = DOTDASH, this bit distinguishes dashed from dotted. */
export const FLAG_DASHED        = 1 << 6;
export const FLAG_EMPTY         = 1 << 7;

// --- Alpha byte bits ---
/** Opacity occupies bits 0–5 (0–63). */
export const OPACITY_MASK  = 0b00111111;
/** Bit 6: foreground color is explicitly set. */
export const FLAG_FG_SET   = 1 << 6;
/** Bit 7: background color is explicitly set. */
export const FLAG_BG_SET   = 1 << 7;

/** Threshold for side-table char indices (values >= this are side-table lookups). */
export const SIDE_TABLE_THRESHOLD = 0xF000;

// --- Modifier encoding ---

const MODIFIER_TO_FLAG: Record<string, number> = {
  'bold': FLAG_BOLD,
  'dim': FLAG_DIM,
  'strikethrough': FLAG_STRIKETHROUGH,
  'inverse': FLAG_INVERSE,
};

const MODIFIER_UNDERLINE_MAP: Record<string, number> = {
  'underline': UNDERLINE_SOLID,
  'curly-underline': UNDERLINE_CURLY,
  'dotted-underline': UNDERLINE_DOTDASH,
  'dashed-underline': UNDERLINE_DOTDASH | FLAG_DASHED,
};

/** Encode a modifier string array into the flags byte value. */
export function encodeModifiers(modifiers: readonly string[] | undefined): number {
  if (!modifiers || modifiers.length === 0) return 0;
  let flags = 0;
  for (const mod of modifiers) {
    const flag = MODIFIER_TO_FLAG[mod];
    if (flag !== undefined) {
      flags |= flag;
    } else {
      const underline = MODIFIER_UNDERLINE_MAP[mod];
      if (underline !== undefined) {
        // Clear previous underline bits, then set new ones
        flags = (flags & ~(UNDERLINE_MASK | FLAG_DASHED)) | underline;
      }
    }
  }
  return flags;
}

/** Decode the flags byte back into a modifier string array. Returns undefined if no modifiers. */
export function decodeModifiers(flags: number): string[] | undefined {
  const mods: string[] = [];
  if (flags & FLAG_BOLD) mods.push('bold');
  if (flags & FLAG_DIM) mods.push('dim');
  if (flags & FLAG_STRIKETHROUGH) mods.push('strikethrough');
  if (flags & FLAG_INVERSE) mods.push('inverse');

  const underlineStyle = flags & UNDERLINE_MASK;
  if (underlineStyle === UNDERLINE_SOLID) {
    mods.push('underline');
  } else if (underlineStyle === UNDERLINE_CURLY) {
    mods.push('curly-underline');
  } else if (underlineStyle === UNDERLINE_DOTDASH) {
    mods.push(flags & FLAG_DASHED ? 'dashed-underline' : 'dotted-underline');
  }

  return mods.length > 0 ? mods : undefined;
}

// --- Hex color encoding/decoding ---

/** Convert a hex digit char code to its numeric value (0–15). Returns -1 for invalid. */
function hexVal(c: number): number {
  // 0–9: 0x30–0x39, a–f: 0x61–0x66, A–F: 0x41–0x46
  if (c >= 48 && c <= 57) return c - 48;
  if (c >= 97 && c <= 102) return c - 87;
  if (c >= 65 && c <= 70) return c - 55;
  return -1;
}

/** Decode two hex digit char codes into a byte (0–255). Returns -1 for invalid. */
function hexPair(c1: number, c2: number): number {
  const hi = hexVal(c1);
  const lo = hexVal(c2);
  if (hi < 0 || lo < 0) return -1;
  return (hi << 4) | lo;
}

/** Reusable static tuple to avoid allocation in parseHex. */
const RGB_OUT: [number, number, number] = [0, 0, 0];

/**
 * Parse '#rrggbb' into [r, g, b].
 *
 * **WARNING: returns a static reusable tuple.** The returned array is
 * shared across all calls. Callers MUST read or destructure the values
 * before calling `parseHex` again. Holding a reference across another
 * `parseHex` call will see clobbered values.
 *
 * Zero-alloc: no slice(), no parseInt(), no intermediate strings.
 *
 * @returns A static [r, g, b] tuple, or undefined for invalid input.
 */
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

// Pre-computed lookup: byte value → 2-char hex string
const HEX_BYTE: string[] = new Array(256);
for (let i = 0; i < 256; i++) {
  HEX_BYTE[i] = (i < 16 ? '0' : '') + i.toString(16);
}

/**
 * Parse '#rrggbb' and write R, G, B directly into a Uint8Array at the
 * given offset. Returns true on success, false for invalid input.
 * Zero-alloc: no intermediate strings or tuples.
 */
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

/** Encode [r, g, b] to '#rrggbb'. Uses a lookup table — no toString(16) per call. */
export function toHex(r: number, g: number, b: number): string {
  return '#' + HEX_BYTE[r]! + HEX_BYTE[g]! + HEX_BYTE[b]!;
}

// --- Alpha encoding ---

/** Quantize opacity (0.0–1.0) into 6-bit value (0–63). */
export function encodeOpacity(opacity: number | undefined): number {
  if (opacity === undefined || opacity >= 1) return 63;
  if (opacity <= 0) return 0;
  return Math.round(opacity * 63);
}

/** Decode 6-bit opacity back to 0.0–1.0. */
export function decodeOpacity(quantized: number): number {
  if (quantized >= 63) return 1;
  if (quantized <= 0) return 0;
  return quantized / 63;
}

// --- Char encoding ---

/** Sentinel code for an empty-string char (double-width continuation cell). */
export const CHAR_EMPTY = 0;

/** Encode a character string into a uint16 value and optional side-table entry. */
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

/** Decode a uint16 char value back to a string. */
export function decodeChar(code: number, sideTable: readonly string[]): string {
  if (code === CHAR_EMPTY) return '';
  if (code >= SIDE_TABLE_THRESHOLD) {
    const idx = code - SIDE_TABLE_THRESHOLD;
    return sideTable[idx] ?? ' ';
  }
  return String.fromCodePoint(code);
}

// --- Bulk cell read/write ---

/** Write a Cell into the packed buffer at the given cell index. */
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

/** Compare two packed cells for equality. */
export function packedCellsEqual(buf: Uint8Array, idxA: number, idxB: number): boolean {
  const offA = idxA * CELL_STRIDE;
  const offB = idxB * CELL_STRIDE;
  for (let i = 0; i < CELL_STRIDE; i++) {
    if (buf[offA + i] !== buf[offB + i]) return false;
  }
  return true;
}

/** Compare two packed cells across different buffers. */
export function packedCellsEqualCross(
  bufA: Uint8Array, idxA: number,
  bufB: Uint8Array, idxB: number,
): boolean {
  const offA = idxA * CELL_STRIDE;
  const offB = idxB * CELL_STRIDE;
  for (let i = 0; i < CELL_STRIDE; i++) {
    if (bufA[offA + i] !== bufB[offB + i]) return false;
  }
  return true;
}

/** Check if two packed cells have the same style (fg, bg, flags, alpha — ignoring char). */
export function packedStyleEqual(buf: Uint8Array, idxA: number, idxB: number): boolean {
  const offA = idxA * CELL_STRIDE;
  const offB = idxB * CELL_STRIDE;
  // Compare from OFF_FG_R through end: fg RGB, bg RGB, flags (including
  // modifiers and the empty bit), and alpha (opacity + fg/bg presence).
  for (let i = OFF_FG_R; i < CELL_STRIDE; i++) {
    if (buf[offA + i] !== buf[offB + i]) return false;
  }
  return true;
}
