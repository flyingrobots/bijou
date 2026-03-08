import type { BijouContext } from '../../ports/context.js';
import { resolveCtx } from '../resolve-ctx.js';
import { renderByMode } from '../mode-render.js';

/** Configuration for a display-only note within a form flow. */
export interface NoteOptions {
  /** Message body text. */
  message: string;
  /** Optional bold title displayed above the message. */
  title?: string;
  /** Bijou context for I/O, styling, and mode detection. */
  ctx?: BijouContext;
}

/**
 * Display a read-only note in a form flow.
 *
 * The note is written to the output and resolves immediately — it does not
 * collect any value. This makes it compatible with `group()` and `wizard()`
 * as a step whose value is `undefined`.
 *
 * Output adapts to the current output mode:
 * - `interactive` — info icon + bold title + muted message with left accent line.
 * - `static` — same as interactive without accent styling.
 * - `pipe` / `accessible` — plain text `"Note: {message}"` or `"Note ({title}): {message}"`.
 *
 * @param options - Note configuration.
 * @returns A promise that resolves to `undefined` after writing the note.
 */
export async function note(options: NoteOptions): Promise<void> {
  const ctx = resolveCtx(options.ctx);
  const { message, title } = options;

  const output = renderByMode(ctx.mode, {
    pipe: () => formatPlain(title, message),
    accessible: () => formatPlain(title, message),
    interactive: () => formatVisual(title, message, ctx),
  }, options);

  ctx.io.write(output + '\n');
}

/** Format a plain-text note for pipe/accessible modes. */
function formatPlain(title: string | undefined, message: string): string {
  if (title) {
    return `Note (${title}): ${message}`;
  }
  return `Note: ${message}`;
}

/** Format a styled note for interactive/static modes. */
function formatVisual(title: string | undefined, message: string, ctx: BijouContext): string {
  const infoIcon = 'ℹ';
  const accentToken = ctx.semantic('info');
  const mutedToken = ctx.semantic('muted');

  const lines: string[] = [];

  if (title) {
    lines.push(
      ctx.style.styled(accentToken, `${infoIcon} `) + ctx.style.bold(title),
    );
  } else {
    lines.push(ctx.style.styled(accentToken, infoIcon));
  }

  for (const line of message.split('\n')) {
    lines.push(ctx.style.styled(mutedToken, `  ${line}`));
  }

  // Left accent line
  return lines
    .map((line) => ctx.style.styled(accentToken, '│') + ' ' + line)
    .join('\n');
}
