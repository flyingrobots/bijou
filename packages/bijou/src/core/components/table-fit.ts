import type {
  TableColumn,
  TableLayout,
  TableVariant,
} from './table-contract.js';
import {
  interactiveTableBorderOverhead,
} from './table-contract.js';
import {
  columnMinWidth,
  columnPreferredWidth,
  normalizePositiveWeight,
} from './table-measure.js';

function structuralOverhead(
  variant: TableVariant,
  columnCount: number,
  columnGap: number,
): number {
  if (columnCount <= 0) {
    return variant === 'box' || variant === 'ascii-grid' ? 2 : 0;
  }
  if (variant === 'box' || variant === 'ascii-grid') {
    return interactiveTableBorderOverhead(columnCount);
  }
  if (variant === 'markdown') return columnCount * 3 + 1;
  return Math.max(0, columnCount - 1) * columnGap;
}

export function fitColumnWidths(
  columns: readonly TableColumn[],
  rows: readonly string[][],
  variant: TableVariant,
  layout: TableLayout,
  targetWidth: number | undefined,
  columnGap: number,
): number[] {
  const preferred = columns.map((column, index) =>
    columnPreferredWidth(column, rows, index),
  );
  if (layout === 'intrinsic' && targetWidth === undefined) return preferred;
  const contentTarget = targetWidth === undefined
    ? undefined
    : Math.max(
        0,
        targetWidth - structuralOverhead(variant, columns.length, columnGap),
      );
  if (contentTarget === undefined) return preferred;
  const preferredTotal = preferred.reduce((sum, width) => sum + width, 0);
  if (preferredTotal <= contentTarget) return preferred;
  const minimum = columns.map((column, index) =>
    columnMinWidth(column, preferred[index] ?? 0),
  );
  const minimumTotal = minimum.reduce((sum, width) => sum + width, 0);
  if (minimumTotal >= contentTarget) return minimum;

  const widths = [...minimum];
  const capacity = preferred.map((width, index) =>
    Math.max(0, width - (minimum[index] ?? 0)),
  );
  let budget = contentTarget - minimumTotal;

  while (budget > 0) {
    const active = capacity
      .map((available, index) => ({ available, index }))
      .filter((entry) => entry.available > 0);
    if (active.length === 0) break;
    const weight = active.reduce(
      (sum, entry) =>
        sum + Math.max(1, normalizePositiveWeight(columns[entry.index]?.weight)),
      0,
    );
    let used = 0;
    const remainders: {
      readonly index: number;
      readonly remainder: number;
      readonly capacity: number;
    }[] = [];
    for (const entry of active) {
      const share = Math.max(
        1,
        normalizePositiveWeight(columns[entry.index]?.weight),
      );
      const exact = (budget * share) / weight;
      const add = Math.min(entry.available, Math.floor(exact));
      if (add > 0) {
        widths[entry.index] = (widths[entry.index] ?? 0) + add;
        capacity[entry.index] = (capacity[entry.index] ?? 0) - add;
        used += add;
      }
      remainders.push({
        index: entry.index,
        remainder: exact - Math.floor(exact),
        capacity: capacity[entry.index] ?? 0,
      });
    }
    if (used === 0) {
      const next = remainders
        .filter((entry) => entry.capacity > 0)
        .sort((left, right) =>
          right.remainder !== left.remainder
            ? right.remainder - left.remainder
            : (capacity[right.index] ?? 0) - (capacity[left.index] ?? 0),
        )[0];
      if (next == null) break;
      widths[next.index] = (widths[next.index] ?? 0) + 1;
      capacity[next.index] = (capacity[next.index] ?? 0) - 1;
      used = 1;
    }
    budget -= used;
  }
  return widths;
}
