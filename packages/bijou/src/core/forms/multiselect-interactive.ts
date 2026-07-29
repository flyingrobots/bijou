import type { BijouContext } from '../../ports/context.js';
import { sanitizePositiveInt } from '../numeric.js';
import {
  clampScroll,
  createBoldFn,
  createStyledFn,
  formatFormTitle,
  handleVerticalNav,
  isKey,
  subscribeFormKeyInput,
  terminalRenderer,
} from './form-utils.js';
import type { MultiselectOptions } from './multiselect.js';
import type { SelectOption } from './types.js';

function optionAt<T>(
  options: readonly SelectOption<T>[],
  index: number,
): SelectOption<T> {
  const option = options[index];
  if (option === undefined) {
    throw new Error('multiselect option index out of range');
  }
  return option;
}

export async function interactiveMultiselect<T>(
  options: MultiselectOptions<T>,
  ctx: BijouContext,
): Promise<T[]> {
  const noColor = ctx.theme.noColor;
  const styledFn = createStyledFn(ctx);
  const boldFn = createBoldFn(ctx);
  const term = terminalRenderer(ctx);
  const maxVisible = sanitizePositiveInt(options.maxVisible, 7);

  let cursor = 0;
  let scrollOffset = 0;
  const selected = new Set<number>();

  if (options.defaultValues !== undefined) {
    for (let i = 0; i < options.options.length; i++) {
      if (
        options.defaultValues.some((value) =>
          Object.is(value, optionAt(options.options, i).value)
        )
      ) {
        selected.add(i);
      }
    }
  }

  const visibleOptions = (): SelectOption<T>[] =>
    options.options.slice(scrollOffset, scrollOffset + maxVisible);
  const renderLineCount = (): number =>
    1 + Math.min(options.options.length, maxVisible);

  function render(): void {
    const label = formatFormTitle(options.title, ctx);
    term.hideCursor();
    const hint = styledFn(
      ctx.semantic('muted'),
      '(space to toggle, enter to confirm)',
    );
    term.writeLine(`${label}  ${hint}`);

    const visible = visibleOptions();
    for (let i = 0; i < visible.length; i++) {
      const globalIndex = scrollOffset + i;
      const opt = optionAt(visible, i);
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

  function clearRender(): void {
    term.moveUp(renderLineCount());
  }

  function cleanup(): void {
    clearRender();
    term.clearBlock(renderLineCount());
    const selectedLabels = [...selected]
      .sort()
      .map((i) => optionAt(options.options, i).label)
      .join(', ');
    const label =
      formatFormTitle(options.title, ctx) +
      ' ' +
      styledFn(ctx.semantic('info'), selectedLabels);
    ctx.io.write(`\x1b[K${label}\n`);
    term.showCursor();
  }

  render();
  return new Promise<T[]>((resolve) => {
    const handle = subscribeFormKeyInput(ctx, (key) => {
      const next = handleVerticalNav(key, cursor, options.options.length);
      if (next !== null) {
        cursor = next;
        scrollOffset = clampScroll(
          cursor,
          scrollOffset,
          maxVisible,
          options.options.length,
        );
        clearRender();
        render();
      } else if (isKey(key, 'space')) {
        if (selected.has(cursor)) selected.delete(cursor);
        else selected.add(cursor);
        clearRender();
        render();
      } else if (isKey(key, 'enter')) {
        handle.dispose();
        cleanup();
        resolve(
          [...selected]
            .sort()
            .map((i) => optionAt(options.options, i).value),
        );
      } else if (
        isKey(key, 'c', { ctrl: true }) ||
        isKey(key, 'escape')
      ) {
        selected.clear();
        handle.dispose();
        cleanup();
        resolve([]);
      }
    });
  });
}
