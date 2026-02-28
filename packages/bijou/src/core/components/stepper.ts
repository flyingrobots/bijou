import type { BijouContext } from '../../ports/context.js';
import { getDefaultContext } from '../../context.js';

/** Represent a single step in a multi-step process. */
export interface StepperStep {
  /** Display text for this step. */
  label: string;
}

/** Configuration options for the {@link stepper} component. */
export interface StepperOptions {
  /** Zero-based index of the current (active) step. */
  current: number;
  /** Bijou context for rendering mode and theme resolution. */
  ctx?: BijouContext;
}

/**
 * Resolve the provided context or fall back to the global default.
 *
 * @param ctx - Optional context override.
 * @returns The resolved {@link BijouContext}.
 */
function resolveCtx(ctx?: BijouContext): BijouContext {
  if (ctx) return ctx;
  return getDefaultContext();
}

/**
 * Render a horizontal step-progress indicator.
 *
 * Steps before the current index are marked complete, the current step is
 * highlighted, and remaining steps are shown as pending.
 *
 * Adapts output by mode:
 * - `pipe`: `[x]`/`[*]`/`[ ]` markers joined by ` -- `.
 * - `accessible`: `Step N of M: label (state), ...` format.
 * - `interactive`/`static`: `✓`/`●`/`○` icons with themed colors and `──` connectors.
 *
 * @param steps - Array of steps to render.
 * @param options - Rendering options including current step index and context.
 * @returns The formatted stepper string.
 */
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
