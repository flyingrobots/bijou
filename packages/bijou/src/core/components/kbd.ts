import type { BijouContext } from '../../ports/context.js';
import { getDefaultContext } from '../../context.js';

/** Configuration for rendering a keyboard shortcut indicator. */
export interface KbdOptions {
  /** Bijou context for I/O, styling, and mode detection. */
  ctx?: BijouContext;
}

/**
 * Resolve the provided context or fall back to the default context.
 *
 * @param ctx - Optional context override.
 * @returns The resolved {@link BijouContext}.
 */
function resolveCtx(ctx?: BijouContext): BijouContext {
  if (ctx) return ctx;
  return getDefaultContext();
}

/**
 * Render a keyboard shortcut indicator (key cap style).
 *
 * Output adapts to the current output mode:
 * - `interactive` / `static` — bold key text inside styled brackets.
 * - `pipe` — angle-bracket notation like `<Enter>`.
 * - `accessible` — plain key name.
 *
 * @param key - Key label to display (e.g. `"Enter"`, `"Ctrl+C"`).
 * @param options - Kbd configuration.
 * @returns The rendered keyboard shortcut string.
 */
export function kbd(key: string, options: KbdOptions = {}): string {
  const ctx = resolveCtx(options.ctx);
  const mode = ctx.mode;

  if (mode === 'pipe') return `<${key}>`;
  if (mode === 'accessible') return key;

  const borderToken = ctx.theme.theme.border.muted;
  const boldKey = ctx.style.bold(key);

  return ctx.style.styled(borderToken, '[') + ' ' + boldKey + ' ' + ctx.style.styled(borderToken, ']');
}
