import type { BijouContext } from '../../ports/context.js';
import { createSurface, isPackedSurface, type Cell, type Surface } from '../../ports/surface.js';
import { resolveSafeCtx as resolveCtx } from '../resolve-ctx.js';
import { colorRgb, type ColorRef } from '../theme/color.js';
import { interactiveTableBorderOverhead, type TableColumn, type TableLayout, type TableOptions } from './table.js';
import { createTextSurface, tokenToCellStyle, wrapSurfaceToWidth } from './surface-text.js';
import { resolveOverflowBehavior } from './overflow.js';
import { encodeModifiers } from '../render/packed-cell.js';
import {
  sanitizeOptionalNonNegativeInt,
  sanitizeOptionalPositiveInt,
  sanitizePositiveInt,
} from '../numeric.js';

export type TableSurfaceCell = string | Surface;
export type TableSurfaceRow = readonly TableSurfaceCell[];

export interface TableSurfaceOptions extends Omit<TableOptions, 'rows'> {
  readonly rows: readonly TableSurfaceRow[];
}

function isTableSurfaceOptions(
  value: TableSurfaceOptions | readonly TableColumn[],
): value is TableSurfaceOptions {
  return !Array.isArray(value);
}

function normalizeColumnWidth(width: number | undefined): number | undefined {
  if (width == null) return undefined;
  if (!Number.isFinite(width)) return 0;
  return Math.max(0, Math.floor(width));
}

function normalizePositiveWeight(weight: number | undefined): number {
  if (weight == null || !Number.isFinite(weight)) return 1;
  return Math.max(0, Math.floor(weight));
}

function resolveTargetWidth(
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

function fitTableSurfaceColumnWidths(
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

  const minimum = columns.map((column, index) => columnMinWidth(column, preferred[index]!));
  const minimumTotal = minimum.reduce((sum, width) => sum + width, 0);
  if (minimumTotal >= contentTarget) return minimum;

  const widths = [...minimum];
  const remainingCapacity = preferred.map((width, index) => Math.max(0, width - minimum[index]!));
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
    const remainders: Array<{ readonly index: number; readonly remainder: number; readonly capacity: number }> = [];

    for (const entry of active) {
      const weight = Math.max(1, normalizePositiveWeight(columns[entry.index]?.weight));
      const exact = (remainingBudget * weight) / totalWeight;
      const add = Math.min(entry.capacity, Math.floor(exact));
      if (add > 0) {
        widths[entry.index]! += add;
        remainingCapacity[entry.index]! -= add;
        used += add;
      }
      remainders.push({
        index: entry.index,
        remainder: exact - Math.floor(exact),
        capacity: remainingCapacity[entry.index]!,
      });
    }

    if (used === 0) {
      const next = remainders
        .filter((entry) => entry.capacity > 0)
        .sort((left, right) => {
          if (right.remainder !== left.remainder) return right.remainder - left.remainder;
          return remainingCapacity[right.index]! - remainingCapacity[left.index]!;
        })[0];
      if (!next) break;
      widths[next.index]!++;
      remainingCapacity[next.index]!--;
      used = 1;
    }

    remainingBudget -= used;
  }

  return widths;
}

function resolveColumns(
  columns: NonNullable<TableOptions['columns']>,
  rows: readonly TableSurfaceCell[][],
): NonNullable<TableOptions['columns']> {
  if (columns.length > 0) return [...columns];

  const inferredCount = rows.reduce((max, row) => Math.max(max, row.length), 0);
  return Array.from({ length: inferredCount }, () => ({ header: '' }));
}

/**
 * Render a bordered data table as a Surface for V3-native composition.
 */
