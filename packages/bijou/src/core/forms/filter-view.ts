import { CLEAR_LINE } from '../ansi.js';
import type { BijouContext } from '../../ports/context.js';
import type { FilterOption, FilterOptions, FilterState } from './filter-options.js';
import { formatFormTitle, terminalRenderer, createStyledFn, createBoldFn } from './form-utils.js';

export function createFilterView<T>(options: FilterOptions<T>, ctx: BijouContext, state: FilterState<T>, maxVisible: number) {
  const noColor = ctx.theme.noColor;
  const styledFn = createStyledFn(ctx);
  const boldFn = createBoldFn(ctx);
  const term = terminalRenderer(ctx);

  /** Return the slice of filtered options currently visible on screen. */
  function visibleItems(): FilterOption<T>[] {
    return state.filtered.slice(state.scrollOffset, state.scrollOffset + maxVisible);
  }

  /** Calculate the total terminal lines occupied by the current render. */
  function renderLineCount(): number {
    return 2 + Math.min(state.filtered.length, maxVisible) + 1; // header + filter input + items + status
  }

  /** Write the filter UI (title, input, option list, status) to the terminal. */
  function render(): void {
    const label = formatFormTitle(options.title, ctx);
    term.writeLine(label);

    // Filter input with mode indicator (: normal, / insert)
    const indicator = state.mode === 'insert' ? '/' : ':';
    const filterDisplay = state.query || (options.placeholder ? styledFn(ctx.semantic('muted'), options.placeholder) : '');
    ctx.io.write(`${CLEAR_LINE}  ${styledFn(ctx.semantic('info'), indicator)} ${filterDisplay}\n`);

    const vis = visibleItems();
    for (let i = 0; i < vis.length; i++) {
      const opt = vis[i];
      if (opt === undefined) continue;
      const isCurrent = state.scrollOffset + i === state.cursor;
      const prefix = isCurrent ? '❯' : ' ';
      if (isCurrent && !noColor) {
        ctx.io.write(`${CLEAR_LINE}  ${styledFn(ctx.semantic('info'), prefix)} ${boldFn(opt.label)}\n`);
      } else {
        ctx.io.write(`${CLEAR_LINE}  ${prefix} ${opt.label}\n`);
      }
    }

    const status = `${String(state.filtered.length)}/${String(options.options.length)} items`;
    ctx.io.write(`${CLEAR_LINE}  ${styledFn(ctx.semantic('muted'), status)}\n`);
  }

  /** Move the cursor up to overwrite the previous render. */
  function clearRender(lineCount: number): void {
    term.moveUp(lineCount);
  }

  /** Erase the previous render block and draw fresh output. */
  function clearAndRerender(prevLineCount: number): void {
    clearRender(prevLineCount);
    term.clearBlock(prevLineCount);
    render();
  }

  /** Erase the full UI and print the final selection summary line. */
  function cleanup(selectedLabel: string): void {
    const total = renderLineCount();
    clearRender(total);
    term.clearBlock(total);

    const label = formatFormTitle(options.title, ctx) + ' ' + styledFn(ctx.semantic('info'), selectedLabel);
    ctx.io.write(`${CLEAR_LINE}${label}\n`);
    term.showCursor();
  }

  return { renderLineCount, render, clearRender, clearAndRerender, cleanup, hideCursor: () => { term.hideCursor(); } };
}
