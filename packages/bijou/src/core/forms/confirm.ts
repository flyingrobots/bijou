import type { ConfirmFieldOptions } from './types.js';
import type { BijouContext } from '../../ports/context.js';
import { getDefaultContext } from '../../context.js';

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
  const ctx = options.ctx ?? getDefaultContext();
  const mode = ctx.mode;
  const noColor = ctx.theme.noColor;
  const defaultYes = options.defaultValue !== false;
  const hint = defaultYes ? 'Y/n' : 'y/N';

  let prompt: string;
  if (mode === 'accessible') {
    prompt = `${options.title} Type yes or no (default: ${defaultYes ? 'yes' : 'no'}): `;
  } else if (mode === 'pipe' || noColor) {
    prompt = mode === 'pipe'
      ? `${options.title} ${hint}? `
      : `${options.title} [${hint}] `;
  } else {
    prompt = ctx.style.styled(ctx.theme.theme.semantic.info, '? ')
      + ctx.style.bold(options.title)
      + ctx.style.styled(ctx.theme.theme.semantic.muted, ` [${hint}]`) + ' ';
  }

  const answer = await ctx.io.question(prompt);
  const trimmed = answer.trim().toLowerCase();
  if (trimmed === '') return defaultYes;
  if (trimmed === 'y' || trimmed === 'yes') return true;
  if (trimmed === 'n' || trimmed === 'no') return false;
  return defaultYes;
}
