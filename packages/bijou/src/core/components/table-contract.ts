import type { BijouContext } from '../../ports/context.js';
import type { TokenValue } from '../theme/tokens.js';
import type { BijouNodeOptions } from './types.js';

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

export type TableTextCell = string | null | undefined;
export type TableTextRow = readonly TableTextCell[];

/** Configuration for rendering a table. */
export interface TableOptions extends BijouNodeOptions {
  /** Column definitions (headers and optional layout constraints). */
  columns?: readonly TableColumn[];
  /** Two-dimensional row cell data. */
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
export function measureInteractiveTableWidth(
  columnWidths: readonly number[],
): number {
  return (
    columnWidths.reduce((total, width) => total + width, 0)
    + interactiveTableBorderOverhead(columnWidths.length)
  );
}
