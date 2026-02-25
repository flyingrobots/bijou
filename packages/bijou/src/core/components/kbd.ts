import type { BijouContext } from '../../ports/context.js';
import { getDefaultContext } from '../../context.js';

export interface KbdOptions {
  ctx?: BijouContext;
}

function resolveCtx(ctx?: BijouContext): BijouContext {
  if (ctx) return ctx;
  return getDefaultContext();
}

export function kbd(key: string, options: KbdOptions = {}): string {
  const ctx = resolveCtx(options.ctx);
  const mode = ctx.mode;

  if (mode === 'pipe') return `<${key}>`;
  if (mode === 'accessible') return key;

  const borderToken = ctx.theme.theme.border.muted;
  const boldKey = ctx.style.bold(key);

  return ctx.style.styled(borderToken, '[') + ' ' + boldKey + ' ' + ctx.style.styled(borderToken, ']');
}
