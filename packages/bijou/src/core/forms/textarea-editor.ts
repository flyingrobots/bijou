import type { FieldOptions } from './types.js';
import type { BijouContext } from '../../ports/context.js';
import {
  formatFormTitle,
  terminalRenderer,
  createStyledFn,
  isKey,
  isPrintableKey,
  subscribeFormKeyInput,
} from './form-utils.js';
import { sanitizeOptionalNonNegativeInt, sanitizePositiveInt } from '../numeric.js';

export interface TextareaOptions extends FieldOptions<string> {
  /** Placeholder text shown when the textarea is empty. */
  placeholder?: string;
  /** Maximum character count (including newlines). */
  maxLength?: number;
  /** Display line numbers in the gutter. Default: false. */
  showLineNumbers?: boolean;
  /** Visible editor height in lines. Default: 6. */
  height?: number;
  /** Render width in columns. Default: 80. */
  width?: number;
  /** Bijou context for IO, styling, and mode detection. */
  ctx?: BijouContext;
}

export async function interactiveTextarea(options: TextareaOptions, ctx: BijouContext): Promise<string> {
  const styledFn = createStyledFn(ctx);
  const height = sanitizePositiveInt(options.height, 6);
  const renderWidth = sanitizePositiveInt(options.width, 80);
  const maxLength = sanitizeOptionalNonNegativeInt(options.maxLength);
  const showLineNumbers = options.showLineNumbers ?? false;
  const term = terminalRenderer(ctx);

  const lines: string[] = [''];
  let cursorRow = 0;
  let cursorCol = 0;
  let scrollY = 0;
  let totalLength = 0;

  function lineAt(index: number): string {
    return lines[index] ?? '';
  }

  function visibleLines(): string[] {
    return lines.slice(scrollY, scrollY + height);
  }

  function ensureCursorVisible(): void {
    if (cursorRow < scrollY) scrollY = cursorRow;
    if (cursorRow >= scrollY + height) scrollY = cursorRow - height + 1;
  }

  function render(): void {
    const label = formatFormTitle(options.title, ctx);
    const hint = styledFn(ctx.semantic('muted'), ' (Ctrl+D to submit, Ctrl+C/Esc to cancel)');
    term.writeLine(`${label}${hint}`);

    const vis = visibleLines();
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
        ctx.io.write(`\x1b[K${prefix}${styledFn(ctx.semantic('muted'), options.placeholder)}\n`);
      } else {
        ctx.io.write(`\x1b[K${prefix}${line}\n`);
      }
    }

    // Status line
    const pos = `Ln ${String(cursorRow + 1)}, Col ${String(cursorCol + 1)}`;
    const lenInfo = maxLength != null ? ` | ${String(totalLength)}/${String(maxLength)}` : '';
    ctx.io.write(`\x1b[K${styledFn(ctx.semantic('muted'), pos + lenInfo)}\n`);
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
    ctx.io.write(`\x1b[K${label}\n`);
    term.showCursor();
  }

  term.hideCursor();
  render();

  return new Promise<string>((resolve) => {
    const handle = subscribeFormKeyInput(ctx, (key) => {
      if (isKey(key, 'd', { ctrl: true })) {
        // Ctrl+D — submit
        handle.dispose();
        const text = lines.join('\n');
        const value = text || (options.defaultValue ?? '');
        cleanup(value, false);
        resolve(value);
        return;
      }

      if (isKey(key, 'c', { ctrl: true }) || isKey(key, 'escape')) {
        // Ctrl+C or Escape — cancel
        // TODO: bare \x1b may false-trigger on slow connections where escape
        // sequences arrive as separate bytes. Timer-based disambiguation is a
        // shared debt with filter-interactive.ts — unify in a future PR.
        handle.dispose();
        const value = options.defaultValue ?? '';
        cleanup(value, true);
        resolve(value);
        return;
      }

      if (isKey(key, 'enter')) {
        // Enter — newline (counts as 1 character for maxLength)
        if (maxLength != null && totalLength >= maxLength) return;
        const currentLine = lineAt(cursorRow);
        const before = currentLine.slice(0, cursorCol);
        const after = currentLine.slice(cursorCol);
        lines[cursorRow] = before;
        lines.splice(cursorRow + 1, 0, after);
        totalLength++;  // newline character
        cursorRow++;
        cursorCol = 0;
        ensureCursorVisible();
        clearRender();
        render();
        return;
      }

      if (isKey(key, 'backspace')) {
        // Backspace
        if (cursorCol > 0) {
          const line = lineAt(cursorRow);
          lines[cursorRow] = line.slice(0, cursorCol - 1) + line.slice(cursorCol);
          cursorCol--;
          totalLength--;  // removed one character
        } else if (cursorRow > 0) {
          // Merge with previous line
          const prevLine = lineAt(cursorRow - 1);
          const currentLine = lineAt(cursorRow);
          cursorCol = prevLine.length;
          lines[cursorRow - 1] = prevLine + currentLine;
          lines.splice(cursorRow, 1);
          cursorRow--;
          totalLength--;  // removed newline character
          ensureCursorVisible();
        }
        clearRender();
        render();
        return;
      }
      // Arrow keys
      if (isKey(key, 'up')) { // Up
        if (cursorRow > 0) {
          cursorRow--;
          cursorCol = Math.min(cursorCol, lineAt(cursorRow).length);
          ensureCursorVisible();
        }
        clearRender();
        render();
        return;
      }
      if (isKey(key, 'down')) { // Down
        if (cursorRow < lines.length - 1) {
          cursorRow++;
          cursorCol = Math.min(cursorCol, lineAt(cursorRow).length);
          ensureCursorVisible();
        }
        clearRender();
        render();
        return;
      }
      if (isKey(key, 'right')) { // Right
        if (cursorCol < lineAt(cursorRow).length) {
          cursorCol++;
        } else if (cursorRow < lines.length - 1) {
          cursorRow++;
          cursorCol = 0;
          ensureCursorVisible();
        }
        clearRender();
        render();
        return;
      }
      if (isKey(key, 'left')) { // Left
        if (cursorCol > 0) {
          cursorCol--;
        } else if (cursorRow > 0) {
          cursorRow--;
          cursorCol = lineAt(cursorRow).length;
          ensureCursorVisible();
        }
        clearRender();
        render();
        return;
      }
      // Printable character
      if (isPrintableKey(key)) {
        if (maxLength != null && totalLength >= maxLength) return;
        const line = lineAt(cursorRow);
        lines[cursorRow] = line.slice(0, cursorCol) + key.text + line.slice(cursorCol);
        cursorCol++;
        totalLength++;  // added one character
        clearRender();
        render();
      }
    });
  });
}