export function tableSurface(options: TableSurfaceOptions): Surface;
export function tableSurface(
  columns: readonly TableColumn[],
  rows: readonly TableSurfaceRow[],
  context?: BijouContext,
): Surface;
export function tableSurface(
  optionsOrColumns: TableSurfaceOptions | readonly TableColumn[],
  rowData?: readonly TableSurfaceRow[],
  context?: BijouContext,
): Surface {
  let options: TableSurfaceOptions;
  if (isTableSurfaceOptions(optionsOrColumns)) {
    options = optionsOrColumns;
  } else {
    options = { columns: [...optionsOrColumns], rows: rowData ?? [], ctx: context };
  }
  const ctx = resolveCtx(options.ctx);
  const overflow = resolveOverflowBehavior(
    options.overflow,
    ctx?.resolveBCSS({ type: 'Table', id: options.id, classes: options.class?.split(' ') }) ?? {},
  );
  const rawRows = (options.rows ?? []).map((row) => (row ?? []).map((cell) => cell ?? ''));
  const columns = resolveColumns(options.columns ?? [], rawRows);
  const rows = rawRows;
  const headerToken = options.headerToken ?? ctx?.ui('tableHeader');
  const headerStyle = tokenToCellStyle(headerToken);
  const borderStyle = tokenToCellStyle(options.borderToken ?? ctx?.border('muted'));
  const headerBg = options.headerBgToken == null ? undefined : tokenToCellStyle(options.headerBgToken);
  const headerSurfaces = columns.map((column) => createTextSurface(column.header ?? '', {
    ...headerStyle,
    bg: headerBg?.bg ?? headerStyle.bg,
  }));
  const cellSurfaces = rows.map((row) => row.map((cell) => typeof cell === 'string' ? createTextSurface(cell) : cell));
  const layout = options.layout ?? 'auto';
  const colWidths = fitTableSurfaceColumnWidths(
    columns,
    headerSurfaces,
    cellSurfaces,
    layout,
    resolveTargetWidth(options, ctx, layout),
  );
  const fittedHeaderSurfaces = headerSurfaces.map((cell, index) => {
    const cellWidth = colWidths[index] ?? 0;
    if (cell.width <= cellWidth || overflow === 'truncate') return cell;
    return wrapSurfaceToWidth(cell, cellWidth);
  });
  const headerHeight = fittedHeaderSurfaces.reduce((max, cell) => Math.max(max, cell.height), 1);
  const fittedCellSurfaces = cellSurfaces.map((row) => row.map((cell, index) => {
    const cellWidth = colWidths[index] ?? 0;
    if (cell.width <= cellWidth || overflow === 'truncate') return cell;
    return wrapSurfaceToWidth(cell, cellWidth);
  }));
  const rowHeights = fittedCellSurfaces.map((row) => row.reduce((max, cell, index) => {
    const cellWidth = colWidths[index] ?? 0;
    if (cellWidth <= 0) return max;
    return Math.max(max, cell.height);
  }, 1));
  const totalWidth = columns.length === 0
    ? 2
    : colWidths.reduce((sum, width) => sum + width + 2, 0) + columns.length + 1;
  const totalHeight = 1 + headerHeight + 1 + rowHeights.reduce((sum, height) => sum + height, 0) + 1;
  const surface = createSurface(totalWidth, totalHeight, { char: ' ', empty: false });

  const packedSurface = isPackedSurface(surface) ? surface : undefined;

  // Pre-parse border style for setRGB fast path
  let bfR = -1, bfG = 0, bfB = 0, bbR = -1, bbG = 0, bbB = 0, bflags = 0;
  if (packedSurface) {
    const rgb = borderStyle.fgRGB ?? colorRgb(borderStyle.fg);
    if (rgb) { const [r, g, b] = rgb; bfR = r; bfG = g; bfB = b; }
  }
  if (packedSurface) {
    const rgb = borderStyle.bgRGB ?? colorRgb(borderStyle.bg);
    if (rgb) { const [r, g, b] = rgb; bbR = r; bbG = g; bbB = b; }
  }
  if (packedSurface) bflags = encodeModifiers(borderStyle.modifiers);

  const setBorder = (x: number, y: number, char: string, bg?: ColorRef): void => {
    if (packedSurface && !bg) {
      packedSurface.setRGB(x, y, char, bfR, bfG, bfB, bbR, bbG, bbB, bflags);
    } else {
      surface.set(x, y, { char, ...borderStyle, bg: bg ?? borderStyle.bg, empty: false });
    }
  };
  const setSpace = (x: number, y: number, bg?: Cell['bg'], fg?: Cell['fg']): void => {
    surface.set(x, y, {
      char: ' ',
      fg: fg ?? headerBg?.fg,
      bg: bg ?? headerBg?.bg,
      fgRGB: headerBg?.fgRGB,
      bgRGB: headerBg?.bgRGB,
      modifiers: headerBg?.modifiers,
      empty: false,
    });
  };

  const drawBorderRow = (y: number, left: string, mid: string, right: string): void => {
    if (columns.length === 0) {
      setBorder(0, y, left);
      setBorder(1, y, right);
      return;
    }

    let x = 0;
    setBorder(x++, y, left);
    for (let i = 0; i < colWidths.length; i++) {
      for (let j = 0; j < colWidths[i]! + 2; j++) setBorder(x++, y, '\u2500');
      setBorder(x++, y, i === colWidths.length - 1 ? right : mid);
    }
  };

  drawBorderRow(0, '\u250c', '\u252c', '\u2510');

  if (columns.length === 0) {
    for (let headerY = 0; headerY < headerHeight; headerY++) {
      setBorder(0, 1 + headerY, '\u2502', headerBg?.bg);
      setBorder(1, 1 + headerY, '\u2502', headerBg?.bg);
    }
    drawBorderRow(1 + headerHeight, '\u251c', '\u253c', '\u2524');
    drawBorderRow(totalHeight - 1, '\u2514', '\u2534', '\u2518');
    return surface;
  }

  for (let headerLine = 0; headerLine < headerHeight; headerLine++) {
    let headerX = 1;
    for (let i = 0; i < columns.length; i++) {
      const cellWidth = colWidths[i]!;
      const headerSurface = fittedHeaderSurfaces[i]!;
      for (let x = headerX; x < headerX + cellWidth + 2; x++) setSpace(x, 1 + headerLine);
      setBorder(headerX - 1, 1 + headerLine, '\u2502', headerBg?.bg);
      surface.blit(headerSurface, headerX + 1, 1 + headerLine, 0, headerLine, cellWidth, 1);
      headerX += cellWidth + 3;
    }
    setBorder(totalWidth - 1, 1 + headerLine, '\u2502', headerBg?.bg);
  }

  drawBorderRow(1 + headerHeight, '\u251c', '\u253c', '\u2524');

  let y = 2 + headerHeight;
  for (let rowIndex = 0; rowIndex < fittedCellSurfaces.length; rowIndex++) {
    const row = fittedCellSurfaces[rowIndex]!;
    const rowHeight = rowHeights[rowIndex]!;
    for (let line = 0; line < rowHeight; line++) {
      let x = 1;
      for (let colIndex = 0; colIndex < columns.length; colIndex++) {
        const cellWidth = colWidths[colIndex]!;
        setBorder(x - 1, y + line, '\u2502');
        for (let fillX = x; fillX < x + cellWidth + 2; fillX++) {
          if (packedSurface) packedSurface.setRGB(fillX, y + line, 0x20, -1, 0, 0, -1, 0, 0);
          else surface.set(fillX, y + line, { char: ' ', empty: false });
        }
        x += cellWidth + 3;
      }
      setBorder(totalWidth - 1, y + line, '\u2502');
    }
    let x = 1;
    for (let colIndex = 0; colIndex < columns.length; colIndex++) {
      const cellWidth = colWidths[colIndex]!;
      const cellSurface = row[colIndex] ?? createTextSurface('');
      surface.blit(cellSurface, x + 1, y, 0, 0, cellWidth, rowHeight);
      x += cellWidth + 3;
    }
    y += rowHeight;
  }

  drawBorderRow(totalHeight - 1, '\u2514', '\u2534', '\u2518');
  return surface;
}
