import type { BijouContext } from '../../ports/context.js';
import type { TokenValue } from '../theme/tokens.js';
import type {
  DagOptions,
} from './dag.js';
import {
  arrowChar,
  buildEdgeRoute,
  encodeArrowPos,
  junctionChar,
} from './dag-edges.js';
import type { DagRenderLayout } from './dag-render-contract.js';

/** Serialize placed nodes and routed edges into styled terminal text. */
export function serializeDagGrid(
  layout: DagRenderLayout,
  options: DagOptions,
  ctx: BijouContext,
): string {
  const edgeToken = options.edgeToken ?? ctx.border('muted');
  const highlightCells = highlightedEdgeCells(layout, options);
  const cellAt = (
    row: number,
    column: number,
  ): { ch: string; token: TokenValue | null } => {
    for (const placed of layout.nodesByRow.get(row) ?? []) {
      if (
        column >= placed.startCol
        && column < placed.startCol + placed.width
      ) {
        const line = row - placed.startRow;
        const offset = column - placed.startCol;
        const type = placed.charTypes[line]?.[offset] ?? 'pad';
        const token = type === 'label'
          ? placed.labelToken
          : type === 'badge'
            ? placed.badgeToken
            : type === 'border'
              ? placed.borderToken
              : placed.padToken;
        return { ch: placed.chars[line]?.[offset] ?? ' ', token };
      }
    }
    const encoded = encodeArrowPos(row, column);
    const token = highlightCells.has(encoded)
      ? (options.highlightToken ?? edgeToken)
      : edgeToken;
    if ((layout.grid.arrows.get(encoded) ?? 0) > 0) {
      return { ch: arrowChar(layout.edgeStyle), token };
    }
    const directions = layout.grid.dirs[row]?.[column];
    return directions != null && directions.size > 0
      ? { ch: junctionChar(directions, layout.edgeStyle), token }
      : { ch: ' ', token: null };
  };
  const lines: string[] = [];
  for (let row = 0; row < layout.gridRows; row++) {
    let line = '';
    let previous: TokenValue | null = null;
    let run = '';
    for (let column = 0; column < layout.gridColumns; column++) {
      const cell = cellAt(row, column);
      if (cell.token === previous) {
        run += cell.ch;
      } else {
        if (run !== '') line += previous == null ? run : ctx.style.styled(previous, run);
        run = cell.ch;
        previous = cell.token;
      }
    }
    if (run !== '') line += previous == null ? run : ctx.style.styled(previous, run);
    lines.push(line.replace(/\s+$/u, ''));
  }
  while (lines.at(-1)?.trim() === '') lines.pop();
  return lines.join('\n');
}

function highlightedEdgeCells(
  layout: DagRenderLayout,
  options: DagOptions,
): Set<number> {
  const cells = new Set<number>();
  const path = options.highlightPath;
  if (path == null || options.highlightToken == null) return cells;
  for (let index = 0; index < path.length - 1; index++) {
    const from = path[index];
    const to = path[index + 1];
    if (from == null || to == null) continue;
    const fromLayer = layout.layerMap.get(from);
    const toLayer = layout.layerMap.get(to);
    const fromColumn = layout.columnIndex.get(from);
    const toColumn = layout.columnIndex.get(to);
    if (
      fromLayer == null
      || toLayer == null
      || fromColumn == null
      || toColumn == null
    ) continue;
    const route = buildEdgeRoute(
      fromColumn,
      fromLayer,
      toColumn,
      toLayer,
      layout.rowStride,
      layout.columnCenter,
      layout.nodeWidth,
      layout.nodeHeight,
      layout.gridColumns,
    );
    for (const point of route.path) {
      if (
        point.row >= 0
        && point.row < layout.gridRows
        && point.col >= 0
        && point.col < layout.gridColumns
      ) cells.add(encodeArrowPos(point.row, point.col));
    }
  }
  return cells;
}
