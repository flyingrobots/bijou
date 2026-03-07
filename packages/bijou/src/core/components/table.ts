import type { BijouContext } from '../../ports/context.js';
import type { TokenValue } from '../theme/tokens.js';
import { resolveCtx } from '../resolve-ctx.js';
import { renderByMode } from '../mode-render.js';
import { makeBgFill } from '../bg-fill.js';

/** Definition for a single table column. */
export interface TableColumn {
  /** Column header text. */
  header: string;
  /** Fixed column width in characters. When omitted, width is auto-calculated from content. */
  width?: number;
}

/** Configuration for rendering a table. */
export interface TableOptions {
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
 * Strip ANSI escape sequences from a string.
 *
 * @param str - Input string potentially containing ANSI codes.
 * @returns The string with all ANSI SGR sequences removed.
 */
function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

/**
 * Calculate the visible (non-ANSI) character length of a string.
 *
 * @param str - Input string potentially containing ANSI codes.
 * @returns The number of visible characters.
 */
function visibleLength(str: string): number {
  return stripAnsi(str).length;
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
      const bc = (s: string): string => ctx.style.styled(borderToken, s);

      const colWidths = columns.map((col, i) => {
        if (col.width !== undefined) return col.width;
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
      const headerCells = columns.map((col, i) =>
        ' ' + padRight(ctx.style.styled(headerToken, col.header ?? ''), colWidths[i]!) + ' ',
      );
      const rawHeaderRow = bc(v) + headerCells.join(bc(v)) + bc(v);
      const headerRow = hdrBgFill ? hdrBgFill(rawHeaderRow) : rawHeaderRow;

      const dataRows = rows.map((row) => {
        const cells = colWidths.map((w, i) => ' ' + padRight(row[i] ?? '', w) + ' ');
        return bc(v) + cells.join(bc(v)) + bc(v);
      });

      const lines = [top, headerRow, midSep, ...dataRows, bottom];
      return lines.join('\n');
    },
  }, options);
}
