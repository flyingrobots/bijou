import {
  type Dir,
  type GridState,
  encodeArrowPos,
} from './dag-edges.part01.js';
import { markDir } from './dag-edges.part02.js';
import { buildEdgeRoute } from './dag-edges.part04.js';

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
  rowStride: number,
  colCenter: (layer: number, col: number) => number,
  nodeWidth: number,
  nodeHeight: number,
): void {
  const route = buildEdgeRoute(
    fromCol,
    fromLayer,
    toCol,
    toLayer,
    rowStride,
    colCenter,
    nodeWidth,
    nodeHeight,
    g.cols,
  );

  for (let i = 0; i < route.path.length - 1; i++) {
    const current = route.path[i];
    const next = route.path[i + 1];
    if (current === undefined || next === undefined) continue;
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
