import {
  graphemeClusterWidth,
  segmentGraphemes,
  stripAnsi,
} from '../text/grapheme.js';
import {
  sanitizeOptionalNonNegativeInt,
} from '../numeric.js';
import type {
  TableCellAlign,
  TableColumn,
} from './table-contract.js';

const TABLE_EMOJI_PRESENTATION_RE = /\p{Emoji_Presentation}/u;

export function tableGraphemeWidth(grapheme: string): number {
  if (TABLE_EMOJI_PRESENTATION_RE.test(grapheme)) return 2;
  return graphemeClusterWidth(grapheme);
}

export function visibleLength(str: string): number {
  let width = 0;
  for (const grapheme of segmentGraphemes(stripAnsi(str))) {
    width += tableGraphemeWidth(grapheme);
  }
  return width;
}

export function padRight(str: string, width: number): string {
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

export function alignCell(
  str: string,
  width: number,
  align: TableCellAlign,
): string {
  if (align === 'right') return padLeft(str, width);
  if (align === 'center') return padCenter(str, width);
  return padRight(str, width);
}

export function normalizeColumnWidth(
  width: number | undefined,
): number | undefined {
  return sanitizeOptionalNonNegativeInt(width);
}

export function normalizePositiveWeight(weight: number | undefined): number {
  if (weight == null || !Number.isFinite(weight)) return 1;
  return Math.max(0, Math.floor(weight));
}

export function maxVisibleLineWidth(value: string): number {
  const lines = value.split('\n');
  return lines.reduce((max, line) => Math.max(max, visibleLength(line)), 0);
}

export function columnPreferredWidth(
  column: TableColumn,
  rows: readonly string[][],
  columnIndex: number,
): number {
  const fixedWidth = normalizeColumnWidth(column.width);
  if (fixedWidth !== undefined) return fixedWidth;
  let preferred = Math.max(1, maxVisibleLineWidth(column.header));
  for (const row of rows) {
    preferred = Math.max(preferred, maxVisibleLineWidth(row[columnIndex] ?? ''));
  }
  const maxWidth = sanitizeOptionalNonNegativeInt(column.maxWidth);
  if (maxWidth !== undefined) preferred = Math.min(preferred, maxWidth);
  const minWidth = sanitizeOptionalNonNegativeInt(column.minWidth);
  if (minWidth !== undefined) {
    preferred = Math.max(preferred, Math.min(minWidth, maxWidth ?? minWidth));
  }
  return preferred;
}

export function columnMinWidth(
  column: TableColumn,
  preferredWidth: number,
): number {
  const fixedWidth = normalizeColumnWidth(column.width);
  if (fixedWidth !== undefined) return fixedWidth;
  const maxWidth = sanitizeOptionalNonNegativeInt(column.maxWidth);
  const rawMin = sanitizeOptionalNonNegativeInt(column.minWidth)
    ?? Math.min(1, preferredWidth);
  const constrainedMin = Math.min(rawMin, maxWidth ?? rawMin);
  return Math.min(preferredWidth, constrainedMin);
}
