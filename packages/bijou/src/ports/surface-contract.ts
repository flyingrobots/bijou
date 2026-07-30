import type { Cell, CellMask } from './surface-cell.js';
import type { Matrix3x3, TransformOptions } from './surface-transform.js';

export interface Surface {
  /** Width in columns. */
  readonly width: number;
  /** Height in rows. */
  readonly height: number;
  /** Flattened cell array indexed by `y * width + x`. */
  readonly cells: Cell[];
  /** Reset every cell to the default empty state. */
  clear(): void;
  /** Read a masked cell, returning an empty cell outside the surface. */
  get(x: number, y: number, mask?: CellMask): Cell;
  /** Write a masked cell; coordinates outside the surface are ignored. */
  set(x: number, y: number, cell: Cell, mask?: CellMask): void;
  /**
   * Write numeric color channels directly into the packed buffer.
   *
   * This allocation-free path avoids the color parsing performed by
   * {@link set}. A red channel of `-1` selects the terminal default.
   */
  setRGB(
    x: number,
    y: number,
    char: number | string,
    fgR: number,
    fgG: number,
    fgB: number,
    bgR: number,
    bgG: number,
    bgB: number,
    flags?: number,
  ): void;
  /** Fill a rectangular region, defaulting to the complete surface. */
  fill(
    cell: Cell,
    x?: number,
    y?: number,
    width?: number,
    height?: number,
    mask?: CellMask,
  ): void;
  /** Copy a rectangular region from another surface. */
  blit(
    source: Surface,
    x: number,
    y: number,
    sourceX?: number,
    sourceY?: number,
    sourceWidth?: number,
    sourceHeight?: number,
    mask?: CellMask,
  ): void;
  /** Apply an affine transformation from another surface. */
  transform(
    source: Surface,
    matrix: Matrix3x3,
    options?: TransformOptions,
  ): void;
  /** Read a masked horizontal span of cells. */
  getRow(y: number, x?: number, width?: number, mask?: CellMask): Cell[];
  /** Write a masked horizontal span of cells. */
  setRow(y: number, cells: Cell[], x?: number, mask?: CellMask): void;
  /** Create a deep copy of this surface. */
  clone(): Surface;
}

export interface PackedSurface extends Surface {
  /** Raw `CELL_STRIDE`-byte cells in row-major order. */
  readonly buffer: Uint8Array;
  /** Multi-codepoint graphemes referenced by packed character indexes. */
  readonly sideTable: string[];
  /**
   * One render-dirty bit per cell. The union of the front and back surface
   * bitmaps identifies both new paints and cells that require erasure.
   */
  readonly renderDirtyWords: Uint32Array;
  /** Mark every cell for lazy decode and rendering. */
  markAllDirty(): void;
  /** Clear render-dirty bits without mutating packed cell bytes. */
  markAllRenderClean(): void;
}

/** Return whether a surface exposes Bijou's packed storage contract. */
export function isPackedSurface(surface: Surface): surface is PackedSurface {
  return 'buffer' in surface && surface.buffer instanceof Uint8Array;
}
