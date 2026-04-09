/**
 * Core types for buffered terminal rendering in Bijou v3.
 *
 * A Surface is a 2D grid of Cells. Each Cell is a self-contained unit
 * of terminal output (character + styling).
 */

/**
 * A single terminal character cell.
 */
export interface Cell {
  /** The character to display. Must be a single grapheme. */
  char: string;
  /** Foreground hex color (e.g. '#ffffff'). Undefined = terminal default. */
  fg?: string;
  /** Background hex color (e.g. '#000000'). Undefined = terminal default. */
  bg?: string;
  /**
   * Pre-parsed foreground RGB channels `[r, g, b]` (0–255 each).
   * When present, the hot path skips hex string parsing of `fg`
   * entirely. If both `fg` and `fgRGB` are present, `fgRGB` wins.
   * Populated automatically by theme resolution for theme tokens;
   * components can also set this directly for cached or computed
   * colors.
   */
  fgRGB?: readonly [number, number, number];
  /**
   * Pre-parsed background RGB channels `[r, g, b]` (0–255 each).
   * See `fgRGB`. If both `bg` and `bgRGB` are present, `bgRGB` wins.
   */
  bgRGB?: readonly [number, number, number];
  /** Text modifiers (bold, dim, underline, etc.). */
  modifiers?: string[];
  /**
   * Whether this cell is 'empty' (transparent).
   * When true, this cell is ignored during blit/fill operations (acting as a brush hole).
   */
  empty?: boolean;
  /**
   * Opacity of the cell (0.0 to 1.0).
   * Used for alpha blending colors during post-processing.
   */
  opacity?: number;
}

/**
 * A mask determining which properties of a cell are affected by an operation.
 */
export interface CellMask {
  /** Whether to affect the character. */
  char?: boolean;
  /** Whether to affect the foreground color. */
  fg?: boolean;
  /** Whether to affect the background color. */
  bg?: boolean;
  /** Whether to affect the text modifiers. */
  modifiers?: boolean;
  /** Whether to affect the empty/opacity flags. */
  alpha?: boolean;
}

/** A mask that affects all properties of a cell. */
export const FULL_MASK: CellMask = { 
  char: true, 
  fg: true, 
  bg: true, 
  modifiers: true, 
  alpha: true 
};

/**
 * A rectangular area in terminal coordinates.
 */
export interface LayoutRect {
  /** 0-based column index. */
  x: number;
  /** 0-based row index. */
  y: number;
  /** Width in columns. */
  width: number;
  /** Height in rows. */
  height: number;
}

/**
 * A node in the layout tree.
 */
export interface LayoutNode {
  /** Unique identifier for this layout node. Matches CSS #id. */
  id?: string;
  /** Component type name. Matches CSS type selectors (e.g. 'Badge'). */
  type?: string;
  /** List of CSS class names. Matches CSS .class selectors. */
  classes?: string[];
  /** The calculated rectangle for this node. */
  rect: LayoutRect;
  /** Child layout nodes. */
  children: LayoutNode[];
  /** Optional surface (texture) to be painted at this node's position. */
  surface?: Surface;
}

/**
 * Interface for a layout engine (e.g. Flex, Grid).
 */
export interface LayoutEngine<Options, Child> {
  /** Calculate the layout tree for a given set of options and children. */
  calculate(options: Options, children: Child[], bounds: LayoutRect): LayoutNode;
}

/**
 * Options for a surface transformation (rotation, scaling, etc.).
 */
export interface TransformOptions {
  /** 
   * Optional map to swap characters during rotation (e.g. {'|': '-'} for 90deg).
   * Bijou provides a default map for standard box-drawing and line-art characters.
   */
  charMap?: Record<string, string>;
  /** 
   * Whether to blend colors during scaling/rotation (requires hex math).
   * Default: false (nearest-neighbor).
   */
  interpolateColors?: boolean;
  /** Mask to apply during the transform. Default: FULL_MASK. */
  mask?: CellMask;
}

/**
 * A 3x3 Affine Transformation Matrix (flattened as [a, b, c, d, tx, ty]).
 * Used for scale, rotate, skew, and translate.
 */
export type Matrix3x3 = [number, number, number, number, number, number];

