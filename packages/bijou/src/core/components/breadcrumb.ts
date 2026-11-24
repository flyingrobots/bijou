import type { BijouContext } from '../../ports/context.js';
import type { TokenValue } from '../theme/tokens.js';
import { resolveCtx } from '../resolve-ctx.js';
import { renderByMode } from '../mode-render.js';
import { makeBgFill } from '../bg-fill.js';
import { mirrorsLayout, orderForDirection, type InlineDirection } from '../direction/direction.js';
import { mirrorGlyphs } from '../direction/directional-glyph.js';

/** Configuration options for the {@link breadcrumb} component. */
export interface BreadcrumbOptions {
  /** Custom separator between breadcrumb segments. Defaults to `' > '` (pipe) or `' › '` (rich). */
  separator?: string | undefined;
  /** Background fill token for the current (last) breadcrumb segment. No default — opt-in only. */
  currentBgToken?: TokenValue;
  /** Bijou context for rendering mode and theme resolution. */
  ctx?: BijouContext;
  /**
   * Logical layout direction. Overrides `ctx.direction`; absent both, `'ltr'`.
   * Under `'rtl'` in `interactive` and `static` output the trail reads right to left.
   */
  direction?: InlineDirection | undefined;
}

/**
 * Render a breadcrumb navigation trail.
 *
 * Adapts output by mode:
 * - `pipe`: plain segments joined by `' > '`.
 * - `accessible`: `Breadcrumb: path (current)` format for screen readers.
 * - `interactive`/`static`: muted ancestors with the last segment bold and primary-colored.
 *   Under `rtl` the segments run right to left, the current segment comes first
 *   (rightmost), and the separator's directional glyph is mirrored (`›` becomes `‹`).
 *   Labels are never reversed or altered. `pipe` and `accessible` keep logical order.
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
      const visual = mirrorsLayout({ ...options, ctx }) ? 'rtl' : 'ltr';
      const sep = mirrorGlyphs(options.separator ?? ' › ', visual);
      const last = items.length - 1;
      const bgFill = makeBgFill(options.currentBgToken, ctx);
      const segments = items
        .map((item, i) => {
          if (i === last) {
            const token = ctx.semantic('primary');
            const boldToken = { hex: token.hex, modifiers: [...(token.modifiers ?? []), 'bold' as const] };
            const text = ctx.style.styled(boldToken, item);
            return bgFill ? bgFill(` ${text} `) : text;
          }
          return ctx.style.styled(ctx.semantic('muted'), item);
        });
      return orderForDirection(segments, visual).join(sep);
    },
  }, options);
}
