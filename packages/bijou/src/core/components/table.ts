import { RESET_SGR } from '../ansi.js';
import {
  ANSI_OSC8_RE,
  ANSI_SGR_RE,
  graphemeClusterWidth,
  segmentGraphemes,
  stripAnsi,
} from '../text/grapheme.js';
import { wrapToWidth } from '../text/wrap.js';
import type { BijouContext } from '../../ports/context.js';
import type { TokenValue } from '../theme/tokens.js';
import { resolveCtx } from '../resolve-ctx.js';
import { renderByMode } from '../mode-render.js';
import { makeBgFill } from '../bg-fill.js';
import {
  sanitizeNonNegativeInt,
  sanitizeOptionalNonNegativeInt,
  sanitizeOptionalPositiveInt,
  sanitizePositiveInt,
} from '../numeric.js';
import { resolveOverflowBehavior } from './overflow.js';
import type { BijouNodeOptions, OverflowBehavior } from './types.js';

export type TableLayout = 'auto' | 'intrinsic';
export type TableVariant =
  | 'box'
  | 'ascii-grid'
  | 'ruled'
  | 'header-rule'
  | 'plain'
  | 'markdown'
  | 'definition'
  | 'expanded';
export type TablePipeFormat = 'tsv' | 'csv' | 'markdown' | 'ascii-grid';
export type TableCellAlign = 'left' | 'right' | 'center';
export type TableWrapMode = 'word' | 'grapheme';

/** Definition for a single table column. */
export interface TableColumn {
  /** Column header text. */
  header: string;
  /** Fixed column width in characters. When omitted, width is calculated from content and layout policy. */
  width?: number;
  /** Minimum fitted width for responsive layouts. */
  minWidth?: number;
  /** Maximum fitted width for responsive layouts. */
  maxWidth?: number;
  /** Relative share of extra responsive width. Defaults to `1`. */
  weight?: number;
  /** Horizontal alignment for header and cell content. Defaults to `'left'`. */
  align?: TableCellAlign;
}

export type TableTextCell = string;
export type TableTextRow = readonly TableTextCell[];

/** Configuration for rendering a table. */
export interface TableOptions extends BijouNodeOptions {
  /** Column definitions (headers and optional layout constraints). */
  columns?: readonly TableColumn[];
  /** Two-dimensional array of cell strings, one inner array per row. */
  rows: readonly TableTextRow[];
  /** Human-mode layout policy. Defaults to `'auto'`. */
  layout?: TableLayout;
  /** Human-mode visual style. Defaults to `'box'`. */
  variant?: TableVariant;
  /** Pipe-mode serialization. Defaults to `'tsv'`. */
  pipeFormat?: TablePipeFormat;
  /** Total render width for fitted layouts. Defaults to `ctx.runtime.columns` in human modes. */
  width?: number;
  /** Maximum total render width for fitted layouts. */
  maxWidth?: number;
  /** Spaces between columns for borderless variants. Defaults to `2`. */
  columnGap?: number;
  /** Wrapping strategy for constrained cells. Defaults to `'word'`. */
  wrap?: TableWrapMode;
  /** Theme token applied to header text. */
  headerToken?: TokenValue;
  /** Theme token applied to border characters. */
  borderToken?: TokenValue;
  /** Background fill token for the header row. No default — opt-in only. */
  headerBgToken?: TokenValue;
  /** Bijou context for I/O, styling, and mode detection. */
  ctx?: BijouContext;
}

interface NormalizedTable {
  readonly columns: readonly TableColumn[];
  readonly rows: readonly string[][];
}

interface FittedColumn {
  readonly header: string;
  readonly width: number;
  readonly align: TableCellAlign;
}

interface FittedRow {
  readonly cells: readonly (readonly string[])[];
  readonly height: number;
}

interface FittedTable {
  readonly columns: readonly FittedColumn[];
  readonly widths: readonly number[];
  readonly headerLines: readonly (readonly string[])[];
  readonly headerHeight: number;
  readonly rows: readonly FittedRow[];
  readonly columnGap: number;
}

