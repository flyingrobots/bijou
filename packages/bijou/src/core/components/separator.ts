import type { BijouContext } from '../../ports/context.js';
import type { TokenValue } from '../theme/tokens.js';
import { getDefaultContext } from '../../context.js';

export interface SeparatorOptions {
  label?: string;
  width?: number;
  borderToken?: TokenValue;
  ctx?: BijouContext;
}

function resolveCtx(ctx?: BijouContext): BijouContext {
  if (ctx) return ctx;
  return getDefaultContext();
}

export function separator(options: SeparatorOptions = {}): string {
  const ctx = resolveCtx(options.ctx);
  const mode = ctx.mode;
  const label = options.label;
  const width = options.width ?? ctx.runtime.columns;

  if (mode === 'pipe') {
    if (label) return `--- ${label} ---`;
    return '---';
  }

  if (mode === 'accessible') {
    if (label) return `--- ${label} ---`;
    return '';
  }

  const token = options.borderToken ?? ctx.theme.theme.border.muted;

  if (label) {
    const labelWithSpaces = ` ${label} `;
    const remaining = Math.max(0, width - labelWithSpaces.length);
    const left = Math.floor(remaining / 2);
    const right = remaining - left;
    return ctx.style.styled(token, '\u2500'.repeat(left)) + labelWithSpaces + ctx.style.styled(token, '\u2500'.repeat(right));
  }

  return ctx.style.styled(token, '\u2500'.repeat(width));
}
