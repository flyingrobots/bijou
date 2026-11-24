import type { BijouContext } from '../../ports/context.js';
import { resolveCtx } from '../resolve-ctx.js';
import { renderByMode } from '../mode-render.js';
import { mirrorsLayout, orderForDirection, type InlineDirection } from '../direction/direction.js';
import { sanitizeNonNegativeInt, sanitizePositiveInt } from '../numeric.js';

/** Configuration options for the {@link paginator} component. */
export interface PaginatorOptions {
  /** Zero-based index of the current page. */
  current: number;
  /** Total number of pages. */
  total: number;
  /** Display style: `'dots'` for dot indicators, `'text'` for "Page X of Y". Defaults to `'dots'`. */
  style?: 'dots' | 'text' | undefined;
  /** Bijou context for rendering mode and theme resolution. */
  ctx?: BijouContext;
  /**
   * Logical layout direction. Overrides `ctx.direction`; absent both, `'ltr'`.
   * Under `'rtl'` in `interactive` and `static` output the dots run right to left.
   */
  direction?: InlineDirection | undefined;
}

/**
 * Render a page indicator showing the current position within a set of pages.
 *
 * Adapts output by mode:
 * - `pipe`: `[page/total]` format.
 * - `accessible`: `Page N of M` format.
 * - `interactive`/`static`: dot indicators (`●`/`○`) or text depending on style option.
 *   Under `rtl` the dots run right to left: page one is rightmost and the next
 *   page sits to the left of the current one. The `text` style (`Page X of Y`)
 *   keeps its digits and order. The dots are symmetric, so no glyph mapping
 *   applies. `pipe` and `accessible` keep logical order.
 *
 * @param options - Paginator configuration including current page, total, and display style.
 * @returns The formatted paginator string.
 */
export function paginator(options: PaginatorOptions): string {
  const ctx = resolveCtx(options.ctx);
  const total = sanitizePositiveInt(options.total, 1);
  const current = Math.min(sanitizeNonNegativeInt(options.current, 0), total - 1);
  const page = current + 1; // convert 0-indexed to 1-indexed for display
  const pageLabel = String(page);
  const totalLabel = String(total);

  return renderByMode(ctx.mode, {
    pipe: () => `[${pageLabel}/${totalLabel}]`,
    accessible: () => `Page ${pageLabel} of ${totalLabel}`,
    interactive: () => {
      // interactive + static
      const style = options.style ?? 'dots';

      if (style === 'text') return `Page ${pageLabel} of ${totalLabel}`;

      // dots style
      const dots: string[] = [];
      for (let i = 0; i < total; i++) {
        if (i === current) {
          dots.push(ctx.style.styled(ctx.semantic('primary'), '●'));
        } else {
          dots.push(ctx.style.styled(ctx.semantic('muted'), '○'));
        }
      }
      const visual = mirrorsLayout({ ...options, ctx }) ? 'rtl' : 'ltr';
      return orderForDirection(dots, visual).join(' ');
    },
  }, options);
}