type TableWrapToken =
  | { readonly kind: 'ansi'; readonly raw: string }
  | { readonly kind: 'grapheme'; readonly raw: string; readonly width: number };

/**
 * Structural width added by the interactive table frame for a given column count.
 *
 * Each column contributes two padding spaces and one vertical divider, with one
 * extra border character for the outer edge.
 */
export function interactiveTableBorderOverhead(columnCount: number): number {
  return Math.max(0, columnCount) * 3 + 1;
}

/**
 * Total rendered width of an interactive table for the supplied column widths.
 */
export function measureInteractiveTableWidth(columnWidths: readonly number[]): number {
  return columnWidths.reduce((total, width) => total + width, 0)
    + interactiveTableBorderOverhead(columnWidths.length);
}

function isTableOptions(value: TableOptions | readonly TableColumn[]): value is TableOptions {
  return !Array.isArray(value);
}

/**
 * Calculate the visible (non-ANSI) display width of a string.
 *
 * @param str - Input string potentially containing ANSI codes.
 * @returns The number of visible terminal columns.
 */
function visibleLength(str: string): number {
  let width = 0;
  for (const grapheme of segmentGraphemes(stripAnsi(str))) {
    width += tableGraphemeWidth(grapheme);
  }
  return width;
}

/**
 * Right-pad a string to a target width, accounting for ANSI escape sequences.
 *
 * @param str - Input string to pad.
 * @param width - Desired visible width.
 * @returns The padded string.
 */
function padRight(str: string, width: number): string {
  const visible = visibleLength(str);
  return visible >= width ? str : str + ' '.repeat(width - visible);
}

function padLeft(str: string, width: number): string {
  const visible = visibleLength(str);
  return visible >= width ? str : ' '.repeat(width - visible) + str;
}

function padCenter(str: string, width: number): string {
  const visible = visibleLength(str);
  if (visible >= width) return str;
  const remaining = width - visible;
  const left = Math.floor(remaining / 2);
  return ' '.repeat(left) + str + ' '.repeat(remaining - left);
}

function alignCell(str: string, width: number, align: TableCellAlign): string {
  if (align === 'right') return padLeft(str, width);
  if (align === 'center') return padCenter(str, width);
  return padRight(str, width);
}

function normalizeColumnWidth(width: number | undefined): number | undefined {
  return sanitizeOptionalNonNegativeInt(width);
}

function normalizePositiveWeight(weight: number | undefined): number {
  if (weight == null || !Number.isFinite(weight)) return 1;
  return Math.max(0, Math.floor(weight));
}

function maxVisibleLineWidth(value: string): number {
  const lines = String(value ?? '').split('\n');
  return lines.reduce((max, line) => Math.max(max, visibleLength(line)), 0);
}

function normalizeRows(rows: readonly TableTextRow[] | undefined): string[][] {
  return (rows ?? []).map(row => (row ?? []).map(cell => String(cell ?? '')));
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

  const inferredCount = rows.reduce((max, row) => Math.max(max, row.length), 0);
  return Array.from({ length: inferredCount }, () => ({ header: '' }));
}

function normalizeTable(options: TableOptions): NormalizedTable {
  const rows = normalizeRows(options.rows);
  const variant = options.variant ?? 'box';
  return {
    columns: resolveColumns(options.columns, rows, variant),
    rows,
  };
}

function structuralOverhead(variant: TableVariant, columnCount: number, columnGap: number): number {
  if (columnCount <= 0) return variant === 'box' || variant === 'ascii-grid' ? 2 : 0;
  if (variant === 'box' || variant === 'ascii-grid') {
    return interactiveTableBorderOverhead(columnCount);
  }
  if (variant === 'markdown') {
    return columnCount * 3 + 1;
  }
  return Math.max(0, columnCount - 1) * columnGap;
}