/**
 * A rectangular grid of cells.
 */
export interface Surface {
  /** Width in columns. */
  readonly width: number;
  /** Height in rows. */
  readonly height: number;
  /** Flattened cell array (index = y * width + x). */
  readonly cells: Cell[];

  /** Reset all cells in the surface to the default empty state. */
  clear(): void;

  /** Get a cell at (x, y). Returns an empty cell if out of bounds. Apply optional mask. */
  get(x: number, y: number, mask?: CellMask): Cell;
  /**
   * Set a cell at (x, y). No-op if out of bounds.
   *
   * This convenience API parses hex color strings on every call.
   * For hot rendering paths (full-screen redraws, gradients, animation
   * frames), use {@link setRGB} instead — it writes numeric RGB values
   * directly into the packed buffer with zero string parsing.
   */
  set(x: number, y: number, cell: Cell, mask?: CellMask): void;

  /**
   * Zero-allocation cell write for hot rendering paths.
   *
   * Writes a character and numeric RGB colors directly into the packed
   * byte buffer — no hex string parsing, no Cell object allocation.
   * Roughly 10–50x faster than {@link set} for per-cell writes.
   *
   * @param x - Column (0-based).
   * @param y - Row (0-based).
   * @param char - Character code point (e.g. `0x2588` for `█`), or a
   *   string that will be encoded once.
   * @param fgR - Foreground red (0–255), or -1 for terminal default.
   * @param fgG - Foreground green (0–255).
   * @param fgB - Foreground blue (0–255).
   * @param bgR - Background red (0–255), or -1 for terminal default.
   * @param bgG - Background green (0–255).
   * @param bgB - Background blue (0–255).
   * @param flags - Modifier flags bitfield (see packed-cell.ts constants).
   */
  setRGB(
    x: number, y: number,
    char: number | string,
    fgR: number, fgG: number, fgB: number,
    bgR: number, bgG: number, bgB: number,
    flags?: number,
  ): void;

  /** Fill a rectangular region with a specific cell. Defaults to entire surface. */
  fill(cell: Cell, x?: number, y?: number, w?: number, h?: number, mask?: CellMask): void;
  /** Copy a region from another surface onto this one at (x, y). */
  blit(
    source: Surface,
    x: number,
    y: number,
    srcX?: number,
    srcY?: number,
    srcW?: number,
    srcH?: number,
    mask?: CellMask,
  ): void;

  /** 
   * Apply an affine transformation (rotate, scale, flip) to a source surface
   * and paint the result onto this surface.
   */
  transform(
    source: Surface,
    matrix: Matrix3x3,
    options?: TransformOptions,
  ): void;

  /** Get a horizontal span (row) of cells. Apply optional mask. */
  getRow(y: number, x?: number, w?: number, mask?: CellMask): Cell[];
  /** Set a horizontal span (row) of cells. */
  setRow(y: number, cells: Cell[], x?: number, mask?: CellMask): void;

  /** Create a deep clone of this surface. */
  clone(): Surface;
}

/**
 * Default character remapping table for 90/180/270 degree rotations
 * of common line-art and box-drawing characters.
 */
export const ROTATION_CHAR_MAP: Record<string, string> = {
  '|': '-', '-': '|',
  '/': '\\', '\\': '/',
  '┘': '┐', '┐': '┌', '┌': '└', '└': '┘',
  '┤': '┴', '┴': '├', '├': '┬', '┬': '┤',
  '▲': '▶', '▶': '▼', '▼': '◀', '◀': '▲',
};

/**
 * Sanitize a cell by applying a mask, returning only the requested properties.
 *
 * @param cell - The source cell to mask.
 * @param mask - The mask determining which fields to keep.
 * @returns A new Cell with only masked properties populated.
 */
function maskCell(cell: Cell, mask: CellMask): Cell {
  return {
    char: mask.char ? cell.char : ' ',
    fg: mask.fg ? cell.fg : undefined,
    bg: mask.bg ? cell.bg : undefined,
    modifiers: mask.modifiers ? cell.modifiers : undefined,
    empty: mask.alpha ? (cell.empty ?? false) : false,
    opacity: mask.alpha ? (cell.opacity ?? 1) : 1,
  };
}

