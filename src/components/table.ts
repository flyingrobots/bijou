import Table from 'cli-table3';
import { detectOutputMode } from '../detect/tty.js';
import { styled } from '../theme/chalk-adapter.js';
import { getTheme } from '../theme/resolve.js';
import type { TokenValue } from '../theme/tokens.js';

export interface TableColumn {
  /** Column header text. */
  header: string;
  /** Fixed column width. Optional — auto-sized if omitted. */
  width?: number;
}

export interface TableOptions {
  /** Column definitions. */
  columns: TableColumn[];
  /** Row data — each row is an array of strings matching columns. */
  rows: string[][];
  /** Header token override. Uses theme.ui.tableHeader if not specified. */
  headerToken?: TokenValue;
  /** Border token override. Uses theme.border.muted if not specified. */
  borderToken?: TokenValue;
}

/**
 * Renders a themed table string.
 *
 * Degrades by output mode:
 * - interactive/static: Themed cli-table3 with borders + colors
 * - pipe: Tab-separated values
 * - accessible: "Row N: Header=value, Header=value"
 */
export function table(options: TableOptions): string {
  const mode = detectOutputMode();

  if (mode === 'pipe') {
    const headerLine = options.columns.map((c) => c.header).join('\t');
    const dataLines = options.rows.map((row) => row.join('\t'));
    return [headerLine, ...dataLines].join('\n');
  }

  if (mode === 'accessible') {
    const lines: string[] = [];
    for (let i = 0; i < options.rows.length; i++) {
      const row = options.rows[i]!;
      const pairs = options.columns.map((col, j) => `${col.header}=${row[j] ?? ''}`);
      lines.push(`Row ${i + 1}: ${pairs.join(', ')}`);
    }
    return lines.join('\n');
  }

  const t = getTheme();
  const headerToken = options.headerToken ?? (t.theme.ui['tableHeader'] as TokenValue | undefined) ?? t.theme.semantic.primary;

  const colWidths: number[] | undefined = options.columns.some((c) => c.width !== undefined)
    ? options.columns.map((c) => c.width ?? undefined) as number[]
    : undefined;

  const tbl = new Table({
    head: options.columns.map((c) => styled(headerToken, c.header)),
    style: { head: [], border: [] },
    ...(colWidths !== undefined ? { colWidths } : {}),
  });

  for (const row of options.rows) {
    tbl.push(row);
  }

  return tbl.toString();
}
