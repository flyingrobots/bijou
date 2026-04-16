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

// ── Arrow Position Encoding ───────────────────────────────────────

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
  return { row: encoded >>> 16, col: encoded & 0xFFFF };
}

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
 * @returns The appropriate box-drawing character, or `' '` (space) for an empty
 *   direction set (no edge traffic through this cell).
 */
export function junctionChar(dirs: Set<Dir>): string {
  if (dirs.size === 0) return ' ';
  // Alphabetical sort of D,L,R,U matches JUNCTION table keys
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
  return { dirs, arrows: new Map<number, number>(), rows, cols };
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
  nodeWidth: number,
): void {
  const route = buildEdgeRoute(
    fromCol,
    fromLayer,
    toCol,
    toLayer,
    RS,
    colCenter,
    nodeWidth,
    g.cols,
  );

  for (let i = 0; i < route.path.length - 1; i++) {
    const current = route.path[i]!;
    const next = route.path[i + 1]!;
    if (current.row === next.row) {
      const forward: Dir = current.col < next.col ? 'R' : 'L';
      const reverse: Dir = forward === 'R' ? 'L' : 'R';
      markDir(g, current.row, current.col, forward);
      markDir(g, next.row, next.col, reverse);
      continue;
    }

    const forward: Dir = current.row < next.row ? 'D' : 'U';
    const reverse: Dir = forward === 'D' ? 'U' : 'D';
    markDir(g, current.row, current.col, forward);
    markDir(g, next.row, next.col, reverse);
  }

  const arrowPos = encodeArrowPos(route.arrow.row, route.arrow.col);
  g.arrows.set(arrowPos, (g.arrows.get(arrowPos) ?? 0) + 1);
}

function chooseDetourColumn(srcC: number, nodeWidth: number, gridCols: number): number {
  const detourOffset = Math.floor(nodeWidth / 2) + 1;
  const right = srcC + detourOffset;
  if (right >= 0 && right < gridCols && right !== srcC) return right;
  const left = srcC - detourOffset;
  if (left >= 0 && left < gridCols && left !== srcC) return left;
  return srcC;
}

function pushPoint(path: GridPoint[], row: number, col: number): void {
  const prev = path[path.length - 1];
  if (prev?.row === row && prev.col === col) return;
  path.push({ row, col });
}

function appendVertical(path: GridPoint[], col: number, fromRow: number, toRow: number): void {
  const step = fromRow <= toRow ? 1 : -1;
  for (let row = fromRow; row !== toRow + step; row += step) {
    pushPoint(path, row, col);
  }
}

function appendHorizontal(path: GridPoint[], row: number, fromCol: number, toCol: number): void {
  const step = fromCol <= toCol ? 1 : -1;
  for (let col = fromCol; col !== toCol + step; col += step) {
    pushPoint(path, row, col);
  }
}

/**
 * Build the routed cell path for an edge, including the destination arrow cell.
 *
 * Same-column skip edges are detoured into the gap beside the node column so
 * they do not disappear under intermediate node boxes.
 */
export function buildEdgeRoute(
  fromCol: number,
  fromLayer: number,
  toCol: number,
  toLayer: number,
  RS: number,
  colCenter: (c: number) => number,
  nodeWidth: number,
  gridCols: number,
): EdgeRoute {
  const srcC = colCenter(fromCol);
  const dstC = colCenter(toCol);
  const sRow = fromLayer * RS + 3;
  const dRow = toLayer * RS - 1;
  const mid = sRow + 1;
  const path: GridPoint[] = [];

  if (srcC === dstC && toLayer - fromLayer > 1) {
    const detourC = chooseDetourColumn(srcC, nodeWidth, gridCols);
    if (detourC === srcC) {
      appendVertical(path, srcC, sRow, dRow);
    } else {
      appendVertical(path, srcC, sRow, mid);
      appendHorizontal(path, mid, srcC, detourC);
      appendVertical(path, detourC, mid, dRow);
      appendHorizontal(path, dRow, detourC, dstC);
    }
  } else if (srcC === dstC) {
    appendVertical(path, srcC, sRow, dRow);
  } else {
    appendVertical(path, srcC, sRow, mid);
    appendHorizontal(path, mid, srcC, dstC);
    appendVertical(path, dstC, mid, dRow);
  }

  return {
    path,
    arrow: { row: dRow, col: dstC },
  };
}
