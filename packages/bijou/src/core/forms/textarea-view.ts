import { CLEAR_LINE } from '../ansi.js';
import type { BijouContext } from '../../ports/context.js';
import type { TextareaOptions } from './textarea-options.js';
import { formatFormTitle, terminalRenderer, createStyledFn } from './form-utils.js';
import { sanitizeOptionalNonNegativeInt, sanitizePositiveInt } from '../numeric.js';

interface TextareaSnapshot {
  readonly lines: readonly string[];
  readonly cursorRow: number;
  readonly cursorCol: number;
  readonly scrollY: number;
  readonly totalLength: number;
}

export function createTextareaView(options: TextareaOptions, ctx: BijouContext, snapshot: () => TextareaSnapshot) {
  const styledFn = createStyledFn(ctx);
  const height = sanitizePositiveInt(options.height, 6);
  const renderWidth = sanitizePositiveInt(options.width, 80);
  const maxLength = sanitizeOptionalNonNegativeInt(options.maxLength);
  const showLineNumbers = options.showLineNumbers ?? false;
  const term = terminalRenderer(ctx);

  function render(): void {
    const { lines, cursorRow, cursorCol, scrollY, totalLength } = snapshot();
    const label = formatFormTitle(options.title, ctx);
    const hint = styledFn(ctx.semantic('muted'), ' (Ctrl+D to submit, Ctrl+C/Esc to cancel)');
    term.writeLine(`${label}${hint}`);

    const vis = lines.slice(scrollY, scrollY + height);
    const numWidth = showLineNumbers ? String(lines.length).length : 0;
    const prefixWidth = showLineNumbers ? numWidth + 3 : 2; // " N │ " or "  "
    const contentWidth = Math.max(1, renderWidth - prefixWidth);
    for (let i = 0; i < height; i++) {
      const lineIdx = scrollY + i;
      const rawLine = vis[i] ?? '';
      const line = rawLine.length > contentWidth ? rawLine.slice(0, contentWidth) : rawLine;
      const prefix = showLineNumbers
        ? styledFn(ctx.semantic('muted'), `${String(lineIdx + 1).padStart(numWidth)} │ `)
        : '  ';

      if (lineIdx === 0 && options.placeholder && lines.length === 1 && lines[0] === '') {
        ctx.io.write(`${CLEAR_LINE}${prefix}${styledFn(ctx.semantic('muted'), options.placeholder)}\n`);
      } else {
        ctx.io.write(`${CLEAR_LINE}${prefix}${line}\n`);
      }
    }

    // Status line
    const pos = `Ln ${String(cursorRow + 1)}, Col ${String(cursorCol + 1)}`;
    const lenInfo = maxLength != null ? ` | ${String(totalLength)}/${String(maxLength)}` : '';
    ctx.io.write(`${CLEAR_LINE}${styledFn(ctx.semantic('muted'), pos + lenInfo)}\n`);
  }

  function clearRender(): void {
    const totalLines = height + 2; // header + visible lines + status
    term.moveUp(totalLines);
  }

  function cleanup(value: string, cancelled: boolean): void {
    clearRender();
    const totalLines = height + 2;
    term.clearBlock(totalLines);

    const summary = cancelled
      ? '(cancelled)'
      : (value
        ? (value.includes('\n') ? `${String(value.split('\n').length)} lines` : value)
        : '(empty)');
    const label = formatFormTitle(options.title, ctx) + ' ' + styledFn(ctx.semantic('info'), summary);
    ctx.io.write(`${CLEAR_LINE}${label}\n`);
    term.showCursor();
  }

  return { height, maxLength, render, clearRender, cleanup, hideCursor: () => { term.hideCursor(); } };
}
