import { graphemeWidth, stripAnsi } from '../text/grapheme.js';
import { measureInteractiveTableWidth } from './table.js';

export function fitMarkdownTableWidths(
  headers: readonly string[],
  rows: readonly (readonly string[])[],
  width: number,
): number[] {
  const columnCount = headers.length;
  if (columnCount === 0) return [];

  const desired = headers.map((header, index) => {
    let max = visibleTextWidth(header);
    for (const row of rows) {
      max = Math.max(max, visibleTextWidth(row[index] ?? ''));
    }
    return Math.max(1, max);
  });

  const contentWidth = desired.reduce((sum, columnWidth) => sum + columnWidth, 0);
  const targetContentWidth = Math.max(
    columnCount,
    width - (measureInteractiveTableWidth(desired) - contentWidth),
  );

  if (contentWidth <= targetContentWidth) {
    return desired;
  }

  const shrinkable = desired.map((columnWidth) => columnWidth - 1);
  const totalShrinkable = shrinkable.reduce((sum, columnWidth) => sum + columnWidth, 0);
  const targetExtraWidth = targetContentWidth - columnCount;

  if (totalShrinkable <= targetExtraWidth) {
    return Array.from({ length: columnCount }, () => 1);
  }

  const scale = targetExtraWidth / totalShrinkable;
  const fitted = desired.map((_columnWidth, index) => {
    const exactExtra = (shrinkable[index] ?? 0) * scale;
    return {
      width: 1 + Math.floor(exactExtra),
      remainder: exactExtra - Math.floor(exactExtra),
    };
  });

  const usedContentWidth = fitted.reduce((sum, column) => sum + column.width, 0);
  let remainderBudget = targetContentWidth - usedContentWidth;

  if (remainderBudget > 0) {
    const byRemainder = fitted
      .map((column, index) => ({ index, remainder: column.remainder }))
      .sort((left, right) => {
        if (right.remainder !== left.remainder) return right.remainder - left.remainder;
        return (desired[right.index] ?? 0) - (desired[left.index] ?? 0);
      });

    for (const column of byRemainder) {
      if (remainderBudget <= 0) break;
      const fittedColumn = fitted[column.index];
      if (fittedColumn === undefined) continue;
      fittedColumn.width++;
      remainderBudget--;
    }
  }

  return fitted.map((column) => column.width);
}

function visibleTextWidth(value: string): number {
  return graphemeWidth(stripAnsi(value));
}