function resolveTargetWidth(
  options: TableOptions,
  ctx: BijouContext,
  layout: TableLayout,
): number | undefined {
  const explicitWidth = sanitizeOptionalPositiveInt(options.width);
  if (explicitWidth !== undefined) return explicitWidth;

  const explicitMaxWidth = sanitizeOptionalPositiveInt(options.maxWidth);
  if (layout === 'intrinsic') return explicitMaxWidth;

  const runtimeWidth = sanitizePositiveInt(ctx.runtime.columns, 80);
  return explicitMaxWidth === undefined ? runtimeWidth : Math.min(runtimeWidth, explicitMaxWidth);
}

function columnPreferredWidth(
  column: TableColumn,
  rows: readonly string[][],
  columnIndex: number,
): number {
  const fixedWidth = normalizeColumnWidth(column.width);
  if (fixedWidth !== undefined) return fixedWidth;

  let preferred = Math.max(1, maxVisibleLineWidth(column.header ?? ''));
  for (const row of rows) {
    preferred = Math.max(preferred, maxVisibleLineWidth(row[columnIndex] ?? ''));
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

function fitColumnWidths(
  columns: readonly TableColumn[],
  rows: readonly string[][],
  variant: TableVariant,
  layout: TableLayout,
  targetWidth: number | undefined,
  columnGap: number,
): number[] {
  const preferred = columns.map((column, index) => columnPreferredWidth(column, rows, index));
  if (layout === 'intrinsic' && targetWidth === undefined) return preferred;

  const contentTarget = targetWidth === undefined
    ? undefined
    : Math.max(0, targetWidth - structuralOverhead(variant, columns.length, columnGap));
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
      .filter(entry => entry.capacity > 0);
    if (active.length === 0) break;

    const totalWeight = active.reduce((sum, entry) => {
      return sum + Math.max(1, normalizePositiveWeight(columns[entry.index]?.weight));
    }, 0);
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
      const sortedRemainders = remainders
        .filter(entry => entry.capacity > 0)
        .sort((left, right) => {
          if (right.remainder !== left.remainder) return right.remainder - left.remainder;
          return remainingCapacity[right.index]! - remainingCapacity[left.index]!;
        });
      const next = sortedRemainders[0];
      if (!next) break;
      widths[next.index]!++;
      remainingCapacity[next.index]!--;
      used = 1;
    }

    remainingBudget -= used;
  }

  return widths;
}

function formatCellLines(
  value: string,
  width: number,
  overflow: OverflowBehavior,
  wrapMode: TableWrapMode,
): string[] {
  const safeValue = value ?? '';
  if (overflow === 'truncate') {
    return safeValue.split('\n').map(line => clipCellToWidth(line, width));
  }
  if (wrapMode === 'word') return wrapToWidth(safeValue, width);
  return safeValue.split('\n').flatMap(line => wrapCellToWidth(line, width));
}

const TABLE_EMOJI_PRESENTATION_RE = /\p{Emoji_Presentation}/u;

function tableGraphemeWidth(grapheme: string): number {
  if (TABLE_EMOJI_PRESENTATION_RE.test(grapheme)) return 2;
  return graphemeClusterWidth(grapheme);
}

function isOsc8Escape(raw: string): boolean {
  return raw.startsWith('\x1b]8;;');
}

const OSC8_CLOSE = '\x1b]8;;\x1b\\';
const OSC8_CLOSE_BEL = '\x1b]8;;\x07';

function isOsc8Close(raw: string): boolean {
  return raw === OSC8_CLOSE || raw === OSC8_CLOSE_BEL;
}

function isResetEscape(raw: string): boolean {
  return raw === RESET_SGR;
}

