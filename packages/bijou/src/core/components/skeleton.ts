import type { BijouContext } from '../../ports/context.js';
import { getDefaultContext } from '../../context.js';

export interface SkeletonOptions {
  width?: number;
  lines?: number;
  ctx?: BijouContext;
}

function resolveCtx(ctx?: BijouContext): BijouContext {
  if (ctx) return ctx;
  return getDefaultContext();
}

export function skeleton(options: SkeletonOptions = {}): string {
  const ctx = resolveCtx(options.ctx);
  const mode = ctx.mode;

  if (mode === 'pipe') return '';
  if (mode === 'accessible') return 'Loading...';

  const width = options.width ?? 20;
  const lines = options.lines ?? 1;
  const token = ctx.theme.theme.semantic.muted;
  const line = ctx.style.styled(token, '\u2591'.repeat(width));

  return Array.from({ length: lines }, () => line).join('\n');
}
