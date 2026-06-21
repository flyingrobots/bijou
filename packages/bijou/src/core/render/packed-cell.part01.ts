export const CELL_STRIDE = 10;
export const OFF_CHAR = 0;
export const OFF_FG_R = 2;
export const OFF_FG_G = 3;
export const OFF_FG_B = 4;
export const OFF_BG_R = 5;
export const OFF_BG_G = 6;
export const OFF_BG_B = 7;
export const OFF_FLAGS = 8;
export const OFF_ALPHA = 9;
export const FLAG_BOLD          = 1 << 0;
export const FLAG_DIM           = 1 << 1;
export const FLAG_STRIKETHROUGH = 1 << 2;
export const FLAG_INVERSE       = 1 << 3;
export const UNDERLINE_SHIFT    = 4;
export const UNDERLINE_MASK     = 0b11 << UNDERLINE_SHIFT;
export const UNDERLINE_NONE     = 0b00 << UNDERLINE_SHIFT;
export const UNDERLINE_SOLID    = 0b01 << UNDERLINE_SHIFT;
export const UNDERLINE_CURLY    = 0b10 << UNDERLINE_SHIFT;
export const UNDERLINE_DOTDASH  = 0b11 << UNDERLINE_SHIFT;
export const FLAG_DASHED        = 1 << 6;
export const FLAG_EMPTY         = 1 << 7;
export const OPACITY_MASK  = 0b00111111;
export const FLAG_FG_SET   = 1 << 6;
export const FLAG_BG_SET   = 1 << 7;
export const SIDE_TABLE_THRESHOLD = 0xF000;
export const MODIFIER_TO_FLAG: Record<string, number> = {
  'bold': FLAG_BOLD,
  'dim': FLAG_DIM,
  'strikethrough': FLAG_STRIKETHROUGH,
  'inverse': FLAG_INVERSE,
};
export const MODIFIER_UNDERLINE_MAP: Record<string, number> = {
  'underline': UNDERLINE_SOLID,
  'curly-underline': UNDERLINE_CURLY,
  'dotted-underline': UNDERLINE_DOTDASH,
  'dashed-underline': UNDERLINE_DOTDASH | FLAG_DASHED,
};
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
export function hexVal(c: number): number {
  // 0–9: 0x30–0x39, a–f: 0x61–0x66, A–F: 0x41–0x46
  if (c >= 48 && c <= 57) return c - 48;
  if (c >= 97 && c <= 102) return c - 87;
  if (c >= 65 && c <= 70) return c - 55;
  return -1;
}
export function hexPair(c1: number, c2: number): number {
  const hi = hexVal(c1);
  const lo = hexVal(c2);
  if (hi < 0 || lo < 0) return -1;
  return (hi << 4) | lo;
}
export const RGB_OUT: [number, number, number] = [0, 0, 0];
