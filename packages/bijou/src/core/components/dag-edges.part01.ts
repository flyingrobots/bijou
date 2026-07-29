/**
 * Edge routing primitives for the DAG renderer.
 *
 * Self-contained module with zero dag-* imports.
 * Provides the mutable grid used to route edges between node positions
 * and the junction-character lookup table.
 */

/** Cardinal direction for edge routing through grid cells. */
export type Dir = 'U' | 'D' | 'L' | 'R';
/** Glyph family used when converting routed edges into Unicode characters. */
export type EdgeGlyphStyle = 'single' | 'heavy' | 'double' | 'dashed';
/**
 * Mutable grid state used during edge routing.
 *
 * Each cell tracks which cardinal directions edges pass through it,
 * and `arrows` records arrowhead multiplicity by encoded position.
 */
export interface GridState {
  /** 2D array of direction sets, one per grid cell. */
  dirs: Set<Dir>[][];
  /** Encoded arrowhead positions with inbound-edge counts. */
  arrows: Map<number, number>;
  /** Number of rows in the grid. */
  rows: number;
  /** Number of columns in the grid. */
  cols: number;
}
export interface GridPoint {
  readonly row: number;
  readonly col: number;
}
export interface EdgeRoute {
  /** Routed path cells, including the destination arrow cell. */
  readonly path: readonly GridPoint[];
  /** Destination arrowhead cell. */
  readonly arrow: GridPoint;
}
/**
 * Encode a grid (row, col) pair into a single number for Set membership.
 *
 * Uses bitwise encoding `(row << 16) | col`, supporting up to 65535 rows and cols.
 *
 * @param row - Grid row index.
 * @param col - Grid column index.
 * @returns The encoded position as a single number.
 */
export function encodeArrowPos(row: number, col: number): number {
  return (row << 16) | col;
}
/**
 * Decode an encoded arrow position back into row and col.
 *
 * @param encoded - Value produced by `encodeArrowPos()`.
 * @returns Object with `row` and `col` fields.
 */
export function decodeArrowPos(encoded: number): { row: number; col: number } {
  return { row: encoded >>> 16, col: encoded & 0xffff };
}
/**
 * Lookup table mapping sorted direction-set keys to Unicode box-drawing characters.
 * For example, `'DR'` maps to `\u250c` (top-left corner).
 */
export const SINGLE_JUNCTION: Record<string, string> = {
  D: '\u2502',
  U: '\u2502',
  DU: '\u2502',
  L: '\u2500',
  R: '\u2500',
  LR: '\u2500',
  DR: '\u250c',
  DL: '\u2510',
  RU: '\u2514',
  LU: '\u2518',
  DRU: '\u251c',
  DLU: '\u2524',
  DLR: '\u252c',
  LRU: '\u2534',
  DLRU: '\u253c',
};
export const HEAVY_JUNCTION: Record<string, string> = {
  D: '\u2503',
  U: '\u2503',
  DU: '\u2503',
  L: '\u2501',
  R: '\u2501',
  LR: '\u2501',
  DR: '\u250f',
  DL: '\u2513',
  RU: '\u2517',
  LU: '\u251b',
  DRU: '\u2523',
  DLU: '\u252b',
  DLR: '\u2533',
  LRU: '\u253b',
  DLRU: '\u254b',
};
export const DOUBLE_JUNCTION: Record<string, string> = {
  D: '\u2551',
  U: '\u2551',
  DU: '\u2551',
  L: '\u2550',
  R: '\u2550',
  LR: '\u2550',
  DR: '\u2554',
  DL: '\u2557',
  RU: '\u255a',
  LU: '\u255d',
  DRU: '\u2560',
  DLU: '\u2563',
  DLR: '\u2566',
  LRU: '\u2569',
  DLRU: '\u256c',
};
export const DASHED_JUNCTION: Record<string, string> = {
  ...SINGLE_JUNCTION,
  D: '\u254e',
  U: '\u254e',
  DU: '\u254e',
  L: '\u254c',
  R: '\u254c',
  LR: '\u254c',
};
export const JUNCTIONS: Record<EdgeGlyphStyle, Record<string, string>> = {
  single: SINGLE_JUNCTION,
  heavy: HEAVY_JUNCTION,
  double: DOUBLE_JUNCTION,
  dashed: DASHED_JUNCTION,
};
