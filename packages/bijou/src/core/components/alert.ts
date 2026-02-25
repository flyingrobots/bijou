import type { BijouContext } from '../../ports/context.js';
import type { TokenValue } from '../theme/tokens.js';
import { getDefaultContext } from '../../context.js';
import { box } from './box.js';

export type AlertVariant = 'success' | 'error' | 'warning' | 'info';

export interface AlertOptions {
  variant?: AlertVariant;
  ctx?: BijouContext;
}

const ICONS: Record<AlertVariant, string> = {
  success: '\u2713',
  error: '\u2717',
  warning: '\u26A0',
  info: '\u2139',
};

const PIPE_LABELS: Record<AlertVariant, string> = {
  success: 'SUCCESS',
  error: 'ERROR',
  warning: 'WARNING',
  info: 'INFO',
};

const ACCESSIBLE_LABELS: Record<AlertVariant, string> = {
  success: 'Success',
  error: 'Error',
  warning: 'Warning',
  info: 'Info',
};

const BORDER_TOKENS: Record<AlertVariant, keyof BijouContext['theme']['theme']['border']> = {
  success: 'success',
  error: 'error',
  warning: 'warning',
  info: 'primary',
};

function resolveCtx(ctx?: BijouContext): BijouContext {
  if (ctx) return ctx;
  return getDefaultContext();
}

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
