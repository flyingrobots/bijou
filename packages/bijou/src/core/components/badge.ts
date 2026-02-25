import type { BijouContext } from '../../ports/context.js';
import type { TokenValue } from '../theme/tokens.js';
import { getDefaultContext } from '../../context.js';

export type BadgeVariant = 'success' | 'error' | 'warning' | 'info' | 'muted';

export interface BadgeOptions {
  variant?: BadgeVariant;
  ctx?: BijouContext;
}

function resolveCtx(ctx?: BijouContext): BijouContext {
  if (ctx) return ctx;
  return getDefaultContext();
}

export function badge(text: string, options: BadgeOptions = {}): string {
  const ctx = resolveCtx(options.ctx);
  const mode = ctx.mode;

  if (mode === 'pipe') return `[${text}]`;
  if (mode === 'accessible') return text;

  const variant = options.variant ?? 'info';
  const baseToken = ctx.theme.theme.status[variant];
  const inverseToken: TokenValue = {
    hex: baseToken.hex,
    modifiers: [...(baseToken.modifiers ?? []), 'inverse'],
  };

  return ctx.style.styled(inverseToken, ` ${text} `);
}
