import type { BijouContext } from '../../ports/context.js';
import { formatCellLines } from './table-cell-format.js';
import type { TableOptions } from './table-contract.js';
import {
  padRight,
  visibleLength,
} from './table-measure.js';
import type { NormalizedTable } from './table-model.js';
import { resolveTargetWidth } from './table-normalize.js';
import { resolveOverflowBehavior } from './overflow.js';
import { clipCellToWidth } from './table-text-ansi.js';

export function renderExpandedTable(
  tableData: NormalizedTable,
  options: TableOptions,
  ctx: BijouContext,
): string {
  const borderToken = options.borderToken ?? ctx.border('muted');
  const lines: string[] = [];
  const columnLabel = (index: number): string =>
    tableData.showHeader
      ? tableData.columns[index]?.header ?? ''
      : 'Column ' + String(index + 1);
  const preferredLabelWidth = tableData.columns.reduce(
    (max, _column, index) =>
      Math.max(max, visibleLength(columnLabel(index))),
    0,
  );
  const layout = options.layout ?? 'auto';
  const targetWidth = resolveTargetWidth(options, ctx, layout);
  const ruleWidth = targetWidth ?? 40;
  const separator =
    targetWidth === undefined || targetWidth >= 3
      ? ' | '
      : ' '.repeat(Math.max(0, targetWidth - 1));
  const contentWidth =
    targetWidth === undefined
      ? undefined
      : Math.max(0, targetWidth - separator.length);
  const labelWidth =
    targetWidth === undefined
      ? preferredLabelWidth
      : Math.min(
          preferredLabelWidth,
          Math.floor((contentWidth ?? 0) / 2),
        );
  const valueWidth =
    targetWidth === undefined
      ? undefined
      : Math.max(0, targetWidth - labelWidth - separator.length);
  const overflow = resolveOverflowBehavior(
    options.overflow,
    ctx.resolveBCSS({
      type: 'Table',
      id: options.id,
      classes: options.class?.split(' '),
    }),
  );
  const wrapMode = options.wrap ?? 'word';

  for (const [rowIndex, row] of tableData.rows.entries()) {
    const title = '-[ RECORD ' + String(rowIndex + 1) + ' ]';
    const clipped =
      targetWidth === undefined
        ? title
        : clipCellToWidth(title, ruleWidth);
    lines.push(
      ctx.style.styled(
        borderToken,
        clipped
          + '-'.repeat(Math.max(0, ruleWidth - visibleLength(clipped))),
      ),
    );
    for (
      let columnIndex = 0;
      columnIndex < tableData.columns.length;
      columnIndex++
    ) {
      const rawLabel = columnLabel(columnIndex);
      const label = padRight(
        targetWidth === undefined
          ? rawLabel
          : clipCellToWidth(rawLabel, labelWidth),
        labelWidth,
      );
      const rawValue = row[columnIndex] ?? '';
      const values =
        valueWidth === undefined
          ? rawValue.split('\n')
          : formatCellLines(rawValue, valueWidth, overflow, wrapMode);
      for (let lineIndex = 0; lineIndex < values.length; lineIndex++) {
        const lineLabel =
          lineIndex === 0 ? label : ' '.repeat(labelWidth);
        lines.push(
          (lineLabel + separator + (values[lineIndex] ?? '')).trimEnd(),
        );
      }
    }
  }
  return lines.join('\n');
}
