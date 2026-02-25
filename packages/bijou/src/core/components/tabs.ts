import type { BijouContext } from '../../ports/context.js';
import { getDefaultContext } from '../../context.js';

export interface TabItem {
  label: string;
  badge?: string;
}

export interface TabsOptions {
  active: number;
  separator?: string;
  ctx?: BijouContext;
}

function resolveCtx(ctx?: BijouContext): BijouContext {
  if (ctx) return ctx;
  return getDefaultContext();
}

function formatLabel(item: TabItem): string {
  return item.badge ? `${item.label} (${item.badge})` : item.label;
}

export function tabs(items: TabItem[], options: TabsOptions): string {
  const ctx = resolveCtx(options.ctx);
  const mode = ctx.mode;
  const active = options.active;

  if (mode === 'pipe') {
    const sep = options.separator ?? ' | ';
    return items
      .map((item, i) => {
        const label = formatLabel(item);
        return i === active ? `[${label}]` : label;
      })
      .join(sep);
  }

  if (mode === 'accessible') {
    const total = items.length;
    return items
      .map((item, i) => {
        const label = formatLabel(item);
        const tag = i === active ? ' (active)' : '';
        return `Tab ${i + 1} of ${total}: ${label}${tag}`;
      })
      .join(' | ');
  }

  // interactive + static
  const sep = options.separator ?? ' │ ';
  return items
    .map((item, i) => {
      const label = formatLabel(item);
      if (i === active) {
        const token = ctx.theme.theme.semantic.primary;
        const boldToken = { hex: token.hex, modifiers: [...(token.modifiers ?? []), 'bold' as const] };
        return `● ${ctx.style.styled(boldToken, label)}`;
      }
      return `  ${ctx.style.styled(ctx.theme.theme.semantic.muted, label)}`;
    })
    .join(sep);
}
