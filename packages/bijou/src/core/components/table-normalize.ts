import type { BijouContext } from '../../ports/context.js';
import {
  sanitizeOptionalPositiveInt,
  sanitizePositiveInt,
} from '../numeric.js';
import type {
  TableColumn,
  TableLayout,
  TableOptions,
  TableTextRow,
  TableVariant,
} from './table-contract.js';
import type { NormalizedTable } from './table-model.js';

export function isTableOptions(
  value: TableOptions | readonly TableColumn[],
): value is TableOptions {
  return !Array.isArray(value);
}

function normalizeRows(
  rows: readonly TableTextRow[] | undefined,
): string[][] {
  const raw = (rows ?? []) as readonly unknown[];
  return raw.map((row) =>
    Array.isArray(row)
      ? row.map((cell) => (typeof cell === 'string' ? cell : ''))
      : [],
  );
}

function resolveColumns(
  suppliedColumns: readonly TableColumn[] | undefined,
  rows: readonly string[][],
  variant: TableVariant,
): TableColumn[] {
  const columns = suppliedColumns ?? [];
  if (columns.length > 0) return [...columns];
  if (variant === 'definition') {
    return [
      { header: 'Field', minWidth: 5 },
      { header: 'Value', minWidth: 5, weight: 3 },
    ];
  }
  const inferredCount = rows.reduce(
    (max, row) => Math.max(max, row.length),
    0,
  );
  return Array.from({ length: inferredCount }, () => ({ header: '' }));
}

export function normalizeTable(options: TableOptions): NormalizedTable {
  const rows = normalizeRows(options.rows);
  const variant = options.variant ?? 'box';
  const columns = resolveColumns(options.columns, rows, variant);
  return {
    columns,
    rows,
    showHeader:
      variant === 'definition'
      || columns.some((column) => column.header.length > 0),
  };
}

export function resolveTargetWidth(
  options: TableOptions,
  ctx: BijouContext,
  layout: TableLayout,
): number | undefined {
  const width = sanitizeOptionalPositiveInt(options.width);
  if (width !== undefined) return width;
  const maxWidth = sanitizeOptionalPositiveInt(options.maxWidth);
  if (layout === 'intrinsic') return maxWidth;
  const runtimeWidth = sanitizePositiveInt(ctx.runtime.columns, 80);
  return maxWidth === undefined
    ? runtimeWidth
    : Math.min(runtimeWidth, maxWidth);
}
