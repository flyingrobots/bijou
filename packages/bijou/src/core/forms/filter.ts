import type { BijouContext } from '../../ports/context.js';
import { resolveCtx } from '../resolve-ctx.js';
import { formatFormTitle, renderNumberedOptions, formDispatch } from './form-utils.js';
import { defaultMatch, interactiveFilter } from './filter-interactive.js';
export type { FilterOption, FilterOptions } from './filter-interactive.js';
import type { FilterOptions } from './filter-interactive.js';

/**
 * Prompt the user to choose one item from a filterable list.
 *
 * In interactive TTY mode, renders a search input that narrows the
 * option list in real time. Falls back to a numbered list with
 * text-based matching for pipe and accessible modes.
 *
 * @typeParam T - Type of each option's value.
 * @param options - Filter field configuration.
 * @returns The value of the selected option.
 * @throws {Error} If no options are provided and no defaultValue is set.
 */
export async function filter<T>(options: FilterOptions<T>): Promise<T> {
  if (options.options.length === 0) {
    if (options.defaultValue !== undefined) return options.defaultValue;
    throw new Error('filter() requires at least one option, or a defaultValue');
  }

  const ctx = resolveCtx(options.ctx);

  return formDispatch(
    ctx,
    (c) => interactiveFilter(options, c),
    (c) => fallbackFilter(options, c),
  );
}

/**
 * Display options as a numbered list and accept numeric or text input.
 *
 * Tries numeric selection first, then falls back to text matching.
 * Used as the fallback for non-interactive or accessible modes.
 *
 * @param options - Filter field configuration.
 * @param ctx - Bijou context.
 * @returns The value of the matched or selected option.
 */
async function fallbackFilter<T>(options: FilterOptions<T>, ctx: BijouContext): Promise<T> {
  ctx.io.write(formatFormTitle(options.title, ctx) + '\n');
  renderNumberedOptions(options.options, ctx);

  const prompt = ctx.mode === 'accessible' ? 'Enter number or search: ' : '> ';
  const answer = await ctx.io.question(prompt);
  const trimmed = answer.trim();

  // Try numeric selection first
  const idx = parseInt(trimmed, 10) - 1;
  if (idx >= 0 && idx < options.options.length) {
    return options.options[idx]!.value;
  }

  // Try matching by text
  if (trimmed) {
    const matchFn = options.match ?? defaultMatch;
    const matched = options.options.find((opt) => matchFn(trimmed, opt));
    if (matched) return matched.value;
  }

  return options.defaultValue ?? options.options[0]!.value;
}
