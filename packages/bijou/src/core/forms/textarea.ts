import type { FieldOptions } from './types.js';
import type { BijouContext } from '../../ports/context.js';
import type { TokenValue } from '../theme/tokens.js';
import type { OutputMode } from '../detect/tty.js';
import { getDefaultContext } from '../../context.js';

/**
 * Options for the multi-line textarea field.
 */
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
  const ctx = options.ctx ?? getDefaultContext();
  const mode = ctx.mode;

  if (mode === 'interactive' && ctx.runtime.stdinIsTTY) {
    return interactiveTextarea(options, ctx);
  }

  return fallbackTextarea(options, mode, ctx);
}

/**
 * Non-interactive textarea fallback that reads a single line of input.
 *
 * Used when the terminal is not a TTY or the mode is pipe/accessible.
 * Runs required-field and custom validation checks after input.
 *
 * @param options - Textarea field configuration.
 * @param mode - Current output mode.
 * @param ctx - Bijou context.
 * @returns The trimmed input or default value.
 */
async function fallbackTextarea(options: TextareaOptions, mode: OutputMode, ctx: BijouContext): Promise<string> {
  const noColor = ctx.theme.noColor;
  const styledFn = (token: TokenValue, text: string) => ctx.style.styled(token, text);

  if (noColor || mode === 'accessible') {
    ctx.io.write(`${options.title}\n`);
  } else {
    ctx.io.write(styledFn(ctx.theme.theme.semantic.info, '? ') + ctx.style.bold(options.title) + '\n');
  }

  const prompt = mode === 'accessible'
    ? 'Enter text (multi-line, empty line to finish): '
    : '> ';
  const answer = await ctx.io.question(prompt);
  const value = answer.trim() || options.defaultValue || '';

  if (options.required && value === '') {
    const msg = 'This field is required.';
    if (noColor || mode === 'accessible') {
      ctx.io.write(msg + '\n');
    } else {
      ctx.io.write(styledFn(ctx.theme.theme.semantic.error, msg) + '\n');
    }
  }

  if (options.validate) {
    const result = options.validate(value);
    if (!result.valid && result.message) {
      if (noColor) {
        ctx.io.write(result.message + '\n');
      } else {
        ctx.io.write(styledFn(ctx.theme.theme.semantic.error, result.message) + '\n');
      }
    }
  }

  return value;
}

/**
 * Render a full interactive textarea editor using raw terminal input.
 *
 * Supports arrow-key cursor movement, scrolling, line wrapping,
 * optional line numbers, placeholder text, and a max-length guard.
 * Ctrl+D submits; Ctrl+C or Escape cancels.
 *
 * @param options - Textarea field configuration.
 * @param ctx - Bijou context.
 * @returns The entered text (newline-joined), or the default value on cancel.
 */
