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
  encodeChar, decodeChar,
  encodeModifiers, decodeModifiers,
  encodeOpacity, decodeOpacity,
  parseHex, toHex,
  packCell,
} from '../core/render/packed-cell.js';

/** Encode a Cell into the packed buffer and sync the cell object. */
function encodeCellIntoBuf(
  buf: Uint8Array,
  idx: number,
  cell: Cell,
  sideTable: string[],
): void {
  const charCode = encodeChar(cell.char, sideTable);
  const fgParsed = cell.fg ? parseHex(cell.fg) : undefined;
  const bgParsed = cell.bg ? parseHex(cell.bg) : undefined;
  const flags = encodeModifiers(cell.modifiers) | (cell.empty ? FLAG_EMPTY : 0);
  const opacity = encodeOpacity(cell.opacity);
  packCell(
    buf, idx, charCode,
    fgParsed ? fgParsed[0] : 0, fgParsed ? fgParsed[1] : 0, fgParsed ? fgParsed[2] : 0, fgParsed !== undefined,
    bgParsed ? bgParsed[0] : 0, bgParsed ? bgParsed[1] : 0, bgParsed ? bgParsed[2] : 0, bgParsed !== undefined,
    flags,
    opacity,
  );
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
    const fg = source.fg ? parseHex(source.fg) : undefined;
    buf[off + OFF_FG_R] = fg ? fg[0] : 0;
    buf[off + OFF_FG_G] = fg ? fg[1] : 0;
    buf[off + OFF_FG_B] = fg ? fg[2] : 0;
    const alpha = buf[off + OFF_ALPHA]!;
    buf[off + OFF_ALPHA] = fg ? (alpha | FLAG_FG_SET) : (alpha & ~FLAG_FG_SET);
  }
  if (mask.bg) {
    const bg = source.bg ? parseHex(source.bg) : undefined;
    buf[off + OFF_BG_R] = bg ? bg[0] : 0;
    buf[off + OFF_BG_G] = bg ? bg[1] : 0;
    buf[off + OFF_BG_B] = bg ? bg[2] : 0;
    const alpha = buf[off + OFF_ALPHA]!;
    buf[off + OFF_ALPHA] = bg ? (alpha | FLAG_BG_SET) : (alpha & ~FLAG_BG_SET);
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
      const exactOpacity = cells[idx]!.opacity;
      syncCellFromBuf(cells[idx]!, buf, idx, sideTable, exactOpacity);
      dirtyWords[idx >> 5]! = word & ~bit;
    }
  }

  function markAllClean(): void {
    dirtyWords.fill(0);
  }

  const surface: PackedSurface = {
    width: w,
    height: h,
    cells,
    buffer: buf,
    sideTable,

    clear() {
      for (let i = 0; i < size; i++) {
        encodeCellIntoBuf(buf, i, defaultCell, sideTable);
        copyCellInto(cells[i]!, defaultCell);
      }
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
      const idx = y * w + x;
      applyMaskToBuf(buf, idx, cell, mask, sideTable);
      // Preserve exact opacity on the cell to avoid quantization drift
      if (!cell.empty && mask.alpha) {
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
      markDirty(idx);
    },

    fill(cell, fx = 0, fy = 0, fw = w, fh = h, mask = FULL_MASK) {
      const xStart = Math.max(0, fx);
      const yStart = Math.max(0, fy);
      const xEnd = Math.min(w, xStart + fw);
      const yEnd = Math.min(h, yStart + fh);

      for (let y = yStart; y < yEnd; y++) {
        for (let x = xStart; x < xEnd; x++) {
          const idx = y * w + x;
          applyMaskToBuf(buf, idx, cell, mask, sideTable);
          markDirty(idx);
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

      for (let i = 0; i < blitH; i++) {
        const targetY = yStart + i;
        const sourceY = srcYStart + i;
        const tRowOffset = targetY * w;

        for (let j = 0; j < blitW; j++) {
          const targetX = xStart + j;
          const sourceX = srcXStart + j;
          const tIdx = tRowOffset + targetX;
          // Read through get() to ensure source cell is decoded if packed
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
      s.buffer.set(buf);
      // Mark everything dirty so cells decode lazily from copied buffer
      const sDirty = new Uint32Array(Math.ceil(size / 32));
      sDirty.fill(0xFFFFFFFF);
      // Can't access clone's dirtyWords directly — use the cells path
      for (let i = 0; i < size; i++) {
        syncCellFromBuf(s.cells[i]!, s.buffer, i, s.sideTable);
      }
      return s;
    },
  };

  return surface;
}