function tokenizeTableText(str: string): TableWrapToken[] {
  const regex = new RegExp(`${ANSI_SGR_RE.source}|${ANSI_OSC8_RE.source}`, 'g');
  const tokens: TableWrapToken[] = [];
  let lastIndex = 0;

  for (const match of str.matchAll(regex)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      const raw = str.slice(lastIndex, index);
      for (const grapheme of segmentGraphemes(raw)) {
        tokens.push({
          kind: 'grapheme',
          raw: grapheme,
          width: tableGraphemeWidth(grapheme),
        });
      }
    }

    tokens.push({ kind: 'ansi', raw: match[0] });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < str.length) {
    const raw = str.slice(lastIndex);
    for (const grapheme of segmentGraphemes(raw)) {
      tokens.push({
        kind: 'grapheme',
        raw: grapheme,
        width: tableGraphemeWidth(grapheme),
      });
    }
  }

  return tokens;
}

function activeTableAnsiPrefix(activeOsc8: string, activeStyle: string): string {
  return activeOsc8 + activeStyle;
}

function finalizeTableWrappedLine(raw: string, activeOsc8: string, activeStyle: string): string {
  let result = raw;
  if (activeOsc8.length > 0 && !result.endsWith(OSC8_CLOSE) && !result.endsWith(OSC8_CLOSE_BEL)) {
    result += OSC8_CLOSE;
  }
  if (activeStyle.length > 0 && !result.endsWith(RESET_SGR)) {
    result += RESET_SGR;
  }
  return result;
}

function clipCellToWidth(str: string, maxWidth: number): string {
  if (maxWidth <= 0) return '';

  const tokens = tokenizeTableText(str);
  let visible = 0;
  let result = '';
  let hasStyle = false;
  let activeOsc8 = '';

  for (const token of tokens) {
    if (token.kind === 'ansi') {
      result += token.raw;
      if (isOsc8Escape(token.raw)) {
        activeOsc8 = isOsc8Close(token.raw) ? '' : token.raw;
      } else {
        hasStyle = !isResetEscape(token.raw);
      }
      continue;
    }

    if (visible + token.width > maxWidth) {
      if (activeOsc8.length > 0) result += OSC8_CLOSE;
      if (hasStyle && !result.endsWith(RESET_SGR)) result += RESET_SGR;
      break;
    }

    result += token.raw;
    visible += token.width;
  }

  return activeOsc8.length > 0 || hasStyle
    ? finalizeTableWrappedLine(result, activeOsc8, hasStyle ? RESET_SGR : '')
    : result;
}

function wrapCellToWidth(str: string, maxWidth: number): string[] {
  if (maxWidth <= 0) return [''];

  const tokens = tokenizeTableText(str);
  if (tokens.length === 0) return [''];

  const lines: string[] = [];
  let current = '';
  let currentWidth = 0;
  let activeStyle = '';
  let activeOsc8 = '';

  for (const token of tokens) {
    if (token.kind === 'ansi') {
      current += token.raw;
      if (isOsc8Escape(token.raw)) {
        activeOsc8 = isOsc8Close(token.raw) ? '' : token.raw;
        continue;
      }
      activeStyle = isResetEscape(token.raw) ? '' : activeStyle + token.raw;
      continue;
    }

    if (currentWidth + token.width > maxWidth && currentWidth > 0) {
      lines.push(finalizeTableWrappedLine(current, activeOsc8, activeStyle));
      current = activeTableAnsiPrefix(activeOsc8, activeStyle) + token.raw;
      currentWidth = token.width;
      continue;
    }

    current += token.raw;
    currentWidth += token.width;
  }

  if (current.length > 0) {
    lines.push(finalizeTableWrappedLine(current, activeOsc8, activeStyle));
  }

  return lines.length > 0 ? lines : [''];
}

