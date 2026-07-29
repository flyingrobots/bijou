import { type EdgeRoute, type GridPoint } from './dag-edges.part01.js';

function chooseDetourColumn(
  srcC: number,
  nodeWidth: number,
  gridCols: number,
): number {
  const detourOffset = Math.floor(nodeWidth / 2) + 1;
  const right = srcC + detourOffset;
  if (right >= 0 && right < gridCols && right !== srcC) return right;
  const left = srcC - detourOffset;
  if (left >= 0 && left < gridCols && left !== srcC) return left;
  return srcC;
}

function pushPoint(path: GridPoint[], row: number, col: number): void {
  const previous = path[path.length - 1];
  if (previous?.row === row && previous.col === col) return;
  path.push({ row, col });
}

function appendVertical(
  path: GridPoint[],
  col: number,
  fromRow: number,
  toRow: number,
): void {
  const step = fromRow <= toRow ? 1 : -1;
  for (let row = fromRow; row !== toRow + step; row += step) {
    pushPoint(path, row, col);
  }
}

function appendHorizontal(
  path: GridPoint[],
  row: number,
  fromCol: number,
  toCol: number,
): void {
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
  rowStride: number,
  colCenter: (layer: number, col: number) => number,
  nodeWidth: number,
  nodeHeight: number,
  gridCols: number,
): EdgeRoute {
  const srcC = colCenter(fromLayer, fromCol);
  const dstC = colCenter(toLayer, toCol);
  const sRow = fromLayer * rowStride + nodeHeight;
  const dRow = toLayer * rowStride - 1;
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