function cloneCell(cell: Cell): Cell {
  return {
    char: cell.char,
    fg: cell.fg,
    bg: cell.bg,
    modifiers: cell.modifiers,
    empty: cell.empty,
    opacity: cell.opacity,
  };
}

function copyCellInto(target: Cell, source: Cell): void {
  target.char = source.char;
  target.fg = source.fg;
  target.bg = source.bg;
  target.modifiers = source.modifiers;
  target.empty = source.empty;
  target.opacity = source.opacity;
}

function isPackedSurface(s: Surface): s is PackedSurface {
  return 'buffer' in s && (s as any).buffer instanceof Uint8Array;
}

// ── Packed buffer helpers ────────────────────────────────

import {
  CELL_STRIDE,
  OFF_CHAR,
  OFF_FG_R, OFF_FG_G, OFF_FG_B,
  OFF_BG_R, OFF_BG_G, OFF_BG_B,
  OFF_FLAGS, OFF_ALPHA,
  FLAG_EMPTY,
  FLAG_FG_SET, FLAG_BG_SET,
  OPACITY_MASK,
  SIDE_TABLE_THRESHOLD,
  encodeChar, decodeChar,
  encodeModifiers, decodeModifiers,
  encodeOpacity, decodeOpacity,
  toHex,
  packCell,
} from '../core/render/packed-cell.js';

// --- Inline hex → RGB for maximum throughput ---

function hexD(c: number): number {
  if (c >= 97) return c - 87;
  if (c >= 65) return c - 55;
  return c - 48;
}

function inlineHexRGB(hex: string, out: Uint8Array, off: number): boolean {
  if (hex.length !== 7) return false;
  const c1 = hex.charCodeAt(1), c2 = hex.charCodeAt(2);
  const c3 = hex.charCodeAt(3), c4 = hex.charCodeAt(4);
  const c5 = hex.charCodeAt(5), c6 = hex.charCodeAt(6);
  out[off] = (hexD(c1) << 4) | hexD(c2);
  out[off + 1] = (hexD(c3) << 4) | hexD(c4);
  out[off + 2] = (hexD(c5) << 4) | hexD(c6);
  return true;
}

/** Encode a Cell into the packed buffer. */
function encodeCellIntoBuf(
  buf: Uint8Array,
  idx: number,
  cell: Cell,
  sideTable: string[],
): void {
  const off = idx * CELL_STRIDE;
  const charCode = encodeChar(cell.char, sideTable);
  buf[off + OFF_CHAR] = charCode & 0xFF;
  buf[off + OFF_CHAR + 1] = (charCode >> 8) & 0xFF;

  // Foreground: pre-parsed `fgRGB` wins over `fg` hex string.
  // Theme tokens populate fgRGB via resolve.ts populateThemeRGB(),
  // so theme-driven paints skip inlineHexRGB entirely.
  let alphaBits = 0;
  const fgRGB = cell.fgRGB;
  if (fgRGB !== undefined) {
    buf[off + OFF_FG_R] = fgRGB[0]!;
    buf[off + OFF_FG_G] = fgRGB[1]!;
    buf[off + OFF_FG_B] = fgRGB[2]!;
    alphaBits |= FLAG_FG_SET;
  } else if (cell.fg && inlineHexRGB(cell.fg, buf, off + OFF_FG_R)) {
    alphaBits |= FLAG_FG_SET;
  } else {
    buf[off + OFF_FG_R] = 0; buf[off + OFF_FG_G] = 0; buf[off + OFF_FG_B] = 0;
  }

  const bgRGB = cell.bgRGB;
  if (bgRGB !== undefined) {
    buf[off + OFF_BG_R] = bgRGB[0]!;
    buf[off + OFF_BG_G] = bgRGB[1]!;
    buf[off + OFF_BG_B] = bgRGB[2]!;
    alphaBits |= FLAG_BG_SET;
  } else if (cell.bg && inlineHexRGB(cell.bg, buf, off + OFF_BG_R)) {
    alphaBits |= FLAG_BG_SET;
  } else {
    buf[off + OFF_BG_R] = 0; buf[off + OFF_BG_G] = 0; buf[off + OFF_BG_B] = 0;
  }

  buf[off + OFF_FLAGS] = encodeModifiers(cell.modifiers) | (cell.empty ? FLAG_EMPTY : 0);
  buf[off + OFF_ALPHA] = (encodeOpacity(cell.opacity) & OPACITY_MASK) | alphaBits;
}

