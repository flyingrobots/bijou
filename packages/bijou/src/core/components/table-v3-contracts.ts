import type { Surface } from '../../ports/surface.js';
import type { TableOptions } from './table.js';

export type TableSurfaceCell = string | Surface;
export type TableSurfaceRow = readonly TableSurfaceCell[];

export interface TableSurfaceOptions extends Omit<TableOptions, 'rows'> {
  readonly rows: readonly TableSurfaceRow[];
}
