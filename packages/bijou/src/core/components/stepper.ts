import type { BijouContext } from '../../ports/context.js';
import type { TokenValue } from '../theme/tokens.js';
import { resolveCtx } from '../resolve-ctx.js';
import { renderByMode } from '../mode-render.js';
import { makeBgFill } from '../bg-fill.js';
import { mirrorsLayout, orderForDirection, type InlineDirection } from '../direction/direction.js';

/** Represent a single step in a multi-step process. */
export interface StepperStep {
  /** Display text for this step. */
  label: string;
}

/** Configuration options for the {@link stepper} component. */
export interface StepperOptions {
  /** Zero-based index of the current (active) step. */
  current: number;
  /** Background fill token for the active step indicator. No default — opt-in only. */
  activeBgToken?: TokenValue;
  /** Bijou context for rendering mode and theme resolution. */
  ctx?: BijouContext;
  /**
   * Logical layout direction. Overrides `ctx.direction`; absent both, `'ltr'`.
   * Under `'rtl'` in `interactive` and `static` output the steps run right to left.
   */
  direction?: InlineDirection | undefined;
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
 *   Under `rtl` the steps run right to left: the first step is rightmost and the
 *   next step sits to the left of the current one. Each step keeps its marker
 *   and label as written; the symmetric `──` connector and markers need no glyph
 *   mapping. `pipe` and `accessible` keep logical order.
 *
 * @param steps - Array of steps to render.
 * @param options - Rendering options including current step index and context.
 * @returns The formatted stepper string.
 */
export function stepper(steps: StepperStep[], options: StepperOptions): string {
  const ctx = resolveCtx(options.ctx);
  const current = options.current;

  return renderByMode(ctx.mode, {
    pipe: () => steps
      .map((step, i) => {
        const marker = i < current ? '[x]' : i === current ? '[*]' : '[ ]';
        return `${marker} ${step.label}`;
      })
      .join(' -- '),
    accessible: () => {
      const total = steps.length;
      const parts = steps.map((step, i) => {
        const state = i < current ? 'complete' : i === current ? 'current' : 'pending';
        return `${step.label} (${state})`;
      });
      return `Step ${String(current + 1)} of ${String(total)}: ${parts.join(', ')}`;
    },
    interactive: () => {
      // interactive + static
      const connector = ctx.style.styled(ctx.semantic('muted'), '──');
      const bgFill = makeBgFill(options.activeBgToken, ctx);
      const visual = mirrorsLayout({ ...options, ctx }) ? 'rtl' : 'ltr';
      const items = steps
        .map((step, i) => {
          if (i < current) {
            const token = ctx.status('success');
            return `${ctx.style.styled(token, '✓')} ${ctx.style.styled(token, step.label)}`;
          }
          if (i === current) {
            const token = ctx.semantic('primary');
            const boldToken = { hex: token.hex, modifiers: [...(token.modifiers ?? []), 'bold' as const] };
            const text = `${ctx.style.styled(token, '●')} ${ctx.style.styled(boldToken, step.label)}`;
            return bgFill ? bgFill(` ${text} `) : text;
          }
          const token = ctx.semantic('muted');
          return `${ctx.style.styled(token, '○')} ${ctx.style.styled(token, step.label)}`;
        });
      return orderForDirection(items, visual).join(` ${connector} `);
    },
  }, options);
}
