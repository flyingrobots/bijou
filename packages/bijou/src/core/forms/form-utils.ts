/**
 * Shared form utilities extracted from duplicated patterns across
 * select, multiselect, filter, textarea, input, and confirm.
 *
 * These are internal helpers — not exported from the public barrel.
 *
 * @module core/forms/form-utils
 */

import type { BijouContext } from '../../ports/context.js';
import type { KeyInputMsg, RawInputHandle } from '../../ports/io.js';
import type { TokenValue } from '../theme/tokens.js';
import { cursorGuard, type CursorHideHandle } from '../components/cursor-guard.js';
import { CLEAR_LINE_RETURN } from '../ansi.js';
import { decodeRawKeySequence } from '../key-input.js';

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
  return ctx.style.styled(ctx.semantic('info'), '? ') + ctx.style.bold(title);
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
    ctx.io.write(ctx.style.styled(ctx.semantic('error'), message) + '\n');
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
  let cursorHandle: CursorHideHandle | null = null;
  return {
    hideCursor() {
      if (cursorHandle === null) {
        cursorHandle = cursorGuard(ctx.io).hide();
      }
    },
    showCursor() {
      if (cursorHandle !== null) {
        cursorHandle.dispose();
        cursorHandle = null;
      }
    },
    writeLine(text: string) {
      ctx.io.write(`${CLEAR_LINE_RETURN}${text}\n`);
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
 * Keep a scroll offset so the cursor stays within a visible window.
 *
 * First adjusts the offset relative to the cursor position, then
 * clamps to the absolute bounds `[0, max(0, itemCount - maxVisible)]`.
 *
 * @param cursor - Current cursor index.
 * @param scrollOffset - Current scroll offset.
 * @param maxVisible - Maximum number of items visible at once.
 * @param itemCount - Total number of items.
 * @returns The updated scroll offset.
 */
export function clampScroll(cursor: number, scrollOffset: number, maxVisible: number, itemCount: number): number {
  let offset = scrollOffset;
  if (cursor < offset) {
    offset = cursor;
  } else if (cursor >= offset + maxVisible) {
    offset = cursor - maxVisible + 1;
  }
  return Math.max(0, Math.min(offset, Math.max(0, itemCount - maxVisible)));
}

/**
 * Subscribe to semantic form key input, preferring `ctx.io.keyInput()` when
 * available and falling back to decoding `rawInput()` sequences otherwise.
 *
 * This keeps interactive forms deterministic in tests without forcing
 * production adapters away from the lower-level raw-input contract.
 *
 * @param ctx - Bijou context providing the input port.
 * @param onKey - Callback invoked for each semantic key.
 * @returns A disposable handle that stops further key delivery.
 */
export function subscribeFormKeyInput(
  ctx: BijouContext,
  onKey: (key: KeyInputMsg) => void,
): RawInputHandle {
  if (typeof ctx.io.keyInput === 'function') {
    return ctx.io.keyInput(onKey);
  }
  return ctx.io.rawInput((key) => {
    for (const msg of decodeRawKeySequence(key)) {
      onKey(msg);
    }
  });
}

/**
 * Whether a semantic key carries printable text.
 *
 * @param key - The semantic key to test.
 * @returns `true` when the key represents typed text.
 */
export function isPrintableKey(key: KeyInputMsg): key is KeyInputMsg & { text: string } {
  return key.text !== undefined;
}

/**
 * Match a semantic key by logical key name and optional modifier flags.
 *
 * @param msg - The key message to test.
 * @param key - Expected logical key name.
 * @param mods - Optional modifier constraints.
 * @returns `true` when the key matches.
 */
export function isKey(
  msg: KeyInputMsg,
  key: string,
  mods: Partial<Pick<KeyInputMsg, 'ctrl' | 'alt' | 'shift'>> = {},
): boolean {
  if (msg.key !== key) return false;
  if (mods.ctrl !== undefined && msg.ctrl !== mods.ctrl) return false;
  if (mods.alt !== undefined && msg.alt !== mods.alt) return false;
  if (mods.shift !== undefined && msg.shift !== mods.shift) return false;
  return true;
}

/**
 * Handle up/down (arrow key or j/k) navigation in a wrapping list.
 *
 * @param key - The semantic keypress.
 * @param cursor - Current cursor index.
 * @param length - Total number of items.
 * @returns The new cursor index, or `null` if the key was not a vertical nav key.
 */
export function handleVerticalNav(key: KeyInputMsg, cursor: number, length: number): number | null {
  if (isKey(key, 'up') || key.text === 'k') {
    return (cursor - 1 + length) % length;
  }
  if (isKey(key, 'down') || key.text === 'j') {
    return (cursor + 1) % length;
  }
  return null;
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
