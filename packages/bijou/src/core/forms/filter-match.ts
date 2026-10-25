import type { FilterOption } from './filter-options.js';

/**
 * Default case-insensitive substring matcher for filter options.
 *
 * Check the option label first, then fall back to keyword matches.
 *
 * @param query - User's search input.
 * @param option - Option to test against.
 * @returns `true` if the query matches the label or any keyword.
 */
export function defaultMatch<T>(query: string, option: FilterOption<T>): boolean {
  const q = query.toLowerCase();
  if (option.label.toLowerCase().includes(q)) return true;
  if (option.keywords) {
    return option.keywords.some((kw) => kw.toLowerCase().includes(q));
  }
  return false;
}