/** Decode a packed buffer cell into a Cell object. */
function decodeCellFromBuf(
  buf: Uint8Array,
  idx: number,
  sideTable: readonly string[],
): Cell {
  const off = idx * CELL_STRIDE;
  const charCode = buf[off + OFF_CHAR]! | (buf[off + OFF_CHAR + 1]! << 8);
  const alphaByte = buf[off + OFF_ALPHA]!;
  const flags = buf[off + OFF_FLAGS]!;
  const fgSet = (alphaByte & FLAG_FG_SET) !== 0;
  const bgSet = (alphaByte & FLAG_BG_SET) !== 0;
  return {
    char: decodeChar(charCode, sideTable),
    fg: fgSet ? toHex(buf[off + OFF_FG_R]!, buf[off + OFF_FG_G]!, buf[off + OFF_FG_B]!) : undefined,
    bg: bgSet ? toHex(buf[off + OFF_BG_R]!, buf[off + OFF_BG_G]!, buf[off + OFF_BG_B]!) : undefined,
    modifiers: decodeModifiers(flags & ~FLAG_EMPTY),
    empty: (flags & FLAG_EMPTY) !== 0,
    opacity: decodeOpacity(alphaByte & OPACITY_MASK),
  };
}

/** Sync a Cell object from the packed buffer (overwrite all fields). */
function syncCellFromBuf(
  cell: Cell,
  buf: Uint8Array,
  idx: number,
  sideTable: readonly string[],
  exactOpacity?: number,
): void {
  const decoded = decodeCellFromBuf(buf, idx, sideTable);
  cell.char = decoded.char;
  cell.fg = decoded.fg;
  cell.bg = decoded.bg;
  cell.modifiers = decoded.modifiers;
  cell.empty = decoded.empty;
  // Preserve exact float when available; use quantized only for buffer-decoded reads
  cell.opacity = exactOpacity ?? decoded.opacity;
}

/**
 * Apply a masked write of a source Cell into the packed buffer,
 * respecting empty-cell brush transparency.
 */
function applyMaskToBuf(
  buf: Uint8Array,
  idx: number,
  source: Cell,
  mask: CellMask,
  sideTable: string[],
): void {
  if (source.empty) return;
  const off = idx * CELL_STRIDE;

  if (mask.char) {
    const charCode = encodeChar(source.char, sideTable);
    buf[off + OFF_CHAR] = charCode & 0xFF;
    buf[off + OFF_CHAR + 1] = (charCode >> 8) & 0xFF;
  }
  if (mask.fg) {
    if (source.fg && inlineHexRGB(source.fg, buf, off + OFF_FG_R)) {
      buf[off + OFF_ALPHA] = buf[off + OFF_ALPHA]! | FLAG_FG_SET;
    } else {
      buf[off + OFF_FG_R] = 0; buf[off + OFF_FG_G] = 0; buf[off + OFF_FG_B] = 0;
      buf[off + OFF_ALPHA] = buf[off + OFF_ALPHA]! & ~FLAG_FG_SET;
    }
  }
  if (mask.bg) {
    if (source.bg && inlineHexRGB(source.bg, buf, off + OFF_BG_R)) {
      buf[off + OFF_ALPHA] = buf[off + OFF_ALPHA]! | FLAG_BG_SET;
    } else {
      buf[off + OFF_BG_R] = 0; buf[off + OFF_BG_G] = 0; buf[off + OFF_BG_B] = 0;
      buf[off + OFF_ALPHA] = buf[off + OFF_ALPHA]! & ~FLAG_BG_SET;
    }
  }
  if (mask.modifiers) {
    const modFlags = encodeModifiers(source.modifiers);
    const existing = buf[off + OFF_FLAGS]!;
    // Preserve the empty bit, replace modifier bits
    buf[off + OFF_FLAGS] = (existing & FLAG_EMPTY) | modFlags;
  }
  if (mask.alpha) {
    const existing = buf[off + OFF_FLAGS]!;
    buf[off + OFF_FLAGS] = source.empty
      ? (existing | FLAG_EMPTY)
      : (existing & ~FLAG_EMPTY);
    const alphaByte = buf[off + OFF_ALPHA]!;
    const opacityBits = encodeOpacity(source.opacity ?? 1);
    buf[off + OFF_ALPHA] = (alphaByte & ~OPACITY_MASK) | opacityBits;
  }
}

