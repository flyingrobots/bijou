import type { ConfirmFieldOptions } from './types.js';
import type { BijouContext } from '../../ports/context.js';
import { resolveCtx } from '../resolve-ctx.js';
import { formatFormTitle } from './form-utils.js';
import { renderByMode } from '../mode-render.js';

/**
 * Options for the yes/no confirmation prompt.
 */
export interface ConfirmOptions extends ConfirmFieldOptions {
  /** Bijou context for IO, styling, and mode detection. */
  ctx?: BijouContext;
}

/**
 * Prompt the user with a yes/no confirmation question.
 *
 * Accepts "y", "yes", "n", "no" (case-insensitive). An empty response
 * returns the default value (true unless overridden). Display adapts to
 * the current output mode.
 *
 * @param options - Confirmation field configuration.
 * @returns `true` for yes, `false` for no.
 */
export async function confirm(options: ConfirmOptions): Promise<boolean> {
  const ctx = resolveCtx(options.ctx);
  const noColor = ctx.theme.noColor;
  const defaultYes = options.defaultValue !== false;
  const hint = defaultYes ? 'Y/n' : 'y/N';

  const prompt = renderByMode(ctx.mode, {
    accessible: () => `${options.title} Type yes or no (default: ${defaultYes ? 'yes' : 'no'}): `,
    pipe: () => `${options.title} ${hint}? `,
    interactive: () => {
      if (noColor) {
        return `${formatFormTitle(options.title, ctx)} [${hint}] `;
      }
      return formatFormTitle(options.title, ctx)
        + ctx.style.styled(ctx.semantic('muted'), ` [${hint}]`) + ' ';
    },
  }, options);

  const answer = await ctx.io.question(prompt);
  const trimmed = answer.trim().toLowerCase();
  if (trimmed === '') return defaultYes;
  if (trimmed === 'y' || trimmed === 'yes') return true;
  if (trimmed === 'n' || trimmed === 'no') return false;
  return defaultYes;
}
