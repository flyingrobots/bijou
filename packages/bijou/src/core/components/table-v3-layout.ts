import { createSurface } from '../../ports/surface.js';
import { resolveSafeCtx as resolveCtx } from '../resolve-ctx.js';
import { tokenToCellStyle } from './surface-text.js';
import { resolveOverflowBehavior } from './overflow.js';
import type { TableSurfaceOptions } from './table-v3-contracts.js';
import { createPreparedTextCell, createPreparedSurfaceCell, fitPreparedCell, resolveColumns } from './table-v3-cells.js';
import { fitTableSurfaceColumnWidths, resolveTargetWidth } from './table-v3-widths.js';

export function prepareTableSurface(options: TableSurfaceOptions) {
  const ctx = resolveCtx(options.ctx);
  const overflow = resolveOverflowBehavior(
    options.overflow,
    ctx?.resolveBCSS({ type: 'Table', id: options.id, classes: options.class?.split(' ') }) ?? {},
  );
  const rows = options.rows;
  const columns = resolveColumns(options.columns ?? [], rows);
  const headerToken = options.headerToken ?? ctx?.ui('tableHeader');
  const headerStyle = tokenToCellStyle(headerToken);
  const borderStyle = tokenToCellStyle(options.borderToken ?? ctx?.border('muted'));
  const headerBg = options.headerBgToken == null ? undefined : tokenToCellStyle(options.headerBgToken);
  const headerCellStyle = {
    ...headerStyle,
    bg: headerBg?.bg ?? headerStyle.bg,
  };
  const headerCells = columns.map((column) => createPreparedTextCell(column.header, headerCellStyle));
  const headerSurfaces = headerCells.map((cell) => cell.surface);
  const preparedCells = rows.map((row) => row.map((cell) => createPreparedSurfaceCell(cell)));
  const cellSurfaces = preparedCells.map((row) => row.map((cell) => cell.surface));
  const layout = options.layout ?? 'auto';
  const wrapMode = options.wrap ?? 'word';
  const colWidths = fitTableSurfaceColumnWidths(
    columns,
    headerSurfaces,
    cellSurfaces,
    layout,
    resolveTargetWidth(options, ctx, layout),
  );
  const fittedHeaderSurfaces = headerCells.map((cell, index) => {
    const cellWidth = colWidths[index] ?? 0;
    return fitPreparedCell(cell, cellWidth, overflow, wrapMode);
  });
  const headerHeight = fittedHeaderSurfaces.reduce((max, cell) => Math.max(max, cell.height), 1);
  const fittedCellSurfaces = preparedCells.map((row) => row.map((cell, index) => {
    const cellWidth = colWidths[index] ?? 0;
    return fitPreparedCell(cell, cellWidth, overflow, wrapMode);
  }));
  const rowHeights = fittedCellSurfaces.map((row) => row.reduce((max, cell, index) => {
    const cellWidth = colWidths[index] ?? 0;
    if (cellWidth <= 0) return max;
    return Math.max(max, cell.height);
  }, 1));
  const totalWidth = columns.length === 0
    ? 2
    : colWidths.reduce((sum, width) => sum + width + 2, 0) + columns.length + 1;
  const totalHeight = 1 + headerHeight + 1 + rowHeights.reduce((sum, height) => sum + height, 0) + 1;
  const surface = createSurface(totalWidth, totalHeight, { char: ' ', empty: false });
  return { columns, borderStyle, headerBg, colWidths, fittedHeaderSurfaces, headerHeight, fittedCellSurfaces, rowHeights, totalWidth, totalHeight, surface };
}
