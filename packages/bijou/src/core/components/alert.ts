import type { Theme, TokenValue } from '../theme/tokens.js';
import { resolveCtx } from '../resolve-ctx.js';
import { box } from './box.js';
import { renderByMode } from '../mode-render.js';
import type { BijouNodeOptions } from './types.js';

/** Alert severity level. */
export type AlertVariant = 'success' | 'error' | 'warning' | 'info';

/** Configuration for rendering an alert box. */
export interface AlertOptions extends BijouNodeOptions {
  /** Severity variant (defaults to `'info'`). */
  variant?: AlertVariant;
  /** Theme token applied to alert borders. Defaults to a variant-specific border token. */
  borderToken?: TokenValue;
  /** Background fill token for the alert box interior. Defaults to `surface.elevated`. */
  bgToken?: TokenValue;
}

/**
 * Alert icon characters.
 *
 * All icons are unambiguously single-column-width across terminals and
 * chat UIs. U+2713 (✓) and U+2717 (✗) fall in the Dingbats range
 * which isWideChar() classifies as 2-wide, causing box misalignment.
 * U+26A0 (⚠) and U+2139 (ℹ) are ambiguous-width and render as 2
 * columns in many non-terminal monospace contexts. ASCII alternatives
 * avoid all of these issues.
 */
const ICONS: Record<AlertVariant, string> = {
  success: '*',       // ASCII — unambiguous 1-wide
  error: 'x',        // ASCII — unambiguous 1-wide
  warning: '!',       // ASCII — unambiguous 1-wide
  info: 'i',          // ASCII — unambiguous 1-wide
};

/** Uppercase labels used in pipe mode output. */
const PIPE_LABELS: Record<AlertVariant, string> = {
  success: 'SUCCESS',
  error: 'ERROR',
  warning: 'WARNING',
  info: 'INFO',
};

/** Title-cased labels used in accessible mode output. */
const ACCESSIBLE_LABELS: Record<AlertVariant, string> = {
  success: 'Success',
  error: 'Error',
  warning: 'Warning',
  info: 'Info',
};

/** Mapping from alert variant to the corresponding border theme token key. */
const BORDER_TOKENS: Record<AlertVariant, keyof Theme['border']> = {
  success: 'success',
  error: 'error',
  warning: 'warning',
  info: 'primary',
};

/**
 * Render an alert box with an icon and message.
 *
 * Output adapts to the current output mode:
 * - `interactive` / `static` — bordered box with a colored status icon.
 * - `pipe` — bracketed label like `[ERROR] message`.
 * - `accessible` — plain label like `Error: message`.
 *
 * @param message - Alert body text.
 * @param options - Alert configuration.
 * @returns The rendered alert string.
 */
export function alert(message: string, options: AlertOptions = {}): string {
  const ctx = resolveCtx(options.ctx);
  const variant = options.variant ?? 'info';
  const safeMessage = message ?? '';

  return renderByMode(ctx.mode, {
    pipe: () => `[${PIPE_LABELS[variant]}] ${safeMessage}`,
    accessible: () => `${ACCESSIBLE_LABELS[variant]}: ${safeMessage}`,
    interactive: () => {
      const icon = ICONS[variant];
      const semanticToken = ctx.semantic(variant);
      const borderToken = options.borderToken ?? ctx.border(BORDER_TOKENS[variant]);
      const coloredIcon = ctx.style.styled(semanticToken, icon);

      return box(coloredIcon + ' ' + safeMessage, {
        borderToken,
        bgToken: options.bgToken ?? ctx.surface('elevated'),
        padding: { left: 1, right: 1 },
        ctx,
      });
    },
  }, options);
}