function buildFittedTable(
  options: TableOptions,
  ctx: BijouContext,
  tableData: NormalizedTable,
  variant: TableVariant,
  optionsOverride: {
    readonly styleHeaders?: boolean;
    readonly layout?: TableLayout;
    readonly rows?: readonly string[][];
    readonly columns?: readonly TableColumn[];
  } = {},
): FittedTable {
  const columns = optionsOverride.columns ?? tableData.columns;
  const rows = optionsOverride.rows ?? tableData.rows;
  const layout = optionsOverride.layout ?? options.layout ?? 'auto';
  const columnGap = sanitizeNonNegativeInt(options.columnGap, 2);
  const overflow = resolveOverflowBehavior(
    options.overflow,
    ctx.resolveBCSS({ type: 'Table', id: options.id, classes: options.class?.split(' ') }),
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
  const styleHeaders = optionsOverride.styleHeaders ?? true;
  const headerLines = columns.map((column, index) => {
    const header = column.header ?? '';
    const value = styleHeaders ? ctx.style.styled(headerToken, header) : header;
    return formatCellLines(value, widths[index] ?? 0, overflow, wrapMode);
  });
  const headerHeight = headerLines.reduce((max, lines) => Math.max(max, lines.length), 1);
  const fittedRows = rows.map((row) => {
    const cells = widths.map((width, index) => {
      return formatCellLines(row[index] ?? '', width, overflow, wrapMode);
    });
    const height = cells.reduce((max, lines) => Math.max(max, lines.length), 1);
    return { cells, height };
  });

  return {
    columns: columns.map((column, index) => ({
      header: column.header ?? '',
      width: widths[index] ?? 0,
      align: column.align ?? 'left',
    })),
    widths,
    headerLines,
    headerHeight,
    rows: fittedRows,
    columnGap,
  };
}

function renderGridTable(
  model: FittedTable,
  options: TableOptions,
  ctx: BijouContext,
  variant: 'box' | 'ascii-grid',
  styled = true,
): string {
  const borderToken = options.borderToken ?? ctx.border('muted');
  const bc = (s: string): string => styled ? ctx.style.styled(borderToken, s) : s;
  const chars = variant === 'box'
    ? {
        h: '\u2500',
        v: '\u2502',
        topLeft: '\u250c',
        topMid: '\u252c',
        topRight: '\u2510',
        midLeft: '\u251c',
        midMid: '\u253c',
        midRight: '\u2524',
        bottomLeft: '\u2514',
        bottomMid: '\u2534',
        bottomRight: '\u2518',
      }
    : {
        h: '-',
        v: '|',
        topLeft: '+',
        topMid: '+',
        topRight: '+',
        midLeft: '+',
        midMid: '+',
        midRight: '+',
        bottomLeft: '+',
        bottomMid: '+',
        bottomRight: '+',
      };

  const hLine = (left: string, mid: string, right: string): string => {
    const segments = model.widths.map(w => chars.h.repeat(w + 2));
    return bc(left + segments.join(mid) + right);
  };

  const top = hLine(chars.topLeft, chars.topMid, chars.topRight);
  const midSep = hLine(chars.midLeft, chars.midMid, chars.midRight);
  const bottom = hLine(chars.bottomLeft, chars.bottomMid, chars.bottomRight);
  const hdrBgFill = styled ? makeBgFill(options.headerBgToken, ctx) : undefined;

  const headerRows = Array.from({ length: model.headerHeight }, (_row, rowIndex) => {
    const headerCells = model.columns.map((column, i) =>
      ' ' + alignCell(model.headerLines[i]?.[rowIndex] ?? '', column.width, column.align) + ' ',
    );
    const rawHeaderRow = bc(chars.v) + headerCells.join(bc(chars.v)) + bc(chars.v);
    return hdrBgFill ? hdrBgFill(rawHeaderRow) : rawHeaderRow;
  });

  const dataRows = model.rows.flatMap((row) => {
    return Array.from({ length: row.height }, (_line, lineIndex) => {
      const cells = model.columns.map((column, i) =>
        ' ' + alignCell(row.cells[i]?.[lineIndex] ?? '', column.width, column.align) + ' ',
      );
      return bc(chars.v) + cells.join(bc(chars.v)) + bc(chars.v);
    });
  });

  return [top, ...headerRows, midSep, ...dataRows, bottom].join('\n');
}

function renderBorderlessRow(
  model: FittedTable,
  cells: readonly (readonly string[])[],
  rowIndex: number,
): string {
  const gap = ' '.repeat(model.columnGap);
  return model.columns
    .map((column, index) => alignCell(cells[index]?.[rowIndex] ?? '', column.width, column.align))
    .join(gap)
    .trimEnd();
}

function renderRule(model: FittedTable, char: string, ctx: BijouContext, options: TableOptions): string {
  const borderToken = options.borderToken ?? ctx.border('muted');
  const line = model.widths.map(width => char.repeat(width)).join(' '.repeat(model.columnGap)).trimEnd();
  return ctx.style.styled(borderToken, line);
}

function renderRuledTable(
  model: FittedTable,
  options: TableOptions,
  ctx: BijouContext,
  includeRowRules: boolean,
): string {
  const lines = Array.from({ length: model.headerHeight }, (_row, index) => {
    return renderBorderlessRow(model, model.headerLines, index);
  });
  lines.push(renderRule(model, '\u2501', ctx, options));

  for (let rowIndex = 0; rowIndex < model.rows.length; rowIndex++) {
    const row = model.rows[rowIndex]!;
    for (let lineIndex = 0; lineIndex < row.height; lineIndex++) {
      lines.push(renderBorderlessRow(model, row.cells, lineIndex));
    }
    if (includeRowRules && rowIndex < model.rows.length - 1) {
      lines.push(renderRule(model, '\u2500', ctx, options));
    }
  }

  return lines.join('\n');
}

function renderHeaderRuleTable(
  model: FittedTable,
): string {
  const lines = Array.from({ length: model.headerHeight }, (_row, index) => {
    return renderBorderlessRow(model, model.headerLines, index);
  });
  lines.push(model.widths.map(width => '-'.repeat(width)).join(' '.repeat(model.columnGap)).trimEnd());

  for (const row of model.rows) {
    for (let lineIndex = 0; lineIndex < row.height; lineIndex++) {
      lines.push(renderBorderlessRow(model, row.cells, lineIndex));
    }
  }

  return lines.join('\n');
}

function renderPlainTable(model: FittedTable): string {
  const lines = Array.from({ length: model.headerHeight }, (_row, index) => {
    return renderBorderlessRow(model, model.headerLines, index);
  });

  for (const row of model.rows) {
    for (let lineIndex = 0; lineIndex < row.height; lineIndex++) {
      lines.push(renderBorderlessRow(model, row.cells, lineIndex));
    }
  }

  return lines.join('\n');
}

function markdownSeparator(width: number, align: TableCellAlign): string {
  const segmentWidth = Math.max(3, width + 2);
  if (align === 'right') return '-'.repeat(segmentWidth - 1) + ':';
  if (align === 'center') return ':' + '-'.repeat(segmentWidth - 2) + ':';
  return '-'.repeat(segmentWidth);
}

function renderMarkdownTable(model: FittedTable): string {
  const renderWidths = model.columns.map(column => Math.max(1, column.width));

  const rowLine = (
    cells: readonly (readonly string[])[],
    lineIndex: number,
  ): string => {
    return '|' + model.columns.map((column, index) => {
      const value = cells[index]?.[lineIndex] ?? '';
      return ' ' + alignCell(value, renderWidths[index]!, column.align) + ' ';
    }).join('|') + '|';
  };

  const headerRows = Array.from({ length: model.headerHeight }, (_row, index) => {
    return rowLine(model.headerLines, index);
  });
  const separator = '|' + model.columns.map((column, index) => {
    return markdownSeparator(renderWidths[index]!, column.align);
  }).join('|') + '|';
  const rows = model.rows.flatMap((row) => {
    return Array.from({ length: row.height }, (_line, index) => rowLine(row.cells, index));
  });

  return [...headerRows, separator, ...rows].join('\n');
}

function renderExpandedTable(
  tableData: NormalizedTable,
  options: TableOptions,
  ctx: BijouContext,
): string {
  const borderToken = options.borderToken ?? ctx.border('muted');
  const lines: string[] = [];
  const preferredLabelWidth = tableData.columns.reduce((max, column) => Math.max(max, visibleLength(column.header)), 0);
  const layout = options.layout ?? 'auto';
  const targetWidth = resolveTargetWidth(options, ctx, layout);
  const ruleWidth = targetWidth ?? 40;
  const separator = targetWidth === undefined || targetWidth >= 3
    ? ' | '
    : ' '.repeat(Math.max(0, targetWidth - 1));
  const availableContentWidth = targetWidth === undefined
    ? undefined
    : Math.max(0, targetWidth - separator.length);
  const labelWidth = targetWidth === undefined
    ? preferredLabelWidth
    : Math.min(preferredLabelWidth, Math.floor((availableContentWidth ?? 0) / 2));
  const valueWidth = targetWidth === undefined
    ? undefined
    : Math.max(0, targetWidth - labelWidth - separator.length);
  const overflow = resolveOverflowBehavior(
    options.overflow,
    ctx.resolveBCSS({ type: 'Table', id: options.id, classes: options.class?.split(' ') }),
  );
  const wrapMode = options.wrap ?? 'word';

  for (let rowIndex = 0; rowIndex < tableData.rows.length; rowIndex++) {
    const title = `-[ RECORD ${rowIndex + 1} ]`;
    const clippedTitle = targetWidth === undefined ? title : clipCellToWidth(title, ruleWidth);
    lines.push(ctx.style.styled(
      borderToken,
      clippedTitle + '-'.repeat(Math.max(0, ruleWidth - visibleLength(clippedTitle))),
    ));
    const row = tableData.rows[rowIndex]!;
    for (let columnIndex = 0; columnIndex < tableData.columns.length; columnIndex++) {
      const rawLabel = tableData.columns[columnIndex]?.header ?? '';
      const label = padRight(
        targetWidth === undefined ? rawLabel : clipCellToWidth(rawLabel, labelWidth),
        labelWidth,
      );
      const rawValue = row[columnIndex] ?? '';
      const valueLines = valueWidth === undefined
        ? rawValue.split('\n')
        : formatCellLines(rawValue, valueWidth, overflow, wrapMode);
      for (let lineIndex = 0; lineIndex < valueLines.length; lineIndex++) {
        const lineLabel = lineIndex === 0 ? label : ' '.repeat(labelWidth);
        lines.push(`${lineLabel}${separator}${valueLines[lineIndex] ?? ''}`.trimEnd());
      }
    }
  }

  return lines.join('\n');
}

function markdownEscapeCell(value: string): string {
  return stripAnsi(String(value ?? ''))
    .replace(/\\/g, '\\\\')
    .replace(/\|/g, '\\|')
    .replace(/\r\n?/g, '\n')
    .replace(/\n/g, '<br>');
}

function markdownTableData(tableData: NormalizedTable): NormalizedTable {
  return {
    columns: tableData.columns.map(column => ({
      ...column,
      header: markdownEscapeCell(column.header ?? ''),
    })),
    rows: tableData.rows.map(row => row.map(cell => markdownEscapeCell(cell))),
  };
}

function renderVisualTable(
  options: TableOptions,
  ctx: BijouContext,
  tableData: NormalizedTable,
  variant: TableVariant,
): string {
  if (variant === 'markdown') {
    const markdownData = markdownTableData(tableData);
    const markdownModel = buildFittedTable(options, ctx, markdownData, 'markdown', {
      styleHeaders: false,
    });
    return renderMarkdownTable(markdownModel);
  }
  if (variant === 'expanded') {
    return renderExpandedTable(tableData, options, ctx);
  }

  const model = buildFittedTable(options, ctx, tableData, variant);

  switch (variant) {
    case 'ascii-grid':
      return renderGridTable(model, options, ctx, 'ascii-grid');
    case 'ruled':
      return renderRuledTable(model, options, ctx, true);
    case 'header-rule':
      return renderHeaderRuleTable(model);
    case 'plain':
      return renderPlainTable(model);
    case 'definition':
      return renderRuledTable(model, options, ctx, true);
    case 'box':
    default:
      return renderGridTable(model, options, ctx, 'box');
  }
}

function escapeTsvCell(value: string): string {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\t/g, '\\t')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n');
}

