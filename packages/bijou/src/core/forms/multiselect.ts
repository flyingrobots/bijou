import type { SelectFieldOptions, SelectOption } from './types.js';
import type { BijouContext } from '../../ports/context.js';
import { resolveCtx } from '../resolve-ctx.js';
import {
  formatFormTitle,
  renderNumberedOptions,
  formDispatch,
} from './form-utils.js';
import { interactiveMultiselect } from './multiselect-interactive.js';

/**
 * Options for the multi-select field.
 *
 * @typeParam T - Type of each option's value.
 */
export interface MultiselectOptions<T = string> extends SelectFieldOptions<T> {
  /** Bijou context for IO, styling, and mode detection. */
  ctx?: BijouContext;
  /** Values to pre-select when the multiselect first renders in interactive mode. */
  defaultValues?: T[];
}

/**
 * Prompt the user to choose zero or more items from a list.
 *
 * Uses arrow-key navigation with space-to-toggle in interactive TTY mode,
 * or a comma-separated numeric input fallback for pipe and accessible modes.
 *
 * @typeParam T - Type of each option's value.
 * @param options - Multiselect field configuration.
 * @returns Array of selected option values.
 */
export async function multiselect<T = string>(options: MultiselectOptions<T>): Promise<T[]> {
  if (options.options.length === 0) return [];

  const ctx = resolveCtx(options.ctx);

  return formDispatch(
    ctx,
    (c) => interactiveMultiselect(options, c),
    (c) => numberedMultiselect(options, c),
  );
}

function optionAt<T>(options: readonly SelectOption<T>[], index: number): SelectOption<T> {
  const option = options[index];
  if (option === undefined) throw new Error('multiselect option index out of range');
  return option;
}

async function numberedMultiselect<T>(options: MultiselectOptions<T>, ctx: BijouContext): Promise<T[]> {
  ctx.io.write(formatFormTitle(options.title, ctx) + '\n');
  renderNumberedOptions(options.options, ctx);

  const prompt = ctx.mode === 'accessible'
    ? 'Enter numbers separated by commas: '
    : 'Enter numbers (comma-separated): ';

  const answer = await ctx.io.question(prompt);
  const indices = answer.split(',')
    .map((s) => parseInt(s.trim(), 10) - 1)
    .filter((i) => i >= 0 && i < options.options.length);
  return indices.map((i) => optionAt(options.options, i).value);
}
