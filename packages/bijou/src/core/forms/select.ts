import type { SelectFieldOptions, SelectOption } from './types.js';
import type { BijouContext } from '../../ports/context.js';
import { resolveCtx } from '../resolve-ctx.js';
import { formatFormTitle, renderNumberedOptions, terminalRenderer, formDispatch, createStyledFn, createBoldFn } from './form-utils.js';

/**
 * Options for the single-select field.
 *
 * @typeParam T - Type of each option's value.
 */
export interface SelectOptions<T = string> extends SelectFieldOptions<T> {
  /** Bijou context for IO, styling, and mode detection. */
  ctx?: BijouContext;
}

/**
 * Prompt the user to choose one item from a list.
 *
 * Uses arrow-key navigation in interactive TTY mode, or a numbered list
 * fallback for pipe and accessible modes.
 *
 * If `defaultValue` does not match any option (via {@link Object.is}), the
 * first option is used as the cancellation fallback.
 *
 * @typeParam T - Type of each option's value.
 * @param options - Select field configuration.
 * @returns The value of the selected option.
 * @throws {Error} If `options.options` is empty.
 */
export async function select<T = string>(options: SelectOptions<T>): Promise<T> {
  const ctx = resolveCtx(options.ctx);

  if (options.options.length === 0) {
    throw new Error('select() requires at least one option');
  }

  return formDispatch(
    ctx,
    (c) => interactiveSelect(options, c),
    (c) => numberedSelect(options, c),
  );
}

/**
 * Display options as a numbered list and accept numeric input.
 *
 * Used as the fallback for non-interactive or accessible modes.
 *
 * @param options - Select field configuration.
 * @param ctx - Bijou context.
 * @returns The value of the selected option.
 */
async function numberedSelect<T>(options: SelectOptions<T>, ctx: BijouContext): Promise<T> {
  ctx.io.write(formatFormTitle(options.title, ctx) + '\n');
  renderNumberedOptions(options.options, ctx);

  const prompt = ctx.mode === 'accessible' ? 'Enter number: ' : '> ';
  const answer = await ctx.io.question(prompt);

  const idx = parseInt(answer.trim(), 10) - 1;
  if (idx >= 0 && idx < options.options.length) {
    return options.options[idx]!.value;
  }
  return options.defaultValue ?? options.options[0]!.value;
}

/**
 * Display a keyboard-navigable select menu using raw terminal input.
 *
 * Supports arrow keys and j/k for navigation, Enter to confirm,
 * Ctrl+C or Escape to cancel (returns default or first option).
 *
 * @param options - Select field configuration.
 * @param ctx - Bijou context.
 * @returns The value of the selected option.
 */
async function interactiveSelect<T>(options: SelectOptions<T>, ctx: BijouContext): Promise<T> {
  const noColor = ctx.theme.noColor;
  const styledFn = createStyledFn(ctx);
  const boldFn = createBoldFn(ctx);
  const term = terminalRenderer(ctx);
  const rawMaxVisible = options.maxVisible ?? 7;
  const maxVisible = Number.isFinite(rawMaxVisible)
    ? Math.max(1, Math.floor(rawMaxVisible))
    : 7;

  let cursor = 0;
  let scrollOffset = 0;

  /** Keep the scroll offset so the cursor stays within the visible window. */
  function clampScroll(): void {
    if (cursor < scrollOffset) {
      scrollOffset = cursor;
    } else if (cursor >= scrollOffset + maxVisible) {
      scrollOffset = cursor - maxVisible + 1;
    }
    scrollOffset = Math.max(0, Math.min(scrollOffset, Math.max(0, options.options.length - maxVisible)));
  }

  /** Return the slice of options currently visible on screen. */
  function visibleOptions(): SelectOption<T>[] {
    return options.options.slice(scrollOffset, scrollOffset + maxVisible);
  }

  /** Calculate the total terminal lines occupied by the current render. */
  function renderLineCount(): number {
    return 1 + Math.min(options.options.length, maxVisible);
  }

  /** Write the select UI (title, option list) to the terminal. */
  function render(): void {
    const label = formatFormTitle(options.title, ctx);
    term.hideCursor();
    term.writeLine(label);

    const visible = visibleOptions();
    for (let i = 0; i < visible.length; i++) {
      const globalIndex = scrollOffset + i;
      const opt = visible[i]!;
      const isCurrent = globalIndex === cursor;
      const prefix = isCurrent ? '\u276f' : ' ';
      const desc = opt.description ? styledFn(ctx.semantic('muted'), ` \u2014 ${opt.description}`) : '';
      if (isCurrent && !noColor) {
        ctx.io.write(`\x1b[K  ${styledFn(ctx.semantic('info'), prefix)} ${boldFn(opt.label)}${desc}\n`);
      } else {
        ctx.io.write(`\x1b[K  ${prefix} ${opt.label}${desc}\n`);
      }
    }
  }

  /** Move the cursor up to overwrite the previous render. */
  function clearRender(): void {
    const totalLines = renderLineCount();
    term.moveUp(totalLines);
  }

  /** Erase the full UI and print the final selection summary line. */
  function cleanup(selectedLabel?: string): void {
    clearRender();
    const totalLines = renderLineCount();
    term.clearBlock(totalLines);
    const displayLabel = selectedLabel ?? (options.options[cursor] as SelectOption<T>).label;
    const label = formatFormTitle(options.title, ctx) + ' ' + styledFn(ctx.semantic('info'), displayLabel);
    ctx.io.write(`\x1b[K${label}\n`);
    term.showCursor();
  }

  render();

  return new Promise<T>((resolve) => {
    const handle = ctx.io.rawInput((key: string) => {
      if (key === '\x1b[A' || key === 'k') {
        cursor = (cursor - 1 + options.options.length) % options.options.length;
        clampScroll();
        clearRender(); render();
      } else if (key === '\x1b[B' || key === 'j') {
        cursor = (cursor + 1) % options.options.length;
        clampScroll();
        clearRender(); render();
      } else if (key === '\r' || key === '\n') {
        handle.dispose(); cleanup(); resolve(options.options[cursor]!.value);
      } else if (key === '\x03' || key === '\x1b') {
        // Note: bare \x1b may false-trigger on slow connections where escape
        // sequences arrive as separate bytes. Timer-based disambiguation is a
        // separate future improvement.
        const fallbackValue = options.defaultValue ?? options.options[0]!.value;
        // Object.is uses reference equality — object-typed values must be the
        // exact same reference to match, not merely structurally equivalent.
        const fallbackOption = options.options.find((opt) => Object.is(opt.value, fallbackValue));
        handle.dispose(); cleanup(fallbackOption?.label); resolve(fallbackValue);
      }
    });
  });
}