function escapeCsvCell(value: string): string {
  const text = String(value ?? '');
  if (!/[",\r\n]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function renderSeparatedPipe(
  tableData: NormalizedTable,
  separator: string,
  escapeCell: (value: string) => string,
): string {
  const headerLine = tableData.columns.map(column => escapeCell(column.header ?? '')).join(separator);
  const dataLines = tableData.rows.map(row => row.map(escapeCell).join(separator));
  return [headerLine, ...dataLines].join('\n');
}

function renderPipeTable(
  options: TableOptions,
  ctx: BijouContext,
  tableData: NormalizedTable,
): string {
  const format = options.pipeFormat ?? 'tsv';

  if (format === 'csv') return renderSeparatedPipe(tableData, ',', escapeCsvCell);
  if (format === 'markdown') {
    const markdownData = markdownTableData(tableData);
    const markdownModel = buildFittedTable(options, ctx, markdownData, 'markdown', {
      layout: options.layout ?? (options.width !== undefined || options.maxWidth !== undefined ? 'auto' : 'intrinsic'),
      styleHeaders: false,
    });
    return renderMarkdownTable(markdownModel);
  }
  if (format === 'ascii-grid') {
    const model = buildFittedTable(options, ctx, tableData, 'ascii-grid', {
      layout: options.layout ?? (options.width !== undefined || options.maxWidth !== undefined ? 'auto' : 'intrinsic'),
      styleHeaders: false,
    });
    return renderGridTable(model, options, ctx, 'ascii-grid', false);
  }

  return renderSeparatedPipe(tableData, '\t', escapeTsvCell);
}

/**
 * Render a table with mode-aware human variants and pipe serializations.
 *
 * Output adapts to the current output mode:
 * - `interactive` / `static` — responsive visual table. Defaults to the boxed
 *   variant, with optional ruled, plain, markdown, definition, and ASCII grid
 *   variants.
 * - `pipe` — tab-separated values (TSV) by default, with explicit CSV,
 *   Markdown, and ASCII grid formats.
 * - `accessible` — key-value pairs per row for screen readers.
 *
 * @param options - Table configuration including columns and row data.
 * @returns The rendered table string.
 */
export function table(options: TableOptions): string;
export function table(
  columns: readonly TableColumn[],
  rows: readonly TableTextRow[],
  context?: BijouContext,
): string;
export function table(
  optionsOrColumns: TableOptions | readonly TableColumn[],
  rowData?: readonly TableTextRow[],
  context?: BijouContext,
): string {
  let options: TableOptions;
  if (isTableOptions(optionsOrColumns)) {
    options = optionsOrColumns;
  } else {
    options = { columns: [...optionsOrColumns], rows: rowData ?? [], ctx: context };
  }
  const ctx = resolveCtx(options.ctx);
  const tableData = normalizeTable(options);

  return renderByMode(ctx.mode, {
    pipe: () => renderPipeTable(options, ctx, tableData),
    accessible: () => {
      const lines: string[] = [];
      for (let i = 0; i < tableData.rows.length; i++) {
        const row = tableData.rows[i]!;
        const pairs = tableData.columns.map((col, j) => `${col.header ?? ''}=${row[j] ?? ''}`);
        lines.push(`Row ${i + 1}: ${pairs.join(', ')}`);
      }
      return lines.join('\n');
    },
    interactive: () => renderVisualTable(options, ctx, tableData, options.variant ?? 'box'),
  }, options);
}
