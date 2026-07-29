import {
  type Dir,
  type EdgeGlyphStyle,
  type GridState,
  JUNCTIONS,
} from './dag-edges.part01.js';

/**
 * Select the Unicode box-drawing character for a cell based on its edge directions.
 *
 * @param dirs - Set of cardinal directions passing through this cell.
 * @returns The appropriate box-drawing character, or `' '` (space) for an empty
 *   direction set (no edge traffic through this cell).
 */
export function junctionChar(
  dirs: Set<Dir>,
  style: EdgeGlyphStyle = 'single',
): string {
  if (dirs.size === 0) return ' ';
  // Alphabetical sort of D,L,R,U matches JUNCTION table keys
  const key = [...dirs].sort().join('');
  return JUNCTIONS[style][key] ?? JUNCTIONS[style]['DLRU'] ?? '\u253c';
}
/**
 * Select the arrowhead character for an edge style.
 */
export function arrowChar(style: EdgeGlyphStyle = 'single'): string {
  return style === 'dashed' ? '\u25be' : '\u25bc';
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
export function markDir(
  g: GridState,
  r: number,
  c: number,
  ...ds: Dir[]
): void {
  if (r >= 0 && r < g.rows && c >= 0 && c < g.cols) {
    const cell = g.dirs[r]?.[c];
    if (cell === undefined) return;
    for (const d of ds) cell.add(d);
  }
}
