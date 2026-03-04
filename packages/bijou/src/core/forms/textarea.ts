import type { BijouContext } from '../../ports/context.js';
import { resolveCtx } from '../resolve-ctx.js';
import { formatFormTitle, writeValidationError, formDispatch } from './form-utils.js';
import { interactiveTextarea } from './textarea-editor.js';
export type { TextareaOptions } from './textarea-editor.js';
import type { TextareaOptions } from './textarea-editor.js';

/**
 * Prompt the user for multi-line text input.
 *
 * In interactive TTY mode, renders a scrollable editor with cursor
 * navigation, optional line numbers, and a character count status bar.
 * Falls back to a single-line question for pipe and accessible modes.
 *
 * @param options - Textarea field configuration.
 * @returns The entered text (newline-joined), or the default/empty string on cancel.
 */
export async function textarea(options: TextareaOptions): Promise<string> {
  const ctx = resolveCtx(options.ctx);

  return formDispatch(
    ctx,
    (c) => interactiveTextarea(options, c),
    (c) => fallbackTextarea(options, c),
  );
}

/**
 * Non-interactive textarea fallback that reads a single line of input.
 *
 * Used when the terminal is not a TTY or the mode is pipe/accessible.
 * Runs required-field and custom validation checks after input.
 *
 * @param options - Textarea field configuration.
 * @param ctx - Bijou context.
 * @returns The trimmed input or default value.
 */
async function fallbackTextarea(options: TextareaOptions, ctx: BijouContext): Promise<string> {
  ctx.io.write(formatFormTitle(options.title, ctx) + '\n');

  const prompt = ctx.mode === 'accessible'
    ? 'Enter text: '
    : '> ';
  const answer = await ctx.io.question(prompt);
  const value = answer.trim() || options.defaultValue || '';

  if (options.required && value === '') {
    writeValidationError('This field is required.', ctx);
  }

  if (options.validate) {
    const result = options.validate(value);
    if (!result.valid && result.message) {
      writeValidationError(result.message, ctx);
    }
  }

  return value;
}
