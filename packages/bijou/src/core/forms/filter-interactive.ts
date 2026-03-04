/**
 * Interactive filter select UI with real-time search and vim-style modes.
 *
 * Starts in **normal mode** where `j`/`k` navigate and any printable character
 * (except `j`/`k`) switches to insert mode and types the character. Press `/`
 * to enter insert mode without typing. In **insert mode**, all keys are
 * printable (including `j`/`k`), arrow keys navigate, and Escape returns to
 * normal mode. Ctrl+C cancels from either mode; Escape in normal mode cancels.
 */

import type { FieldOptions } from './types.js';
import type { BijouContext } from '../../ports/context.js';
import { formatFormTitle, terminalRenderer, createStyledFn, createBoldFn } from './form-utils.js';

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

/**
 * Render a keyboard-navigable filter select with vim-style normal/insert modes.
 *
 * Starts in normal mode: `j`/`k` navigate, `/` enters insert mode, any other
 * printable enters insert mode and types the character. In insert mode, all keys
 * are printable, arrow keys navigate, Escape returns to normal mode. Enter
 * confirms from either mode, Ctrl+C cancels from either mode, Escape in normal
 * mode cancels.
 *
 * @param options - Filter field configuration.
 * @param ctx - Bijou context.
 * @returns The value of the selected (or default/first) option.
 */
