import type { BijouContext } from '../../ports/context.js';
import { renderByMode } from '../mode-render.js';
import { resolveCtx } from '../resolve-ctx.js';
import type {
  TableColumn,
  TableOptions,
  TableTextRow,
} from './table-contract.js';
import {
  isTableOptions,
  normalizeTable,
} from './table-normalize.js';
import { renderPipeTable } from './table-render-pipe.js';
import { renderVisualTable } from './table-render-visual.js';

export {
  interactiveTableBorderOverhead,
  measureInteractiveTableWidth,
  type TableCellAlign,
  type TableColumn,
  type TableLayout,
  type TableOptions,
  type TablePipeFormat,
  type TableTextCell,
  type TableTextRow,
  type TableVariant,
  type TableWrapMode,
} from './table-contract.js';

/**
 * Render a table with mode-aware human variants and pipe serializations.
 *
 * Output adapts to the current output mode:
 * - `interactive` / `static` — responsive visual table. Defaults to the boxed
 *   variant, with optional ruled, plain, markdown, definition, and ASCII grid
 *   variants.
 * - `pipe` — tab-separated values (TSV) by default, with explicit CSV,
 *   Markdown, and ASCII grid formats.
 * - `accessible` — key-value pairs per row for screen readers.
 *
 * @param options - Table configuration including columns and row data.
 * @returns The rendered table string.
 */
export function table(options: TableOptions): string;
export function table(
  columns: readonly TableColumn[],
  rows: readonly TableTextRow[],
  context?: BijouContext,
): string;
export function table(
  optionsOrColumns: TableOptions | readonly TableColumn[],
  rowData?: readonly TableTextRow[],
  context?: BijouContext,
): string {
  const options: TableOptions = isTableOptions(optionsOrColumns)
    ? optionsOrColumns
    : {
        columns: [...optionsOrColumns],
        rows: rowData ?? [],
        ctx: context,
      };
  const ctx = resolveCtx(options.ctx);
  const tableData = normalizeTable(options);

  return renderByMode(
    ctx.mode,
    {
      pipe: () => renderPipeTable(options, ctx, tableData),
      accessible: () =>
        tableData.rows
          .map((row, rowIndex) => {
            const pairs = tableData.columns.map((column, columnIndex) => {
              const label = tableData.showHeader
                ? column.header
                : 'Column ' + String(columnIndex + 1);
              return label + '=' + (row[columnIndex] ?? '');
            });
            return 'Row ' + String(rowIndex + 1) + ': ' + pairs.join(', ');
          })
          .join('\n'),
      interactive: () =>
        renderVisualTable(
          options,
          ctx,
          tableData,
          options.variant ?? 'box',
        ),
    },
    options,
  );
}
