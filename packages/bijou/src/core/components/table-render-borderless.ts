import type { BijouContext } from '../../ports/context.js';
import type { TableOptions } from './table-contract.js';
import { alignCell } from './table-measure.js';
import type { FittedTable } from './table-model.js';

function renderBorderlessRow(
  model: FittedTable,
  cells: readonly (readonly string[])[],
  rowIndex: number,
): string {
  const gap = ' '.repeat(model.columnGap);
  return model.columns
    .map((column, index) =>
      alignCell(
        cells[index]?.[rowIndex] ?? '',
        column.width,
        column.align,
      ),
    )
    .join(gap)
    .trimEnd();
}

function renderRule(
  model: FittedTable,
  char: string,
  ctx: BijouContext,
  options: TableOptions,
): string {
  const borderToken = options.borderToken ?? ctx.border('muted');
  const line = model.widths
    .map((width) => char.repeat(width))
    .join(' '.repeat(model.columnGap))
    .trimEnd();
  return ctx.style.styled(borderToken, line);
}

export function renderRuledTable(
  model: FittedTable,
  options: TableOptions,
  ctx: BijouContext,
  includeRowRules: boolean,
): string {
  const lines = model.showHeader
    ? [
        ...Array.from({ length: model.headerHeight }, (_row, index) =>
          renderBorderlessRow(model, model.headerLines, index),
        ),
        renderRule(model, '\u2501', ctx, options),
      ]
    : [];
  for (const [rowIndex, row] of model.rows.entries()) {
    for (let lineIndex = 0; lineIndex < row.height; lineIndex++) {
      lines.push(renderBorderlessRow(model, row.cells, lineIndex));
    }
    if (includeRowRules && rowIndex < model.rows.length - 1) {
      lines.push(renderRule(model, '\u2500', ctx, options));
    }
  }
  return lines.join('\n');
}

export function renderHeaderRuleTable(model: FittedTable): string {
  const lines = model.showHeader
    ? [
        ...Array.from({ length: model.headerHeight }, (_row, index) =>
          renderBorderlessRow(model, model.headerLines, index),
        ),
        model.widths
          .map((width) => '-'.repeat(width))
          .join(' '.repeat(model.columnGap))
          .trimEnd(),
      ]
    : [];
  for (const row of model.rows) {
    for (let index = 0; index < row.height; index++) {
      lines.push(renderBorderlessRow(model, row.cells, index));
    }
  }
  return lines.join('\n');
}

export function renderPlainTable(model: FittedTable): string {
  const lines = model.showHeader
    ? Array.from({ length: model.headerHeight }, (_row, index) =>
        renderBorderlessRow(model, model.headerLines, index),
      )
    : [];
  for (const row of model.rows) {
    for (let index = 0; index < row.height; index++) {
      lines.push(renderBorderlessRow(model, row.cells, index));
    }
  }
  return lines.join('\n');
}
