import type { SelectOption } from './types.js';
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
import type { SelectOptions } from './select-types.js';

export type { SelectOptions } from './select-types.js';

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

function optionAt<T>(options: readonly SelectOption<T>[], index: number): SelectOption<T> {
  const option = options[index];
  if (option === undefined) throw new Error('select option index out of range');
  return option;
}

async function numberedSelect<T>(options: SelectOptions<T>, ctx: BijouContext): Promise<T> {
  ctx.io.write(formatFormTitle(options.title, ctx) + '\n');
  renderNumberedOptions(options.options, ctx);

  const prompt = ctx.mode === 'accessible' ? 'Enter number: ' : '> ';
  const answer = await ctx.io.question(prompt);

  const idx = parseInt(answer.trim(), 10) - 1;
  if (idx >= 0 && idx < options.options.length) {
    return optionAt(options.options, idx).value;
  }
  return options.defaultValue ?? optionAt(options.options, 0).value;
}

async function interactiveSelect<T>(options: SelectOptions<T>, ctx: BijouContext): Promise<T> {
  const noColor = ctx.theme.noColor;
  const styledFn = createStyledFn(ctx);
  const boldFn = createBoldFn(ctx);
  const term = terminalRenderer(ctx);
  const maxVisible = sanitizePositiveInt(options.maxVisible, 7);

  let cursor = 0;
  let scrollOffset = 0;

  function visibleOptions(): SelectOption<T>[] {
    return options.options.slice(scrollOffset, scrollOffset + maxVisible);
  }

  function renderLineCount(): number {
    return 1 + Math.min(options.options.length, maxVisible);
  }

  function render(): void {
    const label = formatFormTitle(options.title, ctx);
    term.hideCursor();
    term.writeLine(label);

    const visible = visibleOptions();
    for (let i = 0; i < visible.length; i++) {
      const globalIndex = scrollOffset + i;
      const opt = optionAt(visible, i);
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

  function clearRender(): void {
    const totalLines = renderLineCount();
    term.moveUp(totalLines);
  }

  function cleanup(selectedLabel?: string): void {
    clearRender();
    const totalLines = renderLineCount();
    term.clearBlock(totalLines);
    const displayLabel = selectedLabel ?? optionAt(options.options, cursor).label;
    const label = formatFormTitle(options.title, ctx) + ' ' + styledFn(ctx.semantic('info'), displayLabel);
    ctx.io.write(`\x1b[K${label}\n`);
    term.showCursor();
  }

  render();

  return new Promise<T>((resolve) => {
    const handle = subscribeFormKeyInput(ctx, (key) => {
      const next = handleVerticalNav(key, cursor, options.options.length);
      if (next !== null) {
        cursor = next;
        scrollOffset = clampScroll(cursor, scrollOffset, maxVisible, options.options.length);
        clearRender(); render();
      } else if (isKey(key, 'enter')) {
        handle.dispose(); cleanup(); resolve(optionAt(options.options, cursor).value);
      } else if (isKey(key, 'c', { ctrl: true }) || isKey(key, 'escape')) {
        const fallbackValue = options.defaultValue ?? optionAt(options.options, 0).value;
        // Object.is uses reference equality — object-typed values must be the
        // exact same reference to match, not merely structurally equivalent.
        const fallbackOption = options.options.find((opt) => Object.is(opt.value, fallbackValue));
        handle.dispose(); cleanup(fallbackOption?.label); resolve(fallbackValue);
      }
    });
  });
}
