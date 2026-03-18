import { graphemeWidth } from '../text/grapheme.js';
import { clipToWidth } from '../text/clip.js';
import { wrapToWidth } from '../text/wrap.js';
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

/** Configuration for rendering a table. */
export interface TableOptions extends BijouNodeOptions {
  /** Column definitions (headers and optional widths). */
  columns: TableColumn[];
  /** Two-dimensional array of cell strings, one inner array per row. */
  rows: string[][];
  /** Theme token applied to header text. */
  headerToken?: TokenValue;
  /** Theme token applied to border characters. */
  borderToken?: TokenValue;
  /** Background fill token for the header row. No default — opt-in only. */
  headerBgToken?: TokenValue;
  /** Bijou context for I/O, styling, and mode detection. */
  ctx?: BijouContext;
}

/**
 * Calculate the visible (non-ANSI) character length of a string.
 *
 * @param str - Input string potentially containing ANSI codes.
 * @returns The number of visible characters.
 */
function visibleLength(str: string): number {
  return graphemeWidth(str);
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
    return safeValue.split('\n').map((line) => clipToWidth(line, width));
  }
  return safeValue.split('\n').flatMap((line) => wrapToWidth(line, width));
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
export function table(options: TableOptions): string {
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
