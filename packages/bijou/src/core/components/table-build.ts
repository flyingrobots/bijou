import type { BijouContext } from '../../ports/context.js';
import { sanitizeNonNegativeInt } from '../numeric.js';
import { formatCellLines } from './table-cell-format.js';
import type {
  TableColumn,
  TableLayout,
  TableOptions,
  TableVariant,
} from './table-contract.js';
import { fitColumnWidths } from './table-fit.js';
import type {
  FittedTable,
  NormalizedTable,
} from './table-model.js';
import { resolveTargetWidth } from './table-normalize.js';
import { resolveOverflowBehavior } from './overflow.js';

interface BuildFittedTableOptions {
  readonly styleHeaders?: boolean;
  readonly layout?: TableLayout;
  readonly rows?: readonly string[][];
  readonly columns?: readonly TableColumn[];
}

export function buildFittedTable(
  options: TableOptions,
  ctx: BijouContext,
  tableData: NormalizedTable,
  variant: TableVariant,
  override: BuildFittedTableOptions = {},
): FittedTable {
  const columns = override.columns ?? tableData.columns;
  const rows = override.rows ?? tableData.rows;
  const layout = override.layout ?? options.layout ?? 'auto';
  const columnGap = sanitizeNonNegativeInt(options.columnGap, 2);
  const overflow = resolveOverflowBehavior(
    options.overflow,
    ctx.resolveBCSS({
      type: 'Table',
      id: options.id,
      classes: options.class?.split(' '),
    }),
  );
  const wrapMode = options.wrap ?? 'word';
  const widths = fitColumnWidths(
    columns,
    rows,
    variant,
    layout,
    resolveTargetWidth(options, ctx, layout),
    columnGap,
  );
  const headerToken = options.headerToken ?? ctx.ui('tableHeader');
  const styleHeaders = override.styleHeaders ?? true;
  const headerLines = columns.map((column, index) => {
    const header = styleHeaders
      ? ctx.style.styled(headerToken, column.header)
      : column.header;
    return formatCellLines(header, widths[index] ?? 0, overflow, wrapMode);
  });
  const headerHeight = headerLines.reduce(
    (max, lines) => Math.max(max, lines.length),
    1,
  );
  const fittedRows = rows.map((row) => {
    const cells = widths.map((width, index) =>
      formatCellLines(row[index] ?? '', width, overflow, wrapMode),
    );
    return {
      cells,
      height: cells.reduce(
        (max, lines) => Math.max(max, lines.length),
        1,
      ),
    };
  });

  return {
    columns: columns.map((column, index) => ({
      header: column.header,
      width: widths[index] ?? 0,
      align: column.align ?? 'left',
    })),
    widths,
    headerLines,
    headerHeight,
    rows: fittedRows,
    columnGap,
    showHeader: tableData.showHeader,
  };
}
