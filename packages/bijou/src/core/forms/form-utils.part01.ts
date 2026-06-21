import type { BijouContext } from '../../ports/context.js';

import type { KeyInputMsg, RawInputHandle } from '../../ports/io.js';

import type { TokenValue } from '../theme/tokens.js';

import { cursorGuard } from '../components/cursor-guard.js';

import type { CursorHideHandle } from '../components/cursor-guard.js';

import { CLEAR_LINE, CLEAR_LINE_RETURN, cursorUp } from '../ansi.js';

import { decodeRawKeySequence } from '../key-input.js';
export function formatFormTitle(title: string, ctx: BijouContext): string {
  if (ctx.theme.noColor || ctx.mode === 'accessible') {
    return `? ${title}`;
  }
  return ctx.style.styled(ctx.semantic('info'), '? ') + ctx.style.bold(title);
}
export function writeValidationError(message: string, ctx: BijouContext): void {
  if (ctx.theme.noColor || ctx.mode === 'accessible') {
    ctx.io.write(message + '\n');
  } else {
    ctx.io.write(ctx.style.styled(ctx.semantic('error'), message) + '\n');
  }
}
export function renderNumberedOptions(
  options: readonly { label: string; description?: string }[],
  ctx: BijouContext,
): void {
  for (const [i, opt] of options.entries()) {
    const desc = opt.description ? ` \u2014 ${opt.description}` : '';
    ctx.io.write(`  ${String(i + 1)}. ${opt.label}${desc}\n`);
  }
}
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
export function terminalRenderer(ctx: BijouContext): TerminalRenderer {
  let cursorHandle: CursorHideHandle | null = null;
  return {
    hideCursor() {
      cursorHandle ??= cursorGuard(ctx.io).hide();
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
      ctx.io.write(cursorUp(lines));
    },
    clearBlock(lineCount: number) {
      if (lineCount <= 0) return;
      for (let i = 0; i < lineCount; i++) ctx.io.write(`${CLEAR_LINE}\n`);
      ctx.io.write(cursorUp(lineCount));
    },
  };
}
export function createStyledFn(ctx: BijouContext): (token: TokenValue, text: string) => string {
  if (ctx.theme.noColor || ctx.mode === 'accessible') return (_token: TokenValue, text: string) => text;
  return (token: TokenValue, text: string) => ctx.style.styled(token, text);
}
export function createBoldFn(ctx: BijouContext): (text: string) => string {
  if (ctx.theme.noColor || ctx.mode === 'accessible') return (text: string) => text;
  return (text: string) => ctx.style.bold(text);
}
export function clampScroll(cursor: number, scrollOffset: number, maxVisible: number, itemCount: number): number {
  let offset = scrollOffset;
  if (cursor < offset) {
    offset = cursor;
  } else if (cursor >= offset + maxVisible) {
    offset = cursor - maxVisible + 1;
  }
  return Math.max(0, Math.min(offset, Math.max(0, itemCount - maxVisible)));
}
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
export function isPrintableKey(key: KeyInputMsg): key is KeyInputMsg & { text: string } {
  return key.text !== undefined;
}
