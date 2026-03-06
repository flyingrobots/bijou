import type { BijouContext } from '../../ports/context.js';
import { resolveCtx } from '../resolve-ctx.js';
import { renderByMode } from '../mode-render.js';

/** Configuration options for the {@link breadcrumb} component. */
export interface BreadcrumbOptions {
  /** Custom separator between breadcrumb segments. Defaults to `' > '` (pipe) or `' › '` (rich). */
  separator?: string;
  /** Bijou context for rendering mode and theme resolution. */
  ctx?: BijouContext;
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

  return renderByMode(ctx.mode, {
    pipe: () => {
      const sep = options.separator ?? ' > ';
      return items.join(sep);
    },
    accessible: () => {
      const path = items.join(' > ');
      return `Breadcrumb: ${path} (current)`;
    },
    interactive: () => {
      const sep = options.separator ?? ' › ';
      const last = items.length - 1;
      return items
        .map((item, i) => {
          if (i === last) {
            const token = ctx.semantic('primary');
            const boldToken = { hex: token.hex, modifiers: [...(token.modifiers ?? []), 'bold' as const] };
            return ctx.style.styled(boldToken, item);
          }
          return ctx.style.styled(ctx.semantic('muted'), item);
        })
        .join(sep);
    },
  }, options);
}
