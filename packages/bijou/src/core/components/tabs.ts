import type { BijouContext } from '../../ports/context.js';
import { resolveCtx } from '../resolve-ctx.js';

/** Represent a single tab in a tab bar. */
export interface TabItem {
  /** Display text for the tab. */
  label: string;
  /** Optional badge text appended to the label (e.g. a count). */
  badge?: string;
}

/** Configuration options for the {@link tabs} component. */
export interface TabsOptions {
  /** Zero-based index of the currently active tab. */
  active: number;
  /** Custom separator string between tabs. Defaults to `' | '` (pipe) or `' │ '` (rich). */
  separator?: string;
  /** Bijou context for rendering mode and theme resolution. */
  ctx?: BijouContext;
}

/**
 * Format a tab label, appending the badge in parentheses when present.
 *
 * @param item - The tab item to format.
 * @returns The label string, optionally with a badge suffix.
 */
function formatLabel(item: TabItem): string {
  return item.badge ? `${item.label} (${item.badge})` : item.label;
}

/**
 * Render a horizontal tab bar with an active-tab indicator.
 *
 * Adapts output by mode:
 * - `pipe`: labels separated by `|`, active tab wrapped in `[brackets]`.
 * - `accessible`: `Tab N of M: label (active)` format.
 * - `interactive`/`static`: `●` marker with bold primary styling for the active tab.
 *
 * @param items - Array of tab items to render.
 * @param options - Rendering options including active index, separator, and context.
 * @returns The formatted tab bar string.
 */
export function tabs(items: TabItem[], options: TabsOptions): string {
  const ctx = resolveCtx(options.ctx);
  const mode = ctx.mode;
  const active = options.active;

  if (mode === 'pipe') {
    const sep = options.separator ?? ' | ';
    return items
      .map((item, i) => {
        const label = formatLabel(item);
        return i === active ? `[${label}]` : label;
      })
      .join(sep);
  }

  if (mode === 'accessible') {
    const total = items.length;
    return items
      .map((item, i) => {
        const label = formatLabel(item);
        const tag = i === active ? ' (active)' : '';
        return `Tab ${i + 1} of ${total}: ${label}${tag}`;
      })
      .join(' | ');
  }

  // interactive + static
  const sep = options.separator ?? ' │ ';
  return items
    .map((item, i) => {
      const label = formatLabel(item);
      if (i === active) {
        const token = ctx.theme.theme.semantic.primary;
        const boldToken = { hex: token.hex, modifiers: [...(token.modifiers ?? []), 'bold' as const] };
        return `● ${ctx.style.styled(boldToken, label)}`;
      }
      return `  ${ctx.style.styled(ctx.theme.theme.semantic.muted, label)}`;
    })
    .join(sep);
}