// ── Surface factory ─────────────────────────────────────

/**
 * Extended surface interface exposing the packed buffer for hot-path consumers.
 */
export interface PackedSurface extends Surface {
  /** Raw packed byte buffer. CELL_STRIDE bytes per cell, row-major. */
  readonly buffer: Uint8Array;
  /** Side table for multi-codepoint grapheme clusters. */
  readonly sideTable: readonly string[];
  /** Mark all cells as needing lazy decode from the buffer. */
  markAllDirty(): void;
}

/**
 * Factory for creating a blank surface.
 *
 * Internally backed by a packed Uint8Array (10 bytes per cell).
 * The Cell[] array is kept in sync for backward compatibility with
 * consumers that access .cells directly.
 *
 * @param width - Width in columns.
 * @param height - Height in rows.
 * @param fill - Optional cell to fill the surface with (defaults to space).
 * @returns A new Surface instance.
 */
export function createSurface(width: number, height: number, fill?: Cell): PackedSurface {
  const w = Math.max(0, Math.floor(width));
  const h = Math.max(0, Math.floor(height));
  const size = w * h;
  const defaultCell: Cell = fill ?? { char: ' ', empty: true };

  const sideTable: string[] = [];
  const buf = new Uint8Array(size * CELL_STRIDE);

  // Dirty bitmap: 1 bit per cell. When set, the Cell object is stale
  // and must be decoded from the buffer before reading.
  const dirtyWords = new Uint32Array(Math.ceil(size / 32));

  // Cell array: lazily decoded from the buffer on read.
  const cells: Cell[] = new Array(size);

  // Initialize buffer and cell array from the default cell
  for (let i = 0; i < size; i++) {
    encodeCellIntoBuf(buf, i, defaultCell, sideTable);
    cells[i] = cloneCell(defaultCell);
  }

  function markDirty(idx: number): void {
    dirtyWords[idx >> 5]! |= 1 << (idx & 31);
  }

  function ensureClean(idx: number): void {
    const word = dirtyWords[idx >> 5]!;
    const bit = 1 << (idx & 31);
    if (word & bit) {
      // Preserve the exact float opacity stored by set() to avoid quantization
      // drift. When set() marks dirty, it writes the caller's opacity to the
      // cell first. When markAllDirty() marks dirty (clone), the cell retains
      // whatever opacity it had, which is acceptable.
      const exactOpacity = cells[idx]!.opacity;
      syncCellFromBuf(cells[idx]!, buf, idx, sideTable, exactOpacity);
      dirtyWords[idx >> 5]! = word & ~bit;
    }
  }

  function markAllClean(): void {
    dirtyWords.fill(0);
  }

  function markAllDirty(): void {
    dirtyWords.fill(0xFFFFFFFF);
  }

  const surface: PackedSurface = {
    width: w,
    height: h,
    cells,
    buffer: buf,
    sideTable,
    markAllDirty,

    clear() {
      // Stamp the default cell template across the entire buffer
      if (size > 0) {
        encodeCellIntoBuf(buf, 0, defaultCell, sideTable);
        for (let i = 1; i < size; i++) {
          const off = i * CELL_STRIDE;
          for (let b = 0; b < CELL_STRIDE; b++) buf[off + b] = buf[b]!;
        }
      }
      for (let i = 0; i < size; i++) copyCellInto(cells[i]!, defaultCell);
      markAllClean();
    },

    get(x, y, mask = FULL_MASK) {
      if (x < 0 || x >= w || y < 0 || y >= h) {
        return { char: ' ', empty: true };
      }
      const idx = y * w + x;
      ensureClean(idx);
      return maskCell(cells[idx]!, mask);
    },

    set(x, y, cell, mask = FULL_MASK) {
      if (x < 0 || x >= w || y < 0 || y >= h) return;
      // Brush/stamp transparency: empty cells are no-ops for set().
      // This matches the original applyMaskInPlace behavior and is relied
      // on by blit, overlay composition, and component rendering.
      // To clear a cell, use fill({ char: ' ', empty: true }, x, y, 1, 1).
      if (cell.empty) return;
      const idx = y * w + x;
      if (mask === FULL_MASK) {
        encodeCellIntoBuf(buf, idx, cell, sideTable);
      } else {
        applyMaskToBuf(buf, idx, cell, mask, sideTable);
      }
      if (mask.alpha) {
        cells[idx]!.opacity = cell.opacity ?? 1;
      }
      markDirty(idx);
    },

    setRGB(x, y, char, fgR, fgG, fgB, bgR, bgG, bgB, flags = 0) {
      if (x < 0 || x >= w || y < 0 || y >= h) return;
      const idx = y * w + x;
      const charCode = typeof char === 'string'
        ? encodeChar(char, sideTable)
        : char;
      const fgSet = fgR >= 0;
      const bgSet = bgR >= 0;
      packCell(
        buf, idx, charCode,
        fgSet ? fgR : 0, fgSet ? fgG : 0, fgSet ? fgB : 0, fgSet,
        bgSet ? bgR : 0, bgSet ? bgG : 0, bgSet ? bgB : 0, bgSet,
        flags,
        63, // full opacity
      );
      // Sync cached opacity so ensureClean doesn't resurrect a stale value
      cells[idx]!.opacity = 1;
      markDirty(idx);
    },

    fill(cell, fx = 0, fy = 0, fw = w, fh = h, mask = FULL_MASK) {
      const xStart = Math.max(0, fx);
      const yStart = Math.max(0, fy);
      const xEnd = Math.min(w, xStart + fw);
      const yEnd = Math.min(h, yStart + fh);
      if (xStart >= xEnd || yStart >= yEnd) return;

      if (mask === FULL_MASK && !cell.empty) {
        // Encode template once, stamp it into every position
        const template = new Uint8Array(CELL_STRIDE);
        encodeCellIntoBuf(template, 0, cell, sideTable);
        for (let y = yStart; y < yEnd; y++) {
          for (let x = xStart; x < xEnd; x++) {
            const off = (y * w + x) * CELL_STRIDE;
            for (let b = 0; b < CELL_STRIDE; b++) buf[off + b] = template[b]!;
            dirtyWords[(y * w + x) >> 5]! |= 1 << ((y * w + x) & 31);
          }
        }
      } else {
        for (let y = yStart; y < yEnd; y++) {
          for (let x = xStart; x < xEnd; x++) {
            const idx = y * w + x;
            applyMaskToBuf(buf, idx, cell, mask, sideTable);
            markDirty(idx);
          }
        }
      }
    },

    blit(source, dx, dy, sx = 0, sy = 0, sw = source.width, sh = source.height, mask = FULL_MASK) {
      const sX = Math.max(0, sx);
      const sY = Math.max(0, sy);
      const sW = Math.min(sw - (sX - sx), source.width - sX);
      const sH = Math.min(sh - (sY - sy), source.height - sY);
      if (sW <= 0 || sH <= 0) return;

      const dX = dx + (sX - sx);
      const dY = dy + (sY - sy);
      const xStart = Math.max(0, dX);
      const yStart = Math.max(0, dY);
      const srcXStart = sX + (xStart - dX);
      const srcYStart = sY + (yStart - dY);
      const blitW = Math.min(w - xStart, sW - (srcXStart - sX));
      const blitH = Math.min(h - yStart, sH - (srcYStart - sY));
      if (blitW <= 0 || blitH <= 0) return;

      // Fast path: packed-to-packed with FULL_MASK — byte copy per cell
      const srcPacked = isPackedSurface(source);
      if (srcPacked && mask === FULL_MASK) {
        const sBuf = (source as PackedSurface).buffer;
        const sSide = (source as PackedSurface).sideTable;
        for (let i = 0; i < blitH; i++) {
          const targetY = yStart + i;
          const sourceY = srcYStart + i;
          const tRowBase = targetY * w;
          const sRowBase = sourceY * source.width;
          for (let j = 0; j < blitW; j++) {
            const sOff = (sRowBase + srcXStart + j) * CELL_STRIDE;
            // Skip empty source cells (brush transparency)
            if (sBuf[sOff + OFF_FLAGS]! & FLAG_EMPTY) continue;
            const tOff = (tRowBase + xStart + j) * CELL_STRIDE;
            // Copy 10 bytes directly
            for (let b = 0; b < CELL_STRIDE; b++) {
              buf[tOff + b] = sBuf[sOff + b]!;
            }
            // Re-encode side-table chars into target's side table
            const charCode = sBuf[sOff]! | (sBuf[sOff + 1]! << 8);
            if (charCode >= SIDE_TABLE_THRESHOLD) {
              const srcChar = sSide[charCode - SIDE_TABLE_THRESHOLD] ?? ' ';
              const tCharCode = encodeChar(srcChar, sideTable);
              buf[tOff + OFF_CHAR] = tCharCode & 0xFF;
              buf[tOff + OFF_CHAR + 1] = (tCharCode >> 8) & 0xFF;
            }
            markDirty(tRowBase + xStart + j);
          }
        }
        return;
      }

      // Slow path: decode source cells and re-encode
      for (let i = 0; i < blitH; i++) {
        const targetY = yStart + i;
        const sourceY = srcYStart + i;
        const tRowOffset = targetY * w;

        for (let j = 0; j < blitW; j++) {
          const targetX = xStart + j;
          const sourceX = srcXStart + j;
          const tIdx = tRowOffset + targetX;
          const srcCell = source.get(sourceX, sourceY);
          applyMaskToBuf(buf, tIdx, srcCell, mask, sideTable);
          markDirty(tIdx);
        }
      }
    },

    transform(source, matrix, options = {}) {
      const { charMap = {}, mask = FULL_MASK } = options;
      const [a, b, c, d, tx, ty] = matrix;
      const det = a * d - b * c;
      if (Math.abs(det) < 0.0001) return;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const srcX = Math.round((d * (x - tx) - b * (y - ty)) / det);
          const srcY = Math.round((a * (y - ty) - c * (x - tx)) / det);

          if (srcX >= 0 && srcX < source.width && srcY >= 0 && srcY < source.height) {
            const sourceCell = source.get(srcX, srcY);
            if (sourceCell.empty) continue;

            const transformedCell = { ...sourceCell };
            if (charMap[transformedCell.char]) {
              transformedCell.char = charMap[transformedCell.char]!;
            }

            const idx = y * w + x;
            applyMaskToBuf(buf, idx, transformedCell, mask, sideTable);
            markDirty(idx);
          }
        }
      }
    },

    getRow(y, rx = 0, rw = w - rx, mask = FULL_MASK) {
      if (y < 0 || y >= h) return [];
      const xStart = Math.max(0, rx);
      const count = Math.min(w - xStart, rw);
      if (count <= 0) return [];
      const base = y * w + xStart;
      for (let i = 0; i < count; i++) ensureClean(base + i);
      return cells
        .slice(base, base + count)
        .map((c) => maskCell(c!, mask));
    },

    setRow(y, rowCells, sx = 0, mask = FULL_MASK) {
      if (y < 0 || y >= h) return;
      const xStart = Math.max(0, sx);
      const count = Math.min(w - xStart, rowCells.length);
      for (let i = 0; i < count; i++) {
        const idx = y * w + xStart + i;
        applyMaskToBuf(buf, idx, rowCells[i]!, mask, sideTable);
        markDirty(idx);
      }
    },

    clone() {
      const s = createSurface(w, h);
      // Copy buffer wholesale — O(n) byte copy instead of per-cell encode
      s.buffer.set(buf);
      // Copy side-table entries into the clone.
      // includes() is O(n) per entry, but side tables are typically small
      // (only entries for multi-codepoint grapheme clusters above SIDE_TABLE_THRESHOLD).
      for (const entry of sideTable) {
        if (!(s.sideTable as string[]).includes(entry)) {
          (s.sideTable as string[]).push(entry);
        }
      }
      // Cells will decode lazily from the copied buffer
      s.markAllDirty();
      return s;
    },
  };

  return surface;
}
