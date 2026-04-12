import type { SelectFieldOptions, SelectOption } from './types.js';
import type { BijouContext } from '../../ports/context.js';
import { resolveCtx } from '../resolve-ctx.js';
import {
  formatFormTitle,
  renderNumberedOptions,
  terminalRenderer,
  formDispatch,
  createStyledFn,
  createBoldFn,
  clampScroll,
  handleVerticalNav,
  isKey,
  subscribeFormKeyInput,
} from './form-utils.js';
import { sanitizePositiveInt } from '../numeric.js';

/**
 * Options for the multi-select field.
 *
 * @typeParam T - Type of each option's value.
 */
export interface MultiselectOptions<T = string> extends SelectFieldOptions<T> {
  /** Bijou context for IO, styling, and mode detection. */
  ctx?: BijouContext;
  /** Values to pre-select when the multiselect first renders in interactive mode. */
  defaultValues?: T[];
}

/**
 * Prompt the user to choose zero or more items from a list.
 *
 * Uses arrow-key navigation with space-to-toggle in interactive TTY mode,
 * or a comma-separated numeric input fallback for pipe and accessible modes.
 *
 * @typeParam T - Type of each option's value.
 * @param options - Multiselect field configuration.
 * @returns Array of selected option values.
 */
export async function multiselect<T = string>(options: MultiselectOptions<T>): Promise<T[]> {
  if (options.options.length === 0) return [];

  const ctx = resolveCtx(options.ctx);

  return formDispatch(
    ctx,
    (c) => interactiveMultiselect(options, c),
    (c) => numberedMultiselect(options, c),
  );
}

/**
 * Display options as a numbered list and accept comma-separated numeric input.
 *
 * Used as the fallback for non-interactive or accessible modes.
 *
 * @param options - Multiselect field configuration.
 * @param ctx - Bijou context.
 * @returns Array of selected option values.
 */
async function numberedMultiselect<T>(options: MultiselectOptions<T>, ctx: BijouContext): Promise<T[]> {
  ctx.io.write(formatFormTitle(options.title, ctx) + '\n');
  renderNumberedOptions(options.options, ctx);

  const prompt = ctx.mode === 'accessible'
    ? 'Enter numbers separated by commas: '
    : 'Enter numbers (comma-separated): ';

  const answer = await ctx.io.question(prompt);
  const indices = answer.split(',')
    .map((s) => parseInt(s.trim(), 10) - 1)
    .filter((i) => i >= 0 && i < options.options.length);
  return indices.map((i) => options.options[i]!.value);
}

/**
 * Display a keyboard-navigable multi-select menu using raw terminal input.
 *
 * Supports arrow keys and j/k for navigation, Space to toggle selection,
 * Enter to confirm, Ctrl+C or Escape to cancel (returns empty array).
 *
 * @param options - Multiselect field configuration.
 * @param ctx - Bijou context.
 * @returns Array of selected option values in index order.
 */
async function interactiveMultiselect<T>(options: MultiselectOptions<T>, ctx: BijouContext): Promise<T[]> {
  const noColor = ctx.theme.noColor;
  const styledFn = createStyledFn(ctx);
  const boldFn = createBoldFn(ctx);
  const term = terminalRenderer(ctx);
  const maxVisible = sanitizePositiveInt(options.maxVisible, 7);

  let cursor = 0;
  let scrollOffset = 0;
  const selected = new Set<number>();

  // Pre-select items matching defaultValues (if provided)
  if (options.defaultValues !== undefined) {
    for (let i = 0; i < options.options.length; i++) {
      if (options.defaultValues.some((dv) => Object.is(dv, options.options[i]!.value))) {
        selected.add(i);
      }
    }
  }

  /** Return the slice of options currently visible on screen. */
  function visibleOptions(): SelectOption<T>[] {
    return options.options.slice(scrollOffset, scrollOffset + maxVisible);
  }

  /** Calculate the total terminal lines occupied by the current render. */
  function renderLineCount(): number {
    return 1 + Math.min(options.options.length, maxVisible);
  }

  /** Write the multiselect UI (title, hint, option list) to the terminal. Hides the cursor as a side effect. */
  function render(): void {
    const label = formatFormTitle(options.title, ctx);
    term.hideCursor();
    const hint = styledFn(ctx.semantic('muted'), '(space to toggle, enter to confirm)');
    term.writeLine(`${label}  ${hint}`);

    const visible = visibleOptions();
    for (let i = 0; i < visible.length; i++) {
      const globalIndex = scrollOffset + i;
      const opt = visible[i]!;
      const isCurrent = globalIndex === cursor;
      const isSelected = selected.has(globalIndex);
      const prefix = isCurrent ? '\u276f' : ' ';
      const check = isSelected ? '\u25c9' : '\u25cb';
      const desc = opt.description
        ? styledFn(ctx.semantic('muted'), ` \u2014 ${opt.description}`)
        : '';
      if (isCurrent && !noColor) {
        ctx.io.write(`\x1b[K  ${styledFn(ctx.semantic('info'), prefix)} ${styledFn(ctx.semantic('info'), check)} ${boldFn(opt.label)}${desc}\n`);
      } else if (isSelected && !noColor) {
        ctx.io.write(`\x1b[K  ${prefix} ${styledFn(ctx.status('success'), check)} ${opt.label}${desc}\n`);
      } else {
        ctx.io.write(`\x1b[K  ${prefix} ${check} ${opt.label}${desc}\n`);
      }
    }
  }

  /** Move the cursor up to overwrite the previous render. */
  function clearRender(): void {
    const totalLines = renderLineCount();
    term.moveUp(totalLines);
  }

  /** Erase the full UI, print the final selection summary line, and restore cursor visibility. */
  function cleanup(): void {
    clearRender();
    const totalLines = renderLineCount();
    term.clearBlock(totalLines);
    const selectedLabels = [...selected].sort().map((i) => options.options[i]!.label).join(', ');
    const label = formatFormTitle(options.title, ctx) + ' ' + styledFn(ctx.semantic('info'), selectedLabels);
    ctx.io.write(`\x1b[K${label}\n`);
    term.showCursor();
  }

  render();

  return new Promise<T[]>((resolve) => {
    const handle = subscribeFormKeyInput(ctx, (key) => {
      const next = handleVerticalNav(key, cursor, options.options.length);
      if (next !== null) {
        cursor = next;
        scrollOffset = clampScroll(cursor, scrollOffset, maxVisible, options.options.length);
        clearRender(); render();
      } else if (isKey(key, 'space')) {
        if (selected.has(cursor)) selected.delete(cursor); else selected.add(cursor);
        clearRender(); render();
      } else if (isKey(key, 'enter')) {
        handle.dispose(); cleanup();
        resolve([...selected].sort().map((i) => options.options[i]!.value));
      } else if (isKey(key, 'c', { ctrl: true }) || isKey(key, 'escape')) {
        // Note: bare \x1b may false-trigger on slow connections where escape
        // sequences arrive as separate bytes. Timer-based disambiguation is a
        // separate future improvement.
        selected.clear();
        handle.dispose(); cleanup(); resolve([]);
      }
    });
  });
}
