import type { BijouContext } from '../../ports/context.js';
import { getDefaultContext } from '../../context.js';

export interface BreadcrumbOptions {
  separator?: string;
  ctx?: BijouContext;
}

function resolveCtx(ctx?: BijouContext): BijouContext {
  if (ctx) return ctx;
  return getDefaultContext();
}

export function breadcrumb(items: string[], options: BreadcrumbOptions = {}): string {
  const ctx = resolveCtx(options.ctx);
  const mode = ctx.mode;

  if (mode === 'pipe') {
    const sep = options.separator ?? ' > ';
    return items.join(sep);
  }

  if (mode === 'accessible') {
    const path = items.join(' > ');
    return `Breadcrumb: ${path} (current)`;
  }

  // interactive + static
  const sep = options.separator ?? ' › ';
  const last = items.length - 1;
  return items
    .map((item, i) => {
      if (i === last) {
        const token = ctx.theme.theme.semantic.primary;
        const boldToken = { hex: token.hex, modifiers: [...(token.modifiers ?? []), 'bold' as const] };
        return ctx.style.styled(boldToken, item);
      }
      return ctx.style.styled(ctx.theme.theme.semantic.muted, item);
    })
    .join(sep);
}
