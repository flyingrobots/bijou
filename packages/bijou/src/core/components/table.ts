import { RESET_SGR } from '../ansi.js';
import { ANSI_OSC8_RE, ANSI_SGR_RE, graphemeClusterWidth, segmentGraphemes, stripAnsi } from '../text/grapheme.js';
import type { BijouContext } from '../../ports/context.js';
import type { TokenValue } from '../theme/tokens.js';
import { resolveCtx } from '../resolve-ctx.js';
import { renderByMode } from '../mode-render.js';
import { makeBgFill } from '../bg-fill.js';
import { resolveOverflowBehavior } from './overflow.js';
import type { BijouNodeOptions } from './types.js';

/** Definition for a single table column. */
export interface TableColumn {
  /** Column header text. */
  header: string;
  /** Fixed column width in characters. When omitted, width is auto-calculated from content. */
  width?: number;
}

export type TableTextCell = string;
export type TableTextRow = readonly TableTextCell[];

/** Configuration for rendering a table. */
export interface TableOptions extends BijouNodeOptions {
  /** Column definitions (headers and optional widths). */
  columns: readonly TableColumn[];
  /** Two-dimensional array of cell strings, one inner array per row. */
  rows: readonly TableTextRow[];
  /** Theme token applied to header text. */
  headerToken?: TokenValue;
  /** Theme token applied to border characters. */
  borderToken?: TokenValue;
  /** Background fill token for the header row. No default — opt-in only. */
  headerBgToken?: TokenValue;
  /** Bijou context for I/O, styling, and mode detection. */
  ctx?: BijouContext;
}

function isTableOptions(value: TableOptions | readonly TableColumn[]): value is TableOptions {
  return !Array.isArray(value);
}

