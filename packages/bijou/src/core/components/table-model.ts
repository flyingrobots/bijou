import type {
  TableCellAlign,
  TableColumn,
} from './table-contract.js';

export interface NormalizedTable {
  readonly columns: readonly TableColumn[];
  readonly rows: readonly string[][];
  readonly showHeader: boolean;
}

export interface FittedColumn {
  readonly header: string;
  readonly width: number;
  readonly align: TableCellAlign;
}

export interface FittedRow {
  readonly cells: readonly (readonly string[])[];
  readonly height: number;
}

export interface FittedTable {
  readonly columns: readonly FittedColumn[];
  readonly widths: readonly number[];
  readonly headerLines: readonly (readonly string[])[];
  readonly headerHeight: number;
  readonly rows: readonly FittedRow[];
  readonly columnGap: number;
  readonly showHeader: boolean;
}

export type TableWrapToken =
  | { readonly kind: 'ansi'; readonly raw: string }
  | { readonly kind: 'grapheme'; readonly raw: string; readonly width: number };
