import type { FieldOptions } from './types.js';
import type { BijouContext } from '../../ports/context.js';

/**
 * Single option in a filterable select list.
 *
 * @typeParam T - Type of the option's value.
 */
export interface FilterOption<T> {
  /** Display label shown in the option list. */
  label: string;
  /** Value returned when this option is selected. */
  value: T;
  /** Additional search keywords that match this option during filtering. */
  keywords?: string[];
}

/**
 * Options for the filterable select field.
 *
 * @typeParam T - Type of each option's value.
 */
export interface FilterOptions<T> extends FieldOptions<T> {
  /** List of filterable options. */
  options: FilterOption<T>[];
  /** Placeholder text shown in the filter input when empty. */
  placeholder?: string;
  /** Maximum number of options visible at once. Default: 7. */
  maxVisible?: number;
  /** Custom match function for filtering. Defaults to case-insensitive label/keyword substring match. */
  match?: (query: string, option: FilterOption<T>) => boolean;
  /** Bijou context for IO, styling, and mode detection. */
  ctx?: BijouContext;
}

export interface FilterState<T> {
  mode: 'normal' | 'insert';
  query: string;
  cursor: number;
  scrollOffset: number;
  filtered: FilterOption<T>[];
}
