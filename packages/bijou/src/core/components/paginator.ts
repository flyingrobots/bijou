import type { BijouContext } from '../../ports/context.js';
import { getDefaultContext } from '../../context.js';

/** Configuration options for the {@link paginator} component. */
export interface PaginatorOptions {
  /** Zero-based index of the current page. */
  current: number;
  /** Total number of pages. */
  total: number;
  /** Display style: `'dots'` for dot indicators, `'text'` for "Page X of Y". Defaults to `'dots'`. */
  style?: 'dots' | 'text';
  /** Bijou context for rendering mode and theme resolution. */
  ctx?: BijouContext;
}

/**
 * Resolve the provided context or fall back to the global default.
 *
 * @param ctx - Optional context override.
 * @returns The resolved {@link BijouContext}.
 */
function resolveCtx(ctx?: BijouContext): BijouContext {
  if (ctx) return ctx;
  return getDefaultContext();
}

/**
 * Render a page indicator showing the current position within a set of pages.
 *
 * Adapts output by mode:
 * - `pipe`: `[page/total]` format.
 * - `accessible`: `Page N of M` format.
 * - `interactive`/`static`: dot indicators (`●`/`○`) or text depending on style option.
 *
 * @param options - Paginator configuration including current page, total, and display style.
 * @returns The formatted paginator string.
 */
export function paginator(options: PaginatorOptions): string {
  const ctx = resolveCtx(options.ctx);
  const mode = ctx.mode;
  const page = options.current + 1; // convert 0-indexed to 1-indexed for display
  const total = options.total;

  if (mode === 'pipe') return `[${page}/${total}]`;
  if (mode === 'accessible') return `Page ${page} of ${total}`;

  // interactive + static
  const style = options.style ?? 'dots';

  if (style === 'text') return `Page ${page} of ${total}`;

  // dots style
  const dots: string[] = [];
  for (let i = 0; i < total; i++) {
    if (i === options.current) {
      dots.push(ctx.style.styled(ctx.theme.theme.semantic.primary, '●'));
    } else {
      dots.push(ctx.style.styled(ctx.theme.theme.semantic.muted, '○'));
    }
  }
  return dots.join(' ');
}
