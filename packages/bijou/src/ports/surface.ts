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
  /** Set a cell at (x, y). No-op if out of bounds. */
  set(x: number, y: number, cell: Cell, mask?: CellMask): void;

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

/**
 * Apply a source cell to a target cell using a mask, respecting 'empty' transparency.
 *
 * @param target - The existing cell to be modified.
 * @param source - The cell containing the new values.
 * @param mask   - Determines which fields of `source` are applied to `target`.
 * @returns A new Cell with the masked values applied.
 */
function applyMask(target: Cell, source: Cell, mask: CellMask): Cell {
  // Brush/Stamp behavior: if source is empty, do not modify the target.
  if (source.empty) return target;

  return {
    char: mask.char ? source.char : target.char,
    fg: mask.fg ? source.fg : target.fg,
    bg: mask.bg ? source.bg : target.bg,
    modifiers: mask.modifiers ? source.modifiers : target.modifiers,
    empty: mask.alpha ? (source.empty ?? false) : (target.empty ?? false),
    opacity: mask.alpha ? (source.opacity ?? 1) : (target.opacity ?? 1),
  };
}

/**
 * Factory for creating a blank surface.
 *
 * @param width - Width in columns.
 * @param height - Height in rows.
 * @param fill - Optional cell to fill the surface with (defaults to space).
 * @returns A new Surface instance.
 */
export function createSurface(width: number, height: number, fill?: Cell): Surface {
  const w = Math.max(0, Math.floor(width));
  const h = Math.max(0, Math.floor(height));
  const size = w * h;
  const defaultCell: Cell = fill ?? { char: ' ', empty: true };
  const cells: Cell[] = Array.from({ length: size }, () => ({ ...defaultCell }));

  const surface: Surface = {
    width: w,
    height: h,
    cells,

    clear() {
      for (let i = 0; i < cells.length; i++) {
        cells[i] = { ...defaultCell };
      }
    },

    get(x, y, mask = FULL_MASK) {
      if (x < 0 || x >= w || y < 0 || y >= h) {
        return { char: ' ', empty: true };
      }
      return maskCell(cells[y * w + x]!, mask);
    },
    set(x, y, cell, mask = FULL_MASK) {
      if (x < 0 || x >= w || y < 0 || y >= h) return;
      const idx = y * w + x;
      cells[idx] = applyMask(cells[idx]!, cell, mask);
    },

    fill(cell, fx = 0, fy = 0, fw = w, fh = h, mask = FULL_MASK) {
      const xStart = Math.max(0, fx);
      const yStart = Math.max(0, fy);
      const xEnd = Math.min(w, xStart + fw);
      const yEnd = Math.min(h, yStart + fh);

      for (let y = yStart; y < yEnd; y++) {
        for (let x = xStart; x < xEnd; x++) {
          const idx = y * w + x;
          cells[idx] = applyMask(cells[idx]!, cell, mask);
        }
      }
    },

    blit(source, dx, dy, sx = 0, sy = 0, sw = source.width, sh = source.height, mask = FULL_MASK) {
      const xStart = Math.max(0, dx);
      const yStart = Math.max(0, dy);
      const srcXStart = sx + (xStart - dx);
      const srcYStart = sy + (yStart - dy);

      const blitW = Math.min(w - xStart, sw - (srcXStart - sx));
      const blitH = Math.min(h - yStart, sh - (srcYStart - sy));

      if (blitW <= 0 || blitH <= 0) return;

      for (let i = 0; i < blitH; i++) {
        const targetY = yStart + i;
        const sourceY = srcYStart + i;
        for (let j = 0; j < blitW; j++) {
          const targetX = xStart + j;
          const sourceX = srcXStart + j;
          const tIdx = targetY * w + targetX;
          const sIdx = sourceY * source.width + sourceX;
          cells[tIdx] = applyMask(cells[tIdx]!, source.cells[sIdx]!, mask);
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
            cells[idx] = applyMask(cells[idx]!, transformedCell, mask);
          }
        }
      }
    },

    getRow(y, rx = 0, rw = w - rx, mask = FULL_MASK) {
      if (y < 0 || y >= h) return [];
      const xStart = Math.max(0, rx);
      const count = Math.min(w - xStart, rw);
      if (count <= 0) return [];
      return cells
        .slice(y * w + xStart, y * w + xStart + count)
        .map((c) => maskCell(c!, mask));
    },

    setRow(y, rowCells, sx = 0, mask = FULL_MASK) {
      if (y < 0 || y >= h) return;
      const xStart = Math.max(0, sx);
      const count = Math.min(w - xStart, rowCells.length);
      for (let i = 0; i < count; i++) {
        const idx = y * w + xStart + i;
        cells[idx] = applyMask(cells[idx]!, rowCells[i]!, mask);
      }
    },

    clone() {
      const s = createSurface(w, h);
      for (let i = 0; i < cells.length; i++) {
        s.cells[i] = { ...cells[i]! };
      }
      return s;
    },
  };

  return surface;
}