export async function interactiveFilter<T>(options: FilterOptions<T>, ctx: BijouContext): Promise<T> {
  if (options.options.length === 0) {
    throw new Error('[bijou] filter(): options array must contain at least one option');
  }
  const noColor = ctx.theme.noColor;
  const t = ctx.theme;
  const styledFn = createStyledFn(ctx);
  const boldFn = createBoldFn(ctx);
  const matchFn = options.match ?? defaultMatch;
  const maxVisible = options.maxVisible ?? 7;
  const term = terminalRenderer(ctx);

  let mode: 'normal' | 'insert' = 'normal';
  let query = '';
  let cursor = 0;
  let scrollOffset = 0;
  let filtered = [...options.options];

  function applyFilter(): void {
    if (query === '') {
      filtered = [...options.options];
    } else {
      filtered = options.options.filter((opt) => matchFn(query, opt));
    }
    cursor = Math.min(cursor, Math.max(0, filtered.length - 1));
    clampScroll();
  }

  function clampScroll(): void {
    if (cursor < scrollOffset) {
      scrollOffset = cursor;
    } else if (cursor >= scrollOffset + maxVisible) {
      scrollOffset = cursor - maxVisible + 1;
    }
    scrollOffset = Math.max(0, Math.min(scrollOffset, Math.max(0, filtered.length - maxVisible)));
  }

  function visibleItems(): FilterOption<T>[] {
    return filtered.slice(scrollOffset, scrollOffset + maxVisible);
  }

  function renderLineCount(): number {
    return 2 + Math.min(filtered.length, maxVisible) + 1; // header + filter input + items + status
  }

  function render(): void {
    const label = formatFormTitle(options.title, ctx);
    term.hideCursor();
    term.writeLine(label);

    // Filter input with mode indicator (: normal, / insert)
    const indicator = mode === 'insert' ? '/' : ':';
    const filterDisplay = query || (options.placeholder ? styledFn(t.theme.semantic.muted, options.placeholder) : '');
    ctx.io.write(`\x1b[K  ${styledFn(t.theme.semantic.info, indicator)} ${filterDisplay}\n`);

    // Visible items
    const vis = visibleItems();
    for (let i = 0; i < vis.length; i++) {
      const opt = vis[i]!;
      const isCurrent = scrollOffset + i === cursor;
      const prefix = isCurrent ? '❯' : ' ';
      if (isCurrent && !noColor) {
        ctx.io.write(`\x1b[K  ${styledFn(t.theme.semantic.info, prefix)} ${boldFn(opt.label)}\n`);
      } else {
        ctx.io.write(`\x1b[K  ${prefix} ${opt.label}\n`);
      }
    }

    // Status
    const status = `${filtered.length}/${options.options.length} items`;
    ctx.io.write(`\x1b[K  ${styledFn(t.theme.semantic.muted, status)}\n`);
  }

  function clearRender(lineCount: number): void {
    term.moveUp(lineCount);
  }

  function clearAndRerender(prevLineCount: number): void {
    clearRender(prevLineCount);
    term.clearBlock(prevLineCount);
    render();
  }

  function cleanup(): void {
    const total = renderLineCount();
    clearRender(total);
    term.clearBlock(total);

    const selected = filtered[cursor];
    const selectedLabel = selected ? selected.label : '(none)';
    const label = formatFormTitle(options.title, ctx) + ' ' + styledFn(t.theme.semantic.info, selectedLabel);
    ctx.io.write(`\x1b[K${label}\n`);
    term.showCursor();
  }

  render();

  // navigateUp/navigateDown use clearRender + render instead of clearAndRerender
  // because render() uses per-line \x1b[K (clear-to-end-of-line), making a full
  // clearBlock unnecessary for a simple cursor position change.
  function navigateUp(): void {
    if (filtered.length === 0) return;
    const prevLineCount = renderLineCount();
    cursor = (cursor - 1 + filtered.length) % filtered.length;
    clampScroll();
    clearRender(prevLineCount);
    render();
  }

  function navigateDown(): void {
    if (filtered.length === 0) return;
    const prevLineCount = renderLineCount();
    cursor = (cursor + 1) % filtered.length;
    clampScroll();
    clearRender(prevLineCount);
    render();
  }

  function typeChar(ch: string): void {
    const prevLineCount = renderLineCount();
    query += ch;
    applyFilter();
    clearAndRerender(prevLineCount);
  }

  // switchMode uses the same lightweight rerender pattern as navigate functions —
  // only the mode indicator line changes, and render() clears each line with \x1b[K.
  function switchMode(newMode: 'normal' | 'insert'): void {
    mode = newMode;
    const prevLineCount = renderLineCount();
    clearRender(prevLineCount);
    render();
  }

  return new Promise<T>((resolve) => {
    const handle = ctx.io.rawInput((key: string) => {
      // ── Mode-independent ───────────────────────────────────
      if (key === '\r' || key === '\n') {
        handle.dispose();
        cleanup();
        resolve(filtered[cursor]?.value ?? options.defaultValue ?? options.options[0]!.value);
        return;
      }

      if (key === '\x03') {
        // Ctrl+C — cancel from either mode
        handle.dispose();
        cleanup();
        resolve(options.defaultValue ?? options.options[0]!.value);
        return;
      }

      // ── Normal mode ────────────────────────────────────────
      if (mode === 'normal') {
        if (key === '\x1b') {
          // Escape in normal mode — cancel
          // Note: bare \x1b may false-trigger on slow connections where escape
          // sequences arrive as separate bytes. Timer-based disambiguation is a
          // separate future improvement.
          handle.dispose();
          cleanup();
          resolve(options.defaultValue ?? options.options[0]!.value);
          return;
        }

        if (key === 'j' || key === '\x1b[B') {
          navigateDown();
          return;
        }

        if (key === 'k' || key === '\x1b[A') {
          navigateUp();
          return;
        }

        if (key === '/') {
          // Enter insert mode without typing
          switchMode('insert');
          return;
        }

        // Any other printable — enter insert mode and type the char
        if (key.length === 1 && key >= ' ') {
          mode = 'insert';
          typeChar(key);
          return;
        }

        return;
      }

      // ── Insert mode ────────────────────────────────────────
      if (key === '\x1b') {
        // Escape in insert mode — return to normal
        switchMode('normal');
        return;
      }

      if (key === '\x1b[A') {
        navigateUp();
        return;
      }

      if (key === '\x1b[B') {
        navigateDown();
        return;
      }

      if (key === '\x7f' || key === '\b') {
        if (query.length > 0) {
          const prevLineCount = renderLineCount();
          query = query.slice(0, -1);
          applyFilter();
          clearAndRerender(prevLineCount);
        }
        return;
      }

      // Printable character (all printable keys including j/k)
      if (key.length === 1 && key >= ' ') {
        typeChar(key);
      }
    });
  });
}