async function interactiveTextarea(options: TextareaOptions, ctx: BijouContext): Promise<string> {
  const noColor = ctx.theme.noColor;
  const t = ctx.theme;
  const styledFn = (token: TokenValue, text: string) => ctx.style.styled(token, text);
  const height = options.height ?? 6;
  const renderWidth = options.width ?? 80;
  const showLineNumbers = options.showLineNumbers ?? false;

  let lines: string[] = [''];
  let cursorRow = 0;
  let cursorCol = 0;
  let scrollY = 0;

  function visibleLines(): string[] {
    return lines.slice(scrollY, scrollY + height);
  }

  function ensureCursorVisible(): void {
    if (cursorRow < scrollY) scrollY = cursorRow;
    if (cursorRow >= scrollY + height) scrollY = cursorRow - height + 1;
  }

  function render(): void {
    const label = noColor
      ? `? ${options.title}`
      : styledFn(t.theme.semantic.info, '? ') + ctx.style.bold(options.title);
    const hint = styledFn(t.theme.semantic.muted, ' (Ctrl+D to submit, Ctrl+C to cancel)');
    ctx.io.write(`\x1b[?25l`);
    ctx.io.write(`\r\x1b[K${label}${hint}\n`);

    const vis = visibleLines();
    const prefixWidth = showLineNumbers ? 6 : 2; // "  1 │ " or "  "
    const contentWidth = Math.max(1, renderWidth - prefixWidth);
    for (let i = 0; i < height; i++) {
      const lineIdx = scrollY + i;
      const rawLine = vis[i] ?? '';
      const line = rawLine.length > contentWidth ? rawLine.slice(0, contentWidth) : rawLine;
      const prefix = showLineNumbers
        ? styledFn(t.theme.semantic.muted, `${String(lineIdx + 1).padStart(3)} │ `)
        : '  ';

      if (lineIdx === 0 && options.placeholder && lines.length === 1 && lines[0] === '') {
        ctx.io.write(`\x1b[K${prefix}${styledFn(t.theme.semantic.muted, options.placeholder)}\n`);
      } else {
        ctx.io.write(`\x1b[K${prefix}${line}\n`);
      }
    }

    // Status line
    const pos = `Ln ${cursorRow + 1}, Col ${cursorCol + 1}`;
    const lenInfo = options.maxLength ? ` | ${currentLength()}/${options.maxLength}` : '';
    ctx.io.write(`\x1b[K${styledFn(t.theme.semantic.muted, pos + lenInfo)}\n`);
  }

  function currentLength(): number {
    return lines.join('\n').length;
  }

  function clearRender(): void {
    const totalLines = height + 2; // header + visible lines + status
    ctx.io.write(`\x1b[${totalLines}A`);
  }

  function cleanup(submitted: boolean): void {
    clearRender();
    const totalLines = height + 2;
    for (let i = 0; i < totalLines; i++) ctx.io.write(`\x1b[K\n`);
    ctx.io.write(`\x1b[${totalLines}A`);

    const value = submitted ? lines.join('\n') : '';
    const summary = value
      ? (value.includes('\n') ? `${value.split('\n').length} lines` : value)
      : '(cancelled)';
    const label = noColor
      ? `? ${options.title} ${summary}`
      : styledFn(t.theme.semantic.info, '? ') + ctx.style.bold(options.title) + ' ' + styledFn(t.theme.semantic.info, summary);
    ctx.io.write(`\x1b[K${label}\n`);
    ctx.io.write(`\x1b[?25h`);
  }

  render();

  return new Promise<string>((resolve) => {
    const handle = ctx.io.rawInput((key: string) => {
      if (key === '\x04') {
        // Ctrl+D — submit
        handle.dispose();
        cleanup(true);
        resolve(lines.join('\n'));
        return;
      }

      if (key === '\x03' || key === '\x1b') {
        // Ctrl+C or Escape — cancel
        // Note: bare \x1b may false-trigger on slow connections where escape
        // sequences arrive as separate bytes. Timer-based disambiguation is a
        // separate future improvement.
        handle.dispose();
        cleanup(false);
        resolve(options.defaultValue ?? '');
        return;
      }

      if (key === '\r' || key === '\n') {
        // Enter — newline (counts as 1 character for maxLength)
        if (options.maxLength && currentLength() >= options.maxLength) return;
        const currentLine = lines[cursorRow]!;
        const before = currentLine.slice(0, cursorCol);
        const after = currentLine.slice(cursorCol);
        lines[cursorRow] = before;
        lines.splice(cursorRow + 1, 0, after);
        cursorRow++;
        cursorCol = 0;
        ensureCursorVisible();
        clearRender();
        render();
        return;
      }

      if (key === '\x7f' || key === '\b') {
        // Backspace
        if (cursorCol > 0) {
          const line = lines[cursorRow]!;
          lines[cursorRow] = line.slice(0, cursorCol - 1) + line.slice(cursorCol);
          cursorCol--;
        } else if (cursorRow > 0) {
          // Merge with previous line
          const prevLine = lines[cursorRow - 1]!;
          const currentLine = lines[cursorRow]!;
          cursorCol = prevLine.length;
          lines[cursorRow - 1] = prevLine + currentLine;
          lines.splice(cursorRow, 1);
          cursorRow--;
          ensureCursorVisible();
        }
        clearRender();
        render();
        return;
      }

      // Arrow keys
      if (key === '\x1b[A') { // Up
        if (cursorRow > 0) {
          cursorRow--;
          cursorCol = Math.min(cursorCol, lines[cursorRow]!.length);
          ensureCursorVisible();
        }
        clearRender();
        render();
        return;
      }
      if (key === '\x1b[B') { // Down
        if (cursorRow < lines.length - 1) {
          cursorRow++;
          cursorCol = Math.min(cursorCol, lines[cursorRow]!.length);
          ensureCursorVisible();
        }
        clearRender();
        render();
        return;
      }
      if (key === '\x1b[C') { // Right
        if (cursorCol < lines[cursorRow]!.length) {
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
      if (key === '\x1b[D') { // Left
        if (cursorCol > 0) {
          cursorCol--;
        } else if (cursorRow > 0) {
          cursorRow--;
          cursorCol = lines[cursorRow]!.length;
          ensureCursorVisible();
        }
        clearRender();
        render();
        return;
      }

      // Printable character
      if (key.length === 1 && key >= ' ') {
        if (options.maxLength && currentLength() >= options.maxLength) return;
        const line = lines[cursorRow]!;
        lines[cursorRow] = line.slice(0, cursorCol) + key + line.slice(cursorCol);
        cursorCol++;
        clearRender();
        render();
      }
    });
  });
}
