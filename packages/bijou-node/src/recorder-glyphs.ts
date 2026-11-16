import { fillRect, mixRgb, setPixel } from './recorder.part01.js';
import type { Rgb } from './recorder.part01.js';

/** Pixel target for one cell: the RGBA buffer, its size, and the cell's rectangle. */
interface CellTarget {
  readonly rgba: Uint8Array;
  readonly width: number;
  readonly height: number;
  readonly x: number;
  readonly y: number;
  readonly cw: number;
  readonly ch: number;
}

function fill(t: CellTarget, x0: number, y0: number, x1: number, y1: number, color: Rgb): void {
  const left = Math.round(x0);
  const top = Math.round(y0);
  fillRect(t.rgba, t.width, t.height, t.x + left, t.y + top, Math.round(x1) - left, Math.round(y1) - top, color);
}

// ── Block elements (U+2580–U+259F) ─────────────────────────────────────────

/** Quadrant bits: 1 upper-left, 2 upper-right, 4 lower-left, 8 lower-right. */
const QUADRANTS: Readonly<Record<string, number>> = {
  '▖': 4, '▗': 8, '▘': 1, '▙': 1 | 4 | 8, '▚': 1 | 8, '▛': 1 | 2 | 4, '▜': 1 | 2 | 8, '▝': 2, '▞': 2 | 4, '▟': 2 | 4 | 8,
};

const SHADES: Readonly<Record<string, number>> = { '░': 0.25, '▒': 0.5, '▓': 0.75 };

function drawBlock(t: CellTarget, char: string, fg: Rgb, bg: Rgb): boolean {
  const code = char.codePointAt(0) ?? 0;
  const { cw, ch } = t;
  if (code === 0x2580) fill(t, 0, 0, cw, ch / 2, fg);
  else if (code >= 0x2581 && code <= 0x2588) fill(t, 0, ch - ch * (code - 0x2580) / 8, cw, ch, fg);
  else if (code >= 0x2589 && code <= 0x258f) fill(t, 0, 0, cw * (0x2590 - code) / 8, ch, fg);
  else if (code === 0x2590) fill(t, cw / 2, 0, cw, ch, fg);
  else if (code === 0x2594) fill(t, 0, 0, cw, ch / 8, fg);
  else if (code === 0x2595) fill(t, cw - cw / 8, 0, cw, ch, fg);
  else if (char in SHADES) fill(t, 0, 0, cw, ch, mixRgb(bg, fg, SHADES[char] ?? 0.5));
  else if (char in QUADRANTS) {
    const bits = QUADRANTS[char] ?? 0;
    if (bits & 1) fill(t, 0, 0, cw / 2, ch / 2, fg);
    if (bits & 2) fill(t, cw / 2, 0, cw, ch / 2, fg);
    if (bits & 4) fill(t, 0, ch / 2, cw / 2, ch, fg);
    if (bits & 8) fill(t, cw / 2, ch / 2, cw, ch, fg);
  } else return false;
  return true;
}

// ── Braille patterns (U+2800–U+28FF) ───────────────────────────────────────

/** Dot n+1 for bit n, as [column, row] in the 2×4 braille grid. */
const BRAILLE_DOTS: readonly (readonly [number, number])[] = [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [0, 3], [1, 3]];

function drawBraille(t: CellTarget, char: string, fg: Rgb): boolean {
  const bits = (char.codePointAt(0) ?? 0) - 0x2800;
  if (bits < 0 || bits > 0xff) return false;
  const sw = t.cw / 2;
  const sh = t.ch / 4;
  const dw = Math.max(1, Math.floor(sw / 2));
  const dh = Math.max(1, Math.floor(sh / 2));
  BRAILLE_DOTS.forEach(([col, row], bit) => {
    if ((bits >> bit) & 1) {
      const x0 = Math.round(col * sw + (sw - dw) / 2);
      const y0 = Math.round(row * sh + (sh - dh) / 2);
      fill(t, x0, y0, x0 + dw, y0 + dh, fg);
    }
  });
  return true;
}

// ── Box drawing (U+2500–U+257F) ────────────────────────────────────────────

/** Arm weights up, right, down, left: 0 none, 1 light, 2 heavy, 3 double. */
const BOX_ARMS: Readonly<Record<string, string>> = {
  '─': '0101', '│': '1010', '┌': '0110', '┐': '0011', '└': '1100', '┘': '1001',
  '├': '1110', '┤': '1011', '┬': '0111', '┴': '1101', '┼': '1111',
  '╭': '0110', '╮': '0011', '╰': '1100', '╯': '1001', '╴': '0001', '╵': '1000', '╶': '0100', '╷': '0010',
  '━': '0202', '┃': '2020', '┏': '0220', '┓': '0022', '┗': '2200', '┛': '2002',
  '┣': '2220', '┫': '2022', '┳': '0222', '┻': '2202', '╋': '2222',
  '═': '0303', '║': '3030', '╔': '0330', '╗': '0033', '╚': '3300', '╝': '3003',
  '╠': '3330', '╣': '3033', '╦': '0333', '╩': '3303', '╬': '3333',
  '┄': '0101', '┈': '0101', '╌': '0101', '┆': '1010', '┊': '1010', '╎': '1010',
  '┅': '0202', '┉': '0202', '╍': '0202', '┇': '2020', '┋': '2020', '╏': '2020',
};

const DASHED = new Set(Array.from('┄┈╌┆┊╎┅┉╍┇┋╏'));

/** Draw one arm from the cell centre to an edge, as strokes offset across the arm's direction. */
function drawArm(t: CellTarget, dir: number, weight: number, dashed: boolean, fg: Rgb): void {
  const cx = Math.floor(t.cw / 2);
  const cy = Math.floor(t.ch / 2);
  const offsets = weight === 3 ? [-1, 1] : weight === 2 ? [-1, 0] : [0];
  const vertical = dir === 0 || dir === 2;
  const [from, to] = dir === 0 ? [0, cy] : dir === 1 ? [cx, t.cw - 1] : dir === 2 ? [cy, t.ch - 1] : [0, cx];
  for (const offset of offsets) {
    for (let p = from; p <= to; p++) {
      if (dashed && p % 4 >= 2) continue;
      const px = vertical ? cx + offset : p;
      const py = vertical ? p : cy + offset;
      setPixel(t.rgba, t.width, t.height, t.x + px, t.y + py, fg);
    }
  }
}

function drawBox(t: CellTarget, char: string, fg: Rgb): boolean {
  const arms = BOX_ARMS[char];
  if (arms === undefined) return false;
  const dashed = DASHED.has(char);
  Array.from(arms).forEach((weight, dir) => {
    if (weight !== '0') drawArm(t, dir, Number(weight), dashed, fg);
  });
  return true;
}

/**
 * Draw block elements, braille patterns and box-drawing characters geometrically, so they fill
 * and join across cells instead of falling back to the bitmap font. Returns false for other glyphs.
 */
export function drawGeometricGlyph(
  rgba: Uint8Array, width: number, height: number, x: number, y: number,
  cw: number, ch: number, char: string, fg: Rgb, bg: Rgb,
): boolean {
  const target: CellTarget = { rgba, width, height, x, y, cw, ch };
  return drawBlock(target, char, fg, bg) || drawBraille(target, char, fg) || drawBox(target, char, fg);
}
