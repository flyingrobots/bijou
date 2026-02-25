import type { BijouContext } from '../../ports/context.js';
import { getDefaultContext } from '../../context.js';

export interface StepperStep {
  label: string;
}

export interface StepperOptions {
  current: number;
  ctx?: BijouContext;
}

function resolveCtx(ctx?: BijouContext): BijouContext {
  if (ctx) return ctx;
  return getDefaultContext();
}

export function stepper(steps: StepperStep[], options: StepperOptions): string {
  const ctx = resolveCtx(options.ctx);
  const mode = ctx.mode;
  const current = options.current;

  if (mode === 'pipe') {
    return steps
      .map((step, i) => {
        const marker = i < current ? '[x]' : i === current ? '[*]' : '[ ]';
        return `${marker} ${step.label}`;
      })
      .join(' -- ');
  }

  if (mode === 'accessible') {
    const total = steps.length;
    const parts = steps.map((step, i) => {
      const state = i < current ? 'complete' : i === current ? 'current' : 'pending';
      return `${step.label} (${state})`;
    });
    return `Step ${current + 1} of ${total}: ${parts.join(', ')}`;
  }

  // interactive + static
  const connector = ctx.style.styled(ctx.theme.theme.semantic.muted, '──');
  return steps
    .map((step, i) => {
      if (i < current) {
        const token = ctx.theme.theme.status.success;
        return `${ctx.style.styled(token, '✓')} ${ctx.style.styled(token, step.label)}`;
      }
      if (i === current) {
        const token = ctx.theme.theme.semantic.primary;
        const boldToken = { hex: token.hex, modifiers: [...(token.modifiers ?? []), 'bold' as const] };
        return `${ctx.style.styled(token, '●')} ${ctx.style.styled(boldToken, step.label)}`;
      }
      const token = ctx.theme.theme.semantic.muted;
      return `${ctx.style.styled(token, '○')} ${ctx.style.styled(token, step.label)}`;
    })
    .join(` ${connector} `);
}
