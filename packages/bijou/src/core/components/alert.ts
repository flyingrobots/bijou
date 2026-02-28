import type { BijouContext } from '../../ports/context.js';
import type { TokenValue } from '../theme/tokens.js';
import { getDefaultContext } from '../../context.js';
import { box } from './box.js';

/** Alert severity level. */
export type AlertVariant = 'success' | 'error' | 'warning' | 'info';

/** Configuration for rendering an alert box. */
export interface AlertOptions {
  /** Severity variant (defaults to `'info'`). */
  variant?: AlertVariant;
  /** Bijou context for I/O, styling, and mode detection. */
  ctx?: BijouContext;
}

/** Unicode icon characters for each alert variant. */
const ICONS: Record<AlertVariant, string> = {
  success: '\u2713',
  error: '\u2717',
  warning: '\u26A0',
  info: '\u2139',
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
const BORDER_TOKENS: Record<AlertVariant, keyof BijouContext['theme']['theme']['border']> = {
  success: 'success',
  error: 'error',
  warning: 'warning',
  info: 'primary',
};

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
  const mode = ctx.mode;
  const variant = options.variant ?? 'info';

  if (mode === 'pipe') return `[${PIPE_LABELS[variant]}] ${message}`;
  if (mode === 'accessible') return `${ACCESSIBLE_LABELS[variant]}: ${message}`;

  const icon = ICONS[variant];
  const semanticToken: TokenValue = ctx.theme.theme.semantic[variant === 'info' ? 'info' : variant];
  const borderToken = ctx.theme.theme.border[BORDER_TOKENS[variant]];
  const coloredIcon = ctx.style.styled(semanticToken, icon);

  return box(coloredIcon + ' ' + message, {
    borderToken,
    padding: { left: 1, right: 1 },
    ctx,
  });
}
