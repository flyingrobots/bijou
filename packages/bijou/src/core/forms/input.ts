import type { FieldOptions, ValidationResult } from './types.js';
import type { BijouContext } from '../../ports/context.js';
import { getDefaultContext } from '../../context.js';

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
  const ctx = options.ctx ?? getDefaultContext();
  const mode = ctx.mode;
  const noColor = ctx.theme.noColor;

  const prompt = buildPrompt(options, mode, noColor, ctx);
  const answer = await ctx.io.question(prompt);
  const value = answer.trim() || options.defaultValue || '';

  if (options.required && value === '') {
    if (noColor || mode === 'accessible') {
      ctx.io.write('This field is required.\n');
    } else {
      ctx.io.write(ctx.style.styled(ctx.theme.theme.semantic.error, 'This field is required.') + '\n');
    }
  }

  if (options.validate) {
    const result: ValidationResult = options.validate(value);
    if (!result.valid && result.message) {
      if (noColor) {
        ctx.io.write(result.message + '\n');
      } else {
        ctx.io.write(ctx.style.styled(ctx.theme.theme.semantic.error, result.message) + '\n');
      }
    }
  }

  return value;
}

/**
 * Build a mode-appropriate prompt string for the input field.
 *
 * @param options - Input field configuration.
 * @param mode - Current output mode (interactive, accessible, pipe).
 * @param noColor - Whether color output is disabled.
 * @param ctx - Bijou context for styling.
 * @returns Formatted prompt string.
 */
function buildPrompt(options: InputOptions, mode: string, noColor: boolean, ctx: BijouContext): string {
  const defaultHint = options.defaultValue ? ` (${options.defaultValue})` : '';

  if (mode === 'accessible') return `Enter ${options.title.toLowerCase()}${defaultHint}: `;
  if (mode === 'pipe') return `${options.title}${defaultHint}: `;
  if (noColor) return `${options.title}${defaultHint}: `;

  const label = ctx.style.styled(ctx.theme.theme.semantic.info, '? ') + ctx.style.bold(options.title);
  const hint = options.defaultValue ? ctx.style.styled(ctx.theme.theme.semantic.muted, ` (${options.defaultValue})`) : '';
  return `${label}${hint} `;
}
