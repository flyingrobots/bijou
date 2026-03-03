/**
 * Shared form utilities extracted from duplicated patterns across
 * select, multiselect, filter, textarea, input, and confirm.
 *
 * These are internal helpers — not exported from the public barrel.
 *
 * @module core/forms/form-utils
 */

import type { BijouContext } from '../../ports/context.js';
import type { TokenValue } from '../theme/tokens.js';

/**
 * Format a form title with the `?` prefix and theme-aware styling.
 *
 * Returns `? title` with styling in color mode, or plain `? title`
 * in noColor/accessible modes. The `?` prefix is always included
 * for visual parity across modes.
 *
 * @param title - The form prompt text.
 * @param ctx - Bijou context for styling and mode detection.
 * @returns The formatted title string (no trailing newline).
 */
export function formatFormTitle(title: string, ctx: BijouContext): string {
  if (ctx.theme.noColor || ctx.mode === 'accessible') {
    return `? ${title}`;
  }
  return ctx.style.styled(ctx.theme.theme.semantic.info, '? ') + ctx.style.bold(title);
}

/**
 * Write a styled validation error message to the output.
 *
 * Applies `semantic.error` styling in color mode, plain text in
 * noColor/accessible modes.
 *
 * @param message - The error message to display.
 * @param ctx - Bijou context for styling and mode detection.
 */
export function writeValidationError(message: string, ctx: BijouContext): void {
  if (ctx.theme.noColor || ctx.mode === 'accessible') {
    ctx.io.write(message + '\n');
  } else {
    ctx.io.write(ctx.style.styled(ctx.theme.theme.semantic.error, message) + '\n');
  }
}

/**
 * Render a numbered list of options to the output.
 *
 * Used by form fallback modes (select, multiselect, filter) when
 * interactive arrow-key navigation is unavailable.
 *
 * @param options - Array of options with `label` and optional `description`.
 * @param ctx - Bijou context for output.
 */
export function renderNumberedOptions(
  options: ReadonlyArray<{ label: string; description?: string }>,
  ctx: BijouContext,
): void {
  for (let i = 0; i < options.length; i++) {
    const opt = options[i]!;
    const desc = opt.description ? ` \u2014 ${opt.description}` : '';
    ctx.io.write(`  ${i + 1}. ${opt.label}${desc}\n`);
  }
}

/**
 * ANSI terminal rendering utilities for interactive form components.
 *
 * Provides cursor control helpers that replace the duplicated raw ANSI
 * escape sequences scattered across form interactive modes.
 */
export interface TerminalRenderer {
  /** Hide the terminal cursor. */
  hideCursor(): void;
  /** Show the terminal cursor. */
  showCursor(): void;
  /** Clear the current line and write text followed by a newline. */
  writeLine(text: string): void;
  /** Move the cursor up by the given number of lines. */
  moveUp(lines: number): void;
  /** Clear a block of N lines and return the cursor to the top of the block. */
  clearBlock(lineCount: number): void;
}

/**
 * Create a {@link TerminalRenderer} that writes ANSI escape sequences
 * to `ctx.io`.
 *
 * @param ctx - Bijou context for I/O access.
 * @returns A renderer with cursor control methods.
 */
export function terminalRenderer(ctx: BijouContext): TerminalRenderer {
  return {
    hideCursor() {
      ctx.io.write('\x1b[?25l');
    },
    showCursor() {
      ctx.io.write('\x1b[?25h');
    },
    writeLine(text: string) {
      ctx.io.write(`\r\x1b[K${text}\n`);
    },
    moveUp(lines: number) {
      if (lines <= 0) return;
      ctx.io.write(`\x1b[${lines}A`);
    },
    clearBlock(lineCount: number) {
      if (lineCount <= 0) return;
      for (let i = 0; i < lineCount; i++) ctx.io.write('\x1b[K\n');
      ctx.io.write(`\x1b[${lineCount}A`);
    },
  };
}

/**
 * Create a noColor-safe styling function.
 *
 * Returns an identity function `(token, text) => text` when `noColor`
 * is true or mode is `accessible`, or `ctx.style.styled` otherwise.
 * Eliminates per-callsite `noColor ? text : styledFn(token, text)` guards.
 *
 * @param ctx - Bijou context for noColor/accessible detection and style access.
 * @returns A function `(token, text) => string`.
 */
export function createStyledFn(ctx: BijouContext): (token: TokenValue, text: string) => string {
  if (ctx.theme.noColor || ctx.mode === 'accessible') return (_token: TokenValue, text: string) => text;
  return (token: TokenValue, text: string) => ctx.style.styled(token, text);
}

/**
 * Create a noColor-safe bold function.
 *
 * Returns an identity function when `noColor` is true or mode is
 * `accessible`, or `ctx.style.bold` otherwise.
 *
 * @param ctx - Bijou context for noColor/accessible detection and style access.
 * @returns A function `(text) => string`.
 */
export function createBoldFn(ctx: BijouContext): (text: string) => string {
  if (ctx.theme.noColor || ctx.mode === 'accessible') return (text: string) => text;
  return (text: string) => ctx.style.bold(text);
}

/**
 * Route a form to its interactive or fallback handler based on
 * output mode and TTY state.
 *
 * @param ctx - Resolved bijou context.
 * @param interactive - Handler for interactive TTY mode.
 * @param fallback - Handler for non-interactive / pipe / static / accessible modes.
 * @returns The result from whichever handler was selected.
 */
export function formDispatch<T>(
  ctx: BijouContext,
  interactive: (ctx: BijouContext) => Promise<T>,
  fallback: (ctx: BijouContext) => Promise<T>,
): Promise<T> {
  if (ctx.mode === 'interactive' && ctx.runtime.stdinIsTTY && ctx.runtime.stdoutIsTTY) {
    return interactive(ctx);
  }
  return fallback(ctx);
}
