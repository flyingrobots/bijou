import type { BijouContext } from '../../ports/context.js';
import type { FilterOptions, FilterState } from './filter-options.js';
import { sanitizePositiveInt } from '../numeric.js';
import { defaultMatch } from './filter-match.js';
import { createFilterView } from './filter-view.js';

export function createFilterController<T>(options: FilterOptions<T>, ctx: BijouContext) {
  const matchFn = options.match ?? defaultMatch;
  const maxVisible = sanitizePositiveInt(options.maxVisible, 7);
  const state: FilterState<T> = { mode: 'normal', query: '', cursor: 0, scrollOffset: 0, filtered: [...options.options] };
  const view = createFilterView(options, ctx, state, maxVisible);
  const { renderLineCount, render, clearRender, clearAndRerender } = view;

  /** Re-run the match function against all options and clamp the cursor. */
  function applyFilter(): void {
    if (state.query === '') {
      state.filtered = [...options.options];
    } else {
      state.filtered = options.options.filter((opt) => matchFn(state.query, opt));
    }
    state.cursor = Math.min(state.cursor, Math.max(0, state.filtered.length - 1));
    clampScroll();
  }

  /** Keep the scroll offset so the cursor stays within the visible window. */
  function clampScroll(): void {
    if (state.cursor < state.scrollOffset) {
      state.scrollOffset = state.cursor;
    } else if (state.cursor >= state.scrollOffset + maxVisible) {
      state.scrollOffset = state.cursor - maxVisible + 1;
    }
    state.scrollOffset = Math.max(0, Math.min(state.scrollOffset, Math.max(0, state.filtered.length - maxVisible)));
  }

  // navigateUp/navigateDown use clearRender + render instead of clearAndRerender
  // because render() uses per-line CLEAR_LINE (clear-to-end-of-line), making a full
  // clearBlock unnecessary for a simple cursor position change.
  /** Move the cursor up one item, wrapping around at the top. */
  function navigateUp(): void {
    if (state.filtered.length === 0) return;
    const prevLineCount = renderLineCount();
    state.cursor = (state.cursor - 1 + state.filtered.length) % state.filtered.length;
    clampScroll();
    clearRender(prevLineCount);
    render();
  }

  /** Move the cursor down one item, wrapping around at the bottom. */
  function navigateDown(): void {
    if (state.filtered.length === 0) return;
    const prevLineCount = renderLineCount();
    state.cursor = (state.cursor + 1) % state.filtered.length;
    clampScroll();
    clearRender(prevLineCount);
    render();
  }

  /** Append a character to the query, re-filter, and re-render. */
  function typeChar(ch: string): void {
    const prevLineCount = renderLineCount();
    state.query += ch;
    applyFilter();
    clearAndRerender(prevLineCount);
  }

  // switchMode uses the same lightweight rerender pattern as navigate functions —
  // only the mode indicator line changes, and render() clears each line with CLEAR_LINE.
  /** Toggle between normal and insert input modes and re-render. */
  function switchMode(newMode: 'normal' | 'insert'): void {
    state.mode = newMode;
    const prevLineCount = renderLineCount();
    clearRender(prevLineCount);
    render();
  }

  return { ...view, state, applyFilter, navigateUp, navigateDown, typeChar, switchMode };
}
