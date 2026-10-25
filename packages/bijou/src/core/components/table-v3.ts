import type { BijouContext } from '../../ports/context.js';
import type { Surface } from '../../ports/surface.js';
import type { TableColumn } from './table.js';
import type { TableSurfaceOptions, TableSurfaceRow } from './table-v3-contracts.js';
import { prepareTableSurface } from './table-v3-layout.js';
import { renderTableSurface } from './table-v3-render.js';

export type { TableSurfaceCell, TableSurfaceRow, TableSurfaceOptions } from './table-v3-contracts.js';

function isTableSurfaceOptions(
  value: TableSurfaceOptions | readonly TableColumn[],
): value is TableSurfaceOptions {
  return !Array.isArray(value);
}

/**
 * Render a bordered data table as a Surface for V3-native composition.
 */
export function tableSurface(options: TableSurfaceOptions): Surface;
export function tableSurface(
  columns: readonly TableColumn[],
  rows: readonly TableSurfaceRow[],
  context?: BijouContext,
): Surface;
export function tableSurface(
  optionsOrColumns: TableSurfaceOptions | readonly TableColumn[],
  rowData?: readonly TableSurfaceRow[],
  context?: BijouContext,
): Surface {
  let options: TableSurfaceOptions;
  if (isTableSurfaceOptions(optionsOrColumns)) {
    options = optionsOrColumns;
  } else {
    options = { columns: [...optionsOrColumns], rows: rowData ?? [], ctx: context };
  }
  return renderTableSurface(prepareTableSurface(options));
}
