import type { Surface } from '../../ports/surface.js';
import { createTextSurface, wrapSurfaceToWidth, type CellTextStyle } from './surface-text.js';
import type { TableOptions, TableWrapMode } from './table.js';
import type { TableSurfaceCell, TableSurfaceRow } from './table-v3-contracts.js';
import type { resolveOverflowBehavior } from './overflow.js';
import { wrapToWidth } from '../text/wrap.js';

interface PreparedTableSurfaceCell {
  readonly surface: Surface;
  readonly text?: string;
  readonly style?: CellTextStyle;
}

export function resolveColumns(
  columns: NonNullable<TableOptions['columns']>,
  rows: readonly TableSurfaceRow[],
): NonNullable<TableOptions['columns']> {
  if (columns.length > 0) return [...columns];

  const inferredCount = rows.reduce((max, row) => Math.max(max, row.length), 0);
  return Array.from({ length: inferredCount }, () => ({ header: '' }));
}

export function createPreparedTextCell(text: string, style: CellTextStyle = {}): PreparedTableSurfaceCell {
  return { text, style, surface: createTextSurface(text, style) };
}

export function createPreparedSurfaceCell(cell: TableSurfaceCell, style: CellTextStyle = {}): PreparedTableSurfaceCell {
  if (typeof cell === 'string') return createPreparedTextCell(cell, style);
  return { surface: cell };
}

export function fitPreparedCell(
  cell: PreparedTableSurfaceCell,
  width: number,
  overflow: ReturnType<typeof resolveOverflowBehavior>,
  wrapMode: TableWrapMode,
): Surface {
  if (cell.surface.width <= width || overflow === 'truncate') return cell.surface;
  if (cell.text !== undefined && wrapMode === 'word') {
    return createTextSurface(wrapToWidth(cell.text, width).join('\n'), cell.style ?? {});
  }
  return wrapSurfaceToWidth(cell.surface, width);
}
