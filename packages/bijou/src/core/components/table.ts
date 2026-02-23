import type { BijouContext } from '../../ports/context.js';
import type { TokenValue } from '../theme/tokens.js';
import { getDefaultContext } from '../../context.js';

export interface TableColumn {
  header: string;
  width?: number;
}

export interface TableOptions {
  columns: TableColumn[];
  rows: string[][];
  headerToken?: TokenValue;
  borderToken?: TokenValue;
  ctx?: BijouContext;
}

function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

function visibleLength(str: string): number {
  return stripAnsi(str).length;
}

function padRight(str: string, width: number): string {
  const visible = visibleLength(str);
  return visible >= width ? str : str + ' '.repeat(width - visible);
}

function resolveCtx(ctx?: BijouContext): BijouContext {
  if (ctx) return ctx;
  return getDefaultContext();
}

export function table(options: TableOptions): string {
  const ctx = resolveCtx(options.ctx);
  const mode = ctx.mode;

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

  const headerToken = options.headerToken ?? ctx.theme.theme.ui.tableHeader;
  const borderToken = options.borderToken ?? ctx.theme.theme.border.muted;
  const bc = (s: string): string => ctx.style.styled(borderToken, s);

  const colWidths = options.columns.map((col, i) => {
    if (col.width !== undefined) return col.width;
    let max = col.header.length;
    for (const row of options.rows) {
      const cell = row[i] ?? '';
      max = Math.max(max, cell.length);
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

  const headerCells = options.columns.map((col, i) =>
    ' ' + padRight(ctx.style.styled(headerToken, col.header), colWidths[i]!) + ' ',
  );
  const headerRow = bc(v) + headerCells.join(bc(v)) + bc(v);

  const dataRows = options.rows.map((row) => {
    const cells = colWidths.map((w, i) => ' ' + padRight(row[i] ?? '', w) + ' ');
    return bc(v) + cells.join(bc(v)) + bc(v);
  });

  const lines = [top, headerRow, midSep, ...dataRows, bottom];
  return lines.join('\n');
}
