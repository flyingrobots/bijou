import type { BijouContext } from '../../ports/context.js';
import type { TokenValue, BaseStatusKey } from '../theme/tokens.js';
import { getDefaultContext } from '../../context.js';

export type BadgeVariant = BaseStatusKey | 'accent' | 'primary';

export interface BadgeOptions {
  variant?: BadgeVariant;
  ctx?: BijouContext;
}

function resolveCtx(ctx?: BijouContext): BijouContext | undefined {
  if (ctx) return ctx;
  try {
    return getDefaultContext();
  } catch {
    return undefined;
  }
}

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
