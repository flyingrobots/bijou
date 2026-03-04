/**
 * Rectangular layout region in terminal coordinates.
 */
export interface LayoutRect {
  /** Top row (0-based). */
  readonly row: number;
  /** Left column (0-based). */
  readonly col: number;
  /** Width in columns. */
  readonly width: number;
  /** Height in rows. */
  readonly height: number;
}
