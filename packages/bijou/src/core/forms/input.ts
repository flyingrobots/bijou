import type { FieldOptions, ValidationResult } from './types.js';
import type { BijouContext } from '../../ports/context.js';
import { resolveCtx } from '../resolve-ctx.js';
import { formatFormTitle, writeValidationError } from './form-utils.js';
import { renderByMode } from '../mode-render.js';

/**
 * Options for the text input field.
 */
export interface InputOptions extends FieldOptions<string> {
  /** Placeholder text shown when the input is empty. */
  placeholder?: string;
  /** Bijou context for IO, styling, and mode detection. */
  ctx?: BijouContext;
}

/**
 * Prompt the user for a single-line text input.
 *
 * Display adapts to the current output mode (interactive, accessible, pipe).
 * Runs validation and required-field checks after the user responds.
 *
 * @remarks Validation is non-blocking — errors are written to output but the
 * entered value is always returned.
 *
 * @param options - Input field configuration.
 * @returns The trimmed user input, or the default value if none was provided.
 */
export async function input(options: InputOptions): Promise<string> {
  const ctx = resolveCtx(options.ctx);
  const noColor = ctx.theme.noColor;

  const prompt = buildPrompt(options, noColor, ctx);
  const answer = await ctx.io.question(prompt);
  const value = answer.trim() || options.defaultValue || '';

  if (options.required && value === '') {
    writeValidationError('This field is required.', ctx);
  }

  if (options.validate) {
    const result: ValidationResult = options.validate(value);
    if (!result.valid && result.message) {
      writeValidationError(result.message, ctx);
    }
  }

  return value;
}

/**
 * Build a mode-appropriate prompt string for the input field.
 *
 * Mode is derived from `ctx`.
 *
 * @param options - Input field configuration.
 * @param noColor - Whether color output is disabled.
 * @param ctx - Bijou context for styling and mode.
 * @returns Formatted prompt string.
 */
function buildPrompt(options: InputOptions, noColor: boolean, ctx: BijouContext): string {
  const defaultHint = options.defaultValue ? ` (${options.defaultValue})` : '';

  return renderByMode(ctx.mode, {
    accessible: () => `Enter ${options.title.toLowerCase()}${defaultHint}: `,
    pipe: () => `${options.title}${defaultHint}: `,
    interactive: () => {
      if (noColor) return `${options.title}${defaultHint}: `;
      const label = formatFormTitle(options.title, ctx);
      const hint = options.defaultValue ? ctx.style.styled(ctx.semantic('muted'), ` (${options.defaultValue})`) : '';
      return `${label}${hint} `;
    },
  }, options);
}
