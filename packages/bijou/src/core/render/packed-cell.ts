/**
 * Byte-packed cell encoding for zero-allocation surface rendering.
 *
 * Layout per cell: 10 bytes
 *   [0-1]  char (uint16 code point, or side-table index if >= SIDE_TABLE_THRESHOLD)
 *   [2]    fg R
 *   [3]    fg G
 *   [4]    fg B
 *   [5]    bg R
 *   [6]    bg G
 *   [7]    bg B
 *   [8]    flags bitfield
 *   [9]    alpha (opacity quantized to 0–255)
 *
 * Flags byte layout:
 *   bit 0: bold
 *   bit 1: dim
 *   bit 2: strikethrough
 *   bit 3: inverse
 *   bit 4: underline style (2 bits, 4–5):
 *          00 = none, 01 = underline, 10 = curly-underline, 11 = dotted/dashed
 *   bit 6: dashed-underline (disambiguates dotted vs dashed when bits 4–5 = 11)
 *   bit 7: empty
 *
 * A fg/bg of (0,0,0) with the DEFAULT_FG or DEFAULT_BG sentinel means
 * "terminal default" (undefined in the Cell interface). We use byte 255
 * in each channel as the sentinel since pure (255,255,255) white is
 * representable as (254,255,255) with negligible visual difference.
 * Actually — sentinels are tricky. Instead we use a separate bit
 * approach: we reserve two bits in a second flags byte... but we only
 * have 1 byte left (alpha). Let's use a simpler approach: store fg/bg
 * presence in the flags byte. We have bits to spare.
 *
 * Revised flags byte:
 *   bit 0: bold
 *   bit 1: dim
 *   bit 2: strikethrough
 *   bit 3: inverse
 *   bit 4-5: underline style (00=none, 01=underline, 10=curly, 11=dotted-or-dashed)
 *   bit 6: dashed (when underline style = 11)
 *   bit 7: empty
 *
 * We need fg_present and bg_present bits. Let's use the alpha byte:
 *   [9] bits 0-5: opacity (0–63, quantized from 0.0–1.0)
 *       bit 6: fg present (0 = terminal default, 1 = explicit RGB)
 *       bit 7: bg present (0 = terminal default, 1 = explicit RGB)
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

/** Parse '#rrggbb' into [r, g, b]. Returns undefined for invalid input. */
export function parseHex(hex: string): [number, number, number] | undefined {
  if (hex.length !== 7 || hex.charCodeAt(0) !== 0x23) return undefined;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return undefined;
  return [r, g, b];
}

/** Encode [r, g, b] back to '#rrggbb'. */
export function toHex(r: number, g: number, b: number): string {
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
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
  const code = char.codePointAt(0)!;
  // Single BMP codepoint that fits in uint16 and matches the full string
  if (code < SIDE_TABLE_THRESHOLD && String.fromCodePoint(code) === char) {
    return code;
  }
  // Multi-codepoint or astral: use side table
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

/** Check if two packed cells have the same style (fg, bg, flags — ignoring char and empty). */
export function packedStyleEqual(buf: Uint8Array, idxA: number, idxB: number): boolean {
  const offA = idxA * CELL_STRIDE;
  const offB = idxB * CELL_STRIDE;
  // Compare fg RGB, bg RGB, flags, and alpha (which includes fg/bg presence)
  for (let i = OFF_FG_R; i < CELL_STRIDE; i++) {
    if (buf[offA + i] !== buf[offB + i]) return false;
  }
  return true;
}
