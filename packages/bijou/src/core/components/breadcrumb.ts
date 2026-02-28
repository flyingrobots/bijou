import type { BijouContext } from '../../ports/context.js';
import { getDefaultContext } from '../../context.js';

/** Configuration options for the {@link breadcrumb} component. */
export interface BreadcrumbOptions {
  /** Custom separator between breadcrumb segments. Defaults to `' > '` (pipe) or `' › '` (rich). */
  separator?: string;
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
 * Render a breadcrumb navigation trail.
 *
 * Adapts output by mode:
 * - `pipe`: plain segments joined by `' > '`.
 * - `accessible`: `Breadcrumb: path (current)` format for screen readers.
 * - `interactive`/`static`: muted ancestors with the last segment bold and primary-colored.
 *
 * @param items - Ordered breadcrumb segments (first = root, last = current).
 * @param options - Rendering options including separator and context.
 * @returns The formatted breadcrumb string.
 */
export function breadcrumb(items: string[], options: BreadcrumbOptions = {}): string {
  const ctx = resolveCtx(options.ctx);
  const mode = ctx.mode;

  if (mode === 'pipe') {
    const sep = options.separator ?? ' > ';
    return items.join(sep);
  }

  if (mode === 'accessible') {
    const path = items.join(' > ');
    return `Breadcrumb: ${path} (current)`;
  }

  // interactive + static
  const sep = options.separator ?? ' › ';
  const last = items.length - 1;
  return items
    .map((item, i) => {
      if (i === last) {
        const token = ctx.theme.theme.semantic.primary;
        const boldToken = { hex: token.hex, modifiers: [...(token.modifiers ?? []), 'bold' as const] };
        return ctx.style.styled(boldToken, item);
      }
      return ctx.style.styled(ctx.theme.theme.semantic.muted, item);
    })
    .join(sep);
}
