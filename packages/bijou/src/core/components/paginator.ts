import type { BijouContext } from '../../ports/context.js';
import { getDefaultContext } from '../../context.js';

export interface PaginatorOptions {
  current: number;
  total: number;
  style?: 'dots' | 'text';
  ctx?: BijouContext;
}

function resolveCtx(ctx?: BijouContext): BijouContext {
  if (ctx) return ctx;
  return getDefaultContext();
}

export function paginator(options: PaginatorOptions): string {
  const ctx = resolveCtx(options.ctx);
  const mode = ctx.mode;
  const page = options.current + 1; // convert 0-indexed to 1-indexed for display
  const total = options.total;

  if (mode === 'pipe') return `[${page}/${total}]`;
  if (mode === 'accessible') return `Page ${page} of ${total}`;

  // interactive + static
  const style = options.style ?? 'dots';

  if (style === 'text') return `Page ${page} of ${total}`;

  // dots style
  const dots: string[] = [];
  for (let i = 0; i < total; i++) {
    if (i === options.current) {
      dots.push(ctx.style.styled(ctx.theme.theme.semantic.primary, '●'));
    } else {
      dots.push(ctx.style.styled(ctx.theme.theme.semantic.muted, '○'));
    }
  }
  return dots.join(' ');
}
