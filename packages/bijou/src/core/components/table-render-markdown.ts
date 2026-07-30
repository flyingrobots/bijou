import { stripAnsi } from '../text/grapheme.js';
import type { TableCellAlign } from './table-contract.js';
import { alignCell } from './table-measure.js';
import type {
  FittedTable,
  NormalizedTable,
} from './table-model.js';

function markdownSeparator(width: number, align: TableCellAlign): string {
  const segmentWidth = Math.max(3, width + 2);
  if (align === 'right') return '-'.repeat(segmentWidth - 1) + ':';
  if (align === 'center') {
    return ':' + '-'.repeat(segmentWidth - 2) + ':';
  }
  return '-'.repeat(segmentWidth);
}

export function renderMarkdownTable(model: FittedTable): string {
  const widths = model.columns.map((column) => Math.max(1, column.width));
  const rowLine = (
    cells: readonly (readonly string[])[],
    lineIndex: number,
  ): string =>
    '|'
    + model.columns
      .map((column, index) => {
        const value = cells[index]?.[lineIndex] ?? '';
        return (
          ' '
          + alignCell(value, widths[index] ?? 1, column.align)
          + ' '
        );
      })
      .join('|')
    + '|';
  const headers = Array.from(
    { length: model.headerHeight },
    (_row, index) => rowLine(model.headerLines, index),
  );
  const separator =
    '|'
    + model.columns
      .map((column, index) =>
        markdownSeparator(widths[index] ?? 1, column.align),
      )
      .join('|')
    + '|';
  const rows = model.rows.flatMap((row) =>
    Array.from({ length: row.height }, (_line, index) =>
      rowLine(row.cells, index),
    ),
  );
  return model.showHeader
    ? [...headers, separator, ...rows].join('\n')
    : rows.join('\n');
}

function markdownEscapeCell(value: string): string {
  return stripAnsi(value)
    .replace(/\\/g, '\\\\')
    .replace(/\|/g, '\\|')
    .replace(/\r\n?/g, '\n')
    .replace(/\n/g, '<br>');
}

export function markdownTableData(
  tableData: NormalizedTable,
): NormalizedTable {
  return {
    columns: tableData.columns.map((column) => ({
      ...column,
      header: markdownEscapeCell(column.header),
    })),
    rows: tableData.rows.map((row) =>
      row.map((cell) => markdownEscapeCell(cell)),
    ),
    showHeader: tableData.showHeader,
  };
}
