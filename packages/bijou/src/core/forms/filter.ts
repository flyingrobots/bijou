import type { FieldOptions } from './types.js';
import type { BijouContext } from '../../ports/context.js';
import type { TokenValue } from '../theme/tokens.js';
import type { OutputMode } from '../detect/tty.js';
import { getDefaultContext } from '../../context.js';

export interface FilterOption<T> {
  label: string;
  value: T;
  keywords?: string[];
}

export interface FilterOptions<T> extends FieldOptions<T> {
  options: FilterOption<T>[];
  placeholder?: string;
  maxVisible?: number;
  match?: (query: string, option: FilterOption<T>) => boolean;
  ctx?: BijouContext;
}

function defaultMatch<T>(query: string, option: FilterOption<T>): boolean {
  const q = query.toLowerCase();
  if (option.label.toLowerCase().includes(q)) return true;
  if (option.keywords) {
    return option.keywords.some((kw) => kw.toLowerCase().includes(q));
  }
  return false;
}

export async function filter<T>(options: FilterOptions<T>): Promise<T> {
  if (options.options.length === 0) {
    if (options.defaultValue !== undefined) return options.defaultValue;
    throw new Error('filter() requires at least one option, or a defaultValue');
  }

  const ctx = options.ctx ?? getDefaultContext();
  const mode = ctx.mode;

  if (mode === 'interactive' && ctx.runtime.stdinIsTTY) {
    return interactiveFilter(options, ctx);
  }

  return fallbackFilter(options, mode, ctx);
}

async function fallbackFilter<T>(options: FilterOptions<T>, mode: OutputMode, ctx: BijouContext): Promise<T> {
  const noColor = ctx.theme.noColor;
  const styledFn = (token: TokenValue, text: string) => ctx.style.styled(token, text);

  if (noColor || mode === 'accessible') {
    ctx.io.write(`${options.title}\n`);
  } else {
    ctx.io.write(styledFn(ctx.theme.theme.semantic.info, '? ') + ctx.style.bold(options.title) + '\n');
  }

  for (let i = 0; i < options.options.length; i++) {
    const opt = options.options[i]!;
    ctx.io.write(`  ${i + 1}. ${opt.label}\n`);
  }

  const prompt = mode === 'accessible' ? 'Enter number or search: ' : '> ';
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

async function interactiveFilter<T>(options: FilterOptions<T>, ctx: BijouContext): Promise<T> {
  const noColor = ctx.theme.noColor;
  const t = ctx.theme;
  const styledFn = (token: TokenValue, text: string) => ctx.style.styled(token, text);
  const matchFn = options.match ?? defaultMatch;
  const maxVisible = options.maxVisible ?? 7;

  let query = '';
  let cursor = 0;
  let filtered = [...options.options];

  function applyFilter(): void {
    if (query === '') {
      filtered = [...options.options];
    } else {
      filtered = options.options.filter((opt) => matchFn(query, opt));
    }
    cursor = Math.min(cursor, Math.max(0, filtered.length - 1));
  }

  function visibleItems(): FilterOption<T>[] {
    return filtered.slice(0, maxVisible);
  }

  function renderLineCount(): number {
    return 2 + Math.min(filtered.length, maxVisible) + 1; // header + filter input + items + status
  }

  function render(): void {
    const label = noColor
      ? `? ${options.title}`
      : styledFn(t.theme.semantic.info, '? ') + ctx.style.bold(options.title);
    ctx.io.write(`\x1b[?25l`);
    ctx.io.write(`\r\x1b[K${label}\n`);

    // Filter input
    const filterDisplay = query || (options.placeholder ? styledFn(t.theme.semantic.muted, options.placeholder) : '');
    ctx.io.write(`\x1b[K  ${styledFn(t.theme.semantic.info, '/')} ${filterDisplay}\n`);

    // Visible items
    const vis = visibleItems();
    for (let i = 0; i < vis.length; i++) {
      const opt = vis[i]!;
      const isCurrent = i === cursor;
      const prefix = isCurrent ? '❯' : ' ';
      if (isCurrent && !noColor) {
        ctx.io.write(`\x1b[K  ${styledFn(t.theme.semantic.info, prefix)} ${ctx.style.bold(opt.label)}\n`);
      } else {
        ctx.io.write(`\x1b[K  ${prefix} ${opt.label}\n`);
      }
    }

    // Status
    const status = `${filtered.length}/${options.options.length} items`;
    ctx.io.write(`\x1b[K  ${styledFn(t.theme.semantic.muted, status)}\n`);
  }

  function clearRender(): void {
    const total = renderLineCount();
    ctx.io.write(`\x1b[${total}A`);
  }

  function cleanup(): void {
    const total = renderLineCount();
    // Move up and clear all rendered lines
    clearRender();
    for (let i = 0; i < total; i++) ctx.io.write(`\x1b[K\n`);
    ctx.io.write(`\x1b[${total}A`);

    const selected = filtered[cursor];
    const selectedLabel = selected ? selected.label : '(none)';
    const label = noColor
      ? `? ${options.title} ${selectedLabel}`
      : styledFn(t.theme.semantic.info, '? ') + ctx.style.bold(options.title) + ' ' + styledFn(t.theme.semantic.info, selectedLabel);
    ctx.io.write(`\x1b[K${label}\n`);
    ctx.io.write(`\x1b[?25h`);
  }

  render();

  return new Promise<T>((resolve) => {
    const handle = ctx.io.rawInput((key: string) => {
      if (key === '\r' || key === '\n') {
        // Enter — select
        handle.dispose();
        cleanup();
        resolve(filtered[cursor]?.value ?? options.defaultValue ?? options.options[0]!.value);
        return;
      }

      if (key === '\x03' || key === '\x1b') {
        // Ctrl+C or Escape — cancel
        handle.dispose();
        cleanup();
        resolve(options.defaultValue ?? options.options[0]!.value);
        return;
      }

      if (key === '\x1b[A' || key === 'k') {
        // Up
        if (filtered.length === 0) return;
        cursor = (cursor - 1 + filtered.length) % filtered.length;
        clearRender();
        render();
        return;
      }

      if (key === '\x1b[B' || key === 'j') {
        // Down — but only when query is empty (j is a printable char for filtering)
        if (key === 'j' && query === '') {
          // Start filtering with 'j'
          query += key;
          applyFilter();
          clearRender();
          render();
          return;
        }
        if (key === '\x1b[B') {
          if (filtered.length === 0) return;
          cursor = (cursor + 1) % filtered.length;
          clearRender();
          render();
          return;
        }
        // j when query is non-empty — fall through to printable handler
      }

      if (key === '\x7f' || key === '\b') {
        // Backspace
        if (query.length > 0) {
          const prevLineCount = renderLineCount();
          query = query.slice(0, -1);
          applyFilter();
          // Clear the old render (use the larger count to avoid leftover lines)
          ctx.io.write(`\x1b[${prevLineCount}A`);
          for (let i = 0; i < prevLineCount; i++) ctx.io.write(`\x1b[K\n`);
          ctx.io.write(`\x1b[${prevLineCount}A`);
          render();
        }
        return;
      }

      // Printable character (filter input)
      if (key.length === 1 && key >= ' ') {
        const prevLineCount = renderLineCount();
        query += key;
        applyFilter();
        // Clear the old render
        ctx.io.write(`\x1b[${prevLineCount}A`);
        for (let i = 0; i < prevLineCount; i++) ctx.io.write(`\x1b[K\n`);
        ctx.io.write(`\x1b[${prevLineCount}A`);
        render();
      }
    });
  });
}
