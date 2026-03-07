import type { BijouContext } from '../../ports/context.js';
import type { TokenValue } from '../theme/tokens.js';
import { resolveCtx } from '../resolve-ctx.js';
import { renderByMode } from '../mode-render.js';
import { makeBgFill } from '../bg-fill.js';

/** Configuration for rendering a keyboard shortcut indicator. */
export interface KbdOptions {
  /** Background fill token for the key cap. Defaults to `surface.muted`. */
  bgToken?: TokenValue;
  /** Bijou context for I/O, styling, and mode detection. */
  ctx?: BijouContext;
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

  return renderByMode(ctx.mode, {
    pipe: () => `<${key}>`,
    accessible: () => key,
    interactive: () => {
      const borderToken = ctx.border('muted');
      const boldKey = ctx.style.bold(key);
      const bgFill = makeBgFill(options.bgToken ?? ctx.surface('muted'), ctx);

      const inner = ctx.style.styled(borderToken, '[') + ' ' + boldKey + ' ' + ctx.style.styled(borderToken, ']');
      return bgFill ? bgFill(inner) : inner;
    },
  }, options);
}
