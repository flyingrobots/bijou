import type { BijouContext } from '../../ports/context.js';
import type { TokenValue, BaseStatusKey } from '../theme/tokens.js';
import { getDefaultContext } from '../../context.js';

/** Badge color variant — any status key, plus `'accent'` and `'primary'`. */
export type BadgeVariant = BaseStatusKey | 'accent' | 'primary';

/** Configuration for rendering a badge. */
export interface BadgeOptions {
  /** Color variant (defaults to `'info'`). */
  variant?: BadgeVariant;
  /** Bijou context for I/O, styling, and mode detection. */
  ctx?: BijouContext;
}

/**
 * Resolve the provided context or attempt to obtain the default context.
 *
 * Unlike other components, returns `undefined` when no default context is
 * available (e.g. before bijou-node initialisation).
 *
 * @param ctx - Optional context override.
 * @returns The resolved {@link BijouContext}, or `undefined` if unavailable.
 */
function resolveCtx(ctx?: BijouContext): BijouContext | undefined {
  if (ctx) return ctx;
  try {
    return getDefaultContext();
  } catch {
    return undefined;
  }
}

/**
 * Render an inline badge (pill-shaped label) for the given text.
 *
 * Output adapts to the current output mode:
 * - `interactive` / `static` — inverse-colored pill using the variant token.
 * - `pipe` — bracketed text like `[OK]`.
 * - `accessible` — plain text.
 *
 * Falls back to a plain space-padded string when no context or theme is available.
 *
 * @param text - Label to display inside the badge.
 * @param options - Badge configuration.
 * @returns The rendered badge string.
 */
export function badge(text: string, options: BadgeOptions = {}): string {
  const ctx = resolveCtx(options.ctx);
  if (!ctx) return ` ${text} `;

  const mode = ctx.mode;
  if (mode === 'pipe') return `[${text}]`;
  if (mode === 'accessible') return text;

  const t = ctx.theme?.theme;
  if (!t) return ` ${text} `;

  const variant = options.variant ?? 'info';
  const status = (t.status || {}) as any;
  const semantic = (t.semantic || {}) as any;
  
  let baseToken = status[variant] || semantic[variant] || status.info;

  if (!baseToken || typeof baseToken.hex !== 'string') {
    baseToken = { hex: '#808080' };
  }

  const inverseToken: TokenValue = {
    hex: baseToken.hex,
    modifiers: [...(baseToken.modifiers ?? []), 'inverse'],
  };

  return ctx.style.styled(inverseToken, ` ${text} `);
}
