import type { BijouContext } from '../../ports/context.js';
import { buildFittedTable } from './table-build.js';
import type { TableOptions } from './table-contract.js';
import type { NormalizedTable } from './table-model.js';
import { renderGridTable } from './table-render-grid.js';
import {
  markdownTableData,
  renderMarkdownTable,
} from './table-render-markdown.js';

function escapeTsvCell(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\t/g, '\\t')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n');
}

function escapeCsvCell(value: string): string {
  if (!/[",\r\n]/.test(value)) return value;
  return `"${value.replace(/"/g, '""')}"`;
}

function renderSeparatedPipe(
  tableData: NormalizedTable,
  separator: string,
  escapeCell: (value: string) => string,
): string {
  const header = tableData.columns
    .map((column) => escapeCell(column.header))
    .join(separator);
  const rows = tableData.rows.map((row) =>
    row.map(escapeCell).join(separator),
  );
  return tableData.showHeader ? [header, ...rows].join('\n') : rows.join('\n');
}

function implicitPipeLayout(options: TableOptions): 'auto' | 'intrinsic' {
  return (
    options.layout
    ?? (options.width !== undefined || options.maxWidth !== undefined
      ? 'auto'
      : 'intrinsic')
  );
}

export function renderPipeTable(
  options: TableOptions,
  ctx: BijouContext,
  tableData: NormalizedTable,
): string {
  const format = options.pipeFormat ?? 'tsv';
  if (format === 'csv') {
    return renderSeparatedPipe(tableData, ',', escapeCsvCell);
  }
  if (format === 'markdown') {
    return renderMarkdownTable(
      buildFittedTable(
        options,
        ctx,
        markdownTableData(tableData),
        'markdown',
        { layout: implicitPipeLayout(options), styleHeaders: false },
      ),
    );
  }
  if (format === 'ascii-grid') {
    const model = buildFittedTable(options, ctx, tableData, 'ascii-grid', {
      layout: implicitPipeLayout(options),
      styleHeaders: false,
    });
    return renderGridTable(model, options, ctx, 'ascii-grid', false);
  }
  return renderSeparatedPipe(tableData, '\t', escapeTsvCell);
}