/**
 * Calculate the visible (non-ANSI) character length of a string.
 *
 * @param str - Input string potentially containing ANSI codes.
 * @returns The number of visible characters.
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

function normalizeColumnWidth(width: number | undefined): number | undefined {
  if (width == null) return undefined;
  if (!Number.isFinite(width)) return 0;
  return Math.max(0, Math.floor(width));
}

function formatCellLines(
  value: string,
  width: number,
  overflow: 'wrap' | 'truncate',
  fixedWidth: boolean,
): string[] {
  const safeValue = value ?? '';
  if (!fixedWidth) return safeValue.split('\n');
  if (overflow === 'truncate') {
    return safeValue.split('\n').map((line) => clipCellToWidth(line, width));
  }
  return safeValue.split('\n').flatMap((line) => wrapCellToWidth(line, width));
}

const TABLE_EMOJI_PRESENTATION_RE = /\p{Emoji_Presentation}/u;

type TableWrapToken =
  | { readonly kind: 'ansi'; readonly raw: string }
  | { readonly kind: 'grapheme'; readonly raw: string; readonly width: number };

function tableGraphemeWidth(grapheme: string): number {
  if (TABLE_EMOJI_PRESENTATION_RE.test(grapheme)) return 2;
  return graphemeClusterWidth(grapheme);
}

function isOsc8Escape(raw: string): boolean {
  return raw.startsWith('\x1b]8;;');
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

function clipCellToWidth(str: string, maxWidth: number): string {
  if (maxWidth <= 0) return '';

  const tokens = tokenizeTableText(str);
  let visible = 0;
  let result = '';
  let hasStyle = false;

  for (const token of tokens) {
    if (token.kind === 'ansi') {
      result += token.raw;
      if (!isOsc8Escape(token.raw)) {
        hasStyle = true;
      }
      continue;
    }

    if (visible + token.width > maxWidth) {
      if (hasStyle && !result.endsWith(RESET_SGR)) result += RESET_SGR;
      break;
    }

    result += token.raw;
    visible += token.width;
  }

  return result;
}

function wrapCellToWidth(str: string, maxWidth: number): string[] {
  if (maxWidth <= 0) return [''];

  const tokens = tokenizeTableText(str);
  if (tokens.length === 0) return [''];

  const lines: string[] = [];
  let current = '';
  let currentWidth = 0;
  let activeStyle = '';

  for (const token of tokens) {
    if (token.kind === 'ansi') {
      current += token.raw;
      if (isOsc8Escape(token.raw)) continue;
      activeStyle = isResetEscape(token.raw) ? '' : activeStyle + token.raw;
      continue;
    }

    if (currentWidth + token.width > maxWidth && currentWidth > 0) {
      lines.push(activeStyle.length === 0 || current.endsWith(RESET_SGR) ? current : current + RESET_SGR);
      current = activeStyle + token.raw;
      currentWidth = token.width;
      continue;
    }

    current += token.raw;
    currentWidth += token.width;
  }

  if (current.length > 0) {
    lines.push(activeStyle.length === 0 || current.endsWith(RESET_SGR) ? current : current + RESET_SGR);
  }

  return lines.length > 0 ? lines : [''];
}

/**
 * Render a table with unicode box-drawing borders.
 *
 * Output adapts to the current output mode:
 * - `interactive` / `static` — bordered table with styled headers.
 * - `pipe` — tab-separated values (TSV).
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
  const columns = options.columns ?? [];
  const rows = (options.rows ?? []).map(row => (row ?? []).map(cell => cell ?? ''));

  return renderByMode(ctx.mode, {
    pipe: () => {
      const headerLine = columns.map((c) => c.header ?? '').join('\t');
      const dataLines = rows.map((row) => row.join('\t'));
      return [headerLine, ...dataLines].join('\n');
    },
    accessible: () => {
      const lines: string[] = [];
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]!;
        const pairs = columns.map((col, j) => `${col.header ?? ''}=${row[j] ?? ''}`);
        lines.push(`Row ${i + 1}: ${pairs.join(', ')}`);
      }
      return lines.join('\n');
    },
    interactive: () => {
      const headerToken = options.headerToken ?? ctx.ui('tableHeader');
      const borderToken = options.borderToken ?? ctx.border('muted');
      const overflow = resolveOverflowBehavior(
        options.overflow,
        ctx.resolveBCSS({ type: 'Table', id: options.id, classes: options.class?.split(' ') }),
      );
      const bc = (s: string): string => ctx.style.styled(borderToken, s);

      const colWidths = columns.map((col, i) => {
        const normalizedWidth = normalizeColumnWidth(col.width);
        if (normalizedWidth !== undefined) return normalizedWidth;
        let max = visibleLength(col.header ?? '');
        for (const row of rows) {
          const cell = row[i] ?? '';
          max = Math.max(max, visibleLength(cell));
        }
        return max;
      });

      const h = '\u2500';
      const v = '\u2502';

      const hLine = (left: string, mid: string, right: string): string => {
        const segments = colWidths.map((w) => h.repeat(w + 2));
        return bc(left + segments.join(mid) + right);
      };

      const top    = hLine('\u250c', '\u252c', '\u2510');
      const midSep = hLine('\u251c', '\u253c', '\u2524');
      const bottom = hLine('\u2514', '\u2534', '\u2518');

      const hdrBgFill = makeBgFill(options.headerBgToken, ctx);
      const headerLinesByColumn = columns.map((col, i) => formatCellLines(
        ctx.style.styled(headerToken, col.header ?? ''),
        colWidths[i]!,
        overflow,
        col.width !== undefined,
      ));
      const headerHeight = headerLinesByColumn.reduce((max, lines) => Math.max(max, lines.length), 1);
      const headerRows = Array.from({ length: headerHeight }, (_row, rowIndex) => {
        const headerCells = columns.map((_col, i) =>
          ' ' + padRight(headerLinesByColumn[i]![rowIndex] ?? '', colWidths[i]!) + ' ',
        );
        const rawHeaderRow = bc(v) + headerCells.join(bc(v)) + bc(v);
        return hdrBgFill ? hdrBgFill(rawHeaderRow) : rawHeaderRow;
      });

      const dataRows = rows.flatMap((row) => {
        const cellLines = colWidths.map((w, i) => formatCellLines(
          row[i] ?? '',
          w,
          overflow,
          columns[i]?.width !== undefined,
        ));
        const rowHeight = cellLines.reduce((max, lines) => Math.max(max, lines.length), 1);
        return Array.from({ length: rowHeight }, (_line, lineIndex) => {
          const cells = colWidths.map((w, i) => ' ' + padRight(cellLines[i]![lineIndex] ?? '', w) + ' ');
          return bc(v) + cells.join(bc(v)) + bc(v);
        });
      });

      const lines = [top, ...headerRows, midSep, ...dataRows, bottom];
      return lines.join('\n');
    },
  }, options);
}
