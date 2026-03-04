/**
 * Edge routing primitives for the DAG renderer.
 *
 * Self-contained module with zero dag-* imports.
 * Provides the mutable grid used to route edges between node positions
 * and the junction-character lookup table.
 */

// ── Types ──────────────────────────────────────────────────────────

/** Cardinal direction for edge routing through grid cells. */
export type Dir = 'U' | 'D' | 'L' | 'R';

/**
 * Mutable grid state used during edge routing.
 *
 * Each cell tracks which cardinal directions edges pass through it,
 * and `arrows` records the encoded positions of arrowheads.
 */
export interface GridState {
  /** 2D array of direction sets, one per grid cell. */
  dirs: Set<Dir>[][];
  /** Encoded arrowhead positions as `row * GRID_COL_MULTIPLIER + col`. */
  arrows: Set<number>;
  /** Number of rows in the grid. */
  rows: number;
  /** Number of columns in the grid. */
  cols: number;
}

// ── Constants ──────────────────────────────────────────────────────

/** Multiplier for encoding arrow positions as `row * GRID_COL_MULTIPLIER + col`. */
export const GRID_COL_MULTIPLIER = 10000;

/**
 * Lookup table mapping sorted direction-set keys to Unicode box-drawing characters.
 * For example, `'DR'` maps to `\u250c` (top-left corner).
 */
const JUNCTION: Record<string, string> = {
  'D': '\u2502', 'U': '\u2502', 'DU': '\u2502',
  'L': '\u2500', 'R': '\u2500', 'LR': '\u2500',
  'DR': '\u250c', 'DL': '\u2510', 'RU': '\u2514', 'LU': '\u2518',
  'DRU': '\u251c', 'DLU': '\u2524', 'DLR': '\u252c', 'LRU': '\u2534',
  'DLRU': '\u253c',
};

// ── Functions ──────────────────────────────────────────────────────

/**
 * Select the Unicode box-drawing character for a cell based on its edge directions.
 *
 * @param dirs - Set of cardinal directions passing through this cell.
 * @returns The appropriate box-drawing character, or `\u253c` (cross) as fallback.
 */
export function junctionChar(dirs: Set<Dir>): string {
  const key = [...dirs].sort().join('');
  return JUNCTION[key] ?? '\u253c';
}

/**
 * Allocate an empty edge-routing grid.
 *
 * @param rows - Number of rows in the grid.
 * @param cols - Number of columns in the grid.
 * @returns A fresh `GridState` with empty direction sets for every cell.
 */
export function createGrid(rows: number, cols: number): GridState {
  const dirs: Set<Dir>[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: Set<Dir>[] = [];
    for (let c = 0; c < cols; c++) {
      row.push(new Set<Dir>());
    }
    dirs.push(row);
  }
  return { dirs, arrows: new Set<number>(), rows, cols };
}

/**
 * Add direction markers to a single grid cell. Bounds-checked.
 *
 * @param g - The grid state to mutate.
 * @param r - Row index.
 * @param c - Column index.
 * @param ds - One or more directions to mark in this cell.
 */
function markDir(g: GridState, r: number, c: number, ...ds: Dir[]): void {
  if (r >= 0 && r < g.rows && c >= 0 && c < g.cols) {
    const cell = g.dirs[r]![c]!;
    for (const d of ds) cell.add(d);
  }
}

/**
 * Route a single edge through the grid between two node positions.
 *
 * Draws a vertical segment from the source, an optional horizontal jog
 * if the columns differ, then a vertical segment down to the target.
 * Records an arrowhead position just above the destination node.
 *
 * @param g - The grid state to mutate.
 * @param fromCol - Column index of the source node.
 * @param fromLayer - Layer index of the source node.
 * @param toCol - Column index of the destination node.
 * @param toLayer - Layer index of the destination node.
 * @param RS - Row stride (number of grid rows per layer).
 * @param colCenter - Function mapping a column index to its center grid column.
 */
export function markEdge(
  g: GridState,
  fromCol: number,
  fromLayer: number,
  toCol: number,
  toLayer: number,
  RS: number,
  colCenter: (c: number) => number,
): void {
  const srcC = colCenter(fromCol);
  const dstC = colCenter(toCol);
  const sRow = fromLayer * RS + 3;
  const dRow = toLayer * RS - 1;   // one row above dest box
  const mid = sRow + 1;

  if (srcC === dstC) {
    for (let r = sRow; r < dRow; r++) markDir(g, r, srcC, 'D', 'U');
  } else {
    markDir(g, sRow, srcC, 'D', 'U');
    markDir(g, mid, srcC, srcC < dstC ? 'R' : 'L', 'U');

    const minC = Math.min(srcC, dstC);
    const maxC = Math.max(srcC, dstC);
    for (let c = minC + 1; c < maxC; c++) markDir(g, mid, c, 'L', 'R');

    markDir(g, mid, dstC, srcC < dstC ? 'L' : 'R', 'D');
    for (let r = mid + 1; r < dRow; r++) markDir(g, r, dstC, 'D', 'U');
  }

  g.arrows.add(dRow * GRID_COL_MULTIPLIER + dstC);
}
