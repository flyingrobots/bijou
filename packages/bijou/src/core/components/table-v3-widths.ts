import type { BijouContext } from '../../ports/context.js';
import type { Surface } from '../../ports/surface.js';
import { interactiveTableBorderOverhead, type TableColumn, type TableLayout } from './table.js';
import type { TableSurfaceOptions } from './table-v3-contracts.js';
import { sanitizeOptionalNonNegativeInt, sanitizeOptionalPositiveInt, sanitizePositiveInt } from '../numeric.js';

function normalizeColumnWidth(width: number | undefined): number | undefined {
  if (width == null) return undefined;
  if (!Number.isFinite(width)) return 0;
  return Math.max(0, Math.floor(width));
}

function normalizePositiveWeight(weight: number | undefined): number {
  if (weight == null || !Number.isFinite(weight)) return 1;
  return Math.max(0, Math.floor(weight));
}

export function resolveTargetWidth(
  options: TableSurfaceOptions,
  ctx: BijouContext | undefined,
  layout: TableLayout,
): number | undefined {
  const explicitWidth = sanitizeOptionalPositiveInt(options.width);
  if (explicitWidth !== undefined) return explicitWidth;

  const explicitMaxWidth = sanitizeOptionalPositiveInt(options.maxWidth);
  if (layout === 'intrinsic') return explicitMaxWidth;

  const runtimeWidth = sanitizePositiveInt(ctx?.runtime.columns, 80);
  return explicitMaxWidth === undefined ? runtimeWidth : Math.min(runtimeWidth, explicitMaxWidth);
}

function tableSurfaceStructuralOverhead(columnCount: number): number {
  return columnCount <= 0 ? 2 : interactiveTableBorderOverhead(columnCount);
}

function columnPreferredWidth(
  column: TableColumn,
  headerSurface: Surface | undefined,
  rows: readonly (readonly Surface[])[],
  columnIndex: number,
): number {
  const fixedWidth = normalizeColumnWidth(column.width);
  if (fixedWidth !== undefined) return fixedWidth;

  let preferred = Math.max(1, headerSurface?.width ?? 0);
  for (const row of rows) {
    preferred = Math.max(preferred, row[columnIndex]?.width ?? 0);
  }

  const maxWidth = sanitizeOptionalNonNegativeInt(column.maxWidth);
  if (maxWidth !== undefined) preferred = Math.min(preferred, maxWidth);

  const minWidth = sanitizeOptionalNonNegativeInt(column.minWidth);
  if (minWidth !== undefined) preferred = Math.max(preferred, Math.min(minWidth, maxWidth ?? minWidth));

  return preferred;
}

function columnMinWidth(column: TableColumn, preferredWidth: number): number {
  const fixedWidth = normalizeColumnWidth(column.width);
  if (fixedWidth !== undefined) return fixedWidth;

  const maxWidth = sanitizeOptionalNonNegativeInt(column.maxWidth);
  const rawMinWidth = sanitizeOptionalNonNegativeInt(column.minWidth) ?? Math.min(1, preferredWidth);
  const constrainedMin = Math.min(rawMinWidth, maxWidth ?? rawMinWidth);
  return Math.min(preferredWidth, constrainedMin);
}

export function fitTableSurfaceColumnWidths(
  columns: readonly TableColumn[],
  headerSurfaces: readonly Surface[],
  rows: readonly (readonly Surface[])[],
  layout: TableLayout,
  targetWidth: number | undefined,
): number[] {
  const preferred = columns.map((column, index) => columnPreferredWidth(
    column,
    headerSurfaces[index],
    rows,
    index,
  ));
  if (layout === 'intrinsic' && targetWidth === undefined) return preferred;

  const contentTarget = targetWidth === undefined
    ? undefined
    : Math.max(0, targetWidth - tableSurfaceStructuralOverhead(columns.length));
  if (contentTarget === undefined) return preferred;

  const preferredTotal = preferred.reduce((sum, width) => sum + width, 0);
  if (preferredTotal <= contentTarget) return preferred;

  const minimum = columns.map((column, index) => columnMinWidth(column, preferred[index] ?? 0));
  const minimumTotal = minimum.reduce((sum, width) => sum + width, 0);
  if (minimumTotal >= contentTarget) return minimum;

  const widths = [...minimum];
  const remainingCapacity = preferred.map((width, index) => Math.max(0, width - (minimum[index] ?? 0)));
  let remainingBudget = contentTarget - minimumTotal;

  while (remainingBudget > 0) {
    const active = remainingCapacity
      .map((capacity, index) => ({ capacity, index }))
      .filter((entry) => entry.capacity > 0);
    if (active.length === 0) break;

    const totalWeight = active.reduce((sum, entry) => (
      sum + Math.max(1, normalizePositiveWeight(columns[entry.index]?.weight))
    ), 0);
    let used = 0;
    const remainders: { readonly index: number; readonly remainder: number; readonly capacity: number }[] = [];

    for (const entry of active) {
      const weight = Math.max(1, normalizePositiveWeight(columns[entry.index]?.weight));
      const exact = (remainingBudget * weight) / totalWeight;
      const add = Math.min(entry.capacity, Math.floor(exact));
      if (add > 0) {
        widths[entry.index] = (widths[entry.index] ?? 0) + add;
        remainingCapacity[entry.index] = (remainingCapacity[entry.index] ?? 0) - add;
        used += add;
      }
      remainders.push({
        index: entry.index,
        remainder: exact - Math.floor(exact),
        capacity: remainingCapacity[entry.index] ?? 0,
      });
    }

    if (used === 0) {
      const next = remainders
        .filter((entry) => entry.capacity > 0)
        .sort((left, right) => {
          if (right.remainder !== left.remainder) return right.remainder - left.remainder;
          return (remainingCapacity[right.index] ?? 0) - (remainingCapacity[left.index] ?? 0);
        })[0];
      if (!next) break;
      widths[next.index] = (widths[next.index] ?? 0) + 1;
      remainingCapacity[next.index] = (remainingCapacity[next.index] ?? 0) - 1;
      used = 1;
    }

    remainingBudget -= used;
  }

  return widths;
}
