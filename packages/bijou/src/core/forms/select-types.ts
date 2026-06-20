import type { BijouContext } from '../../ports/context.js';
import type { SelectFieldOptions } from './types.js';

/**
 * Options for the single-select field.
 *
 * @typeParam T - Type of each option's value.
 */
export interface SelectOptions<T = string> extends SelectFieldOptions<T> {
  /** Bijou context for IO, styling, and mode detection. */
  ctx?: BijouContext;
}
