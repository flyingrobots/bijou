/**
 * Interactive filter select UI with real-time search and vim-style modes.
 *
 * Starts in **normal mode** where `j`/`k` navigate and any printable character
 * (except `j`/`k`) switches to insert mode and types the character. Press `/`
 * to enter insert mode without typing. In **insert mode**, all keys are
 * printable (including `j`/`k`), arrow keys navigate, and Escape returns to
 * normal mode. Ctrl+C cancels from either mode; Escape in normal mode cancels.
 */

import type { BijouContext } from '../../ports/context.js';
import type { FilterOptions } from './filter-options.js';
import { isKey, isPrintableKey, subscribeFormKeyInput } from './form-utils.js';
import { createFilterController } from './filter-controller.js';

export type { FilterOption, FilterOptions } from './filter-options.js';
export { defaultMatch } from './filter-match.js';

/**
 * Render a keyboard-navigable filter select with vim-style normal/insert modes.
 *
 * Starts in normal mode: `j`/`k` navigate, `/` enters insert mode, any other
 * printable enters insert mode and types the character. In insert mode, all keys
 * are printable, arrow keys navigate, Escape returns to normal mode. Enter
 * confirms from either mode, Ctrl+C cancels from either mode, Escape in normal
 * mode cancels.
 *
 * @param options - Filter field configuration.
 * @param ctx - Bijou context.
 * @returns The value of the selected (or default/first) option.
 */
export async function interactiveFilter<T>(options: FilterOptions<T>, ctx: BijouContext): Promise<T> {
  const firstOption = options.options[0];
  if (firstOption === undefined) {
    throw new Error('[bijou] filter(): options array must contain at least one option');
  }
  const { state, applyFilter, renderLineCount, clearAndRerender, cleanup, navigateUp, navigateDown, typeChar, switchMode, hideCursor, render } = createFilterController(options, ctx);

  hideCursor();
  render();

  return new Promise<T>((resolve) => {
    const handle = subscribeFormKeyInput(ctx, (key) => {
      // ── Mode-independent ───────────────────────────────────
      if (isKey(key, 'enter')) {
        handle.dispose();
        const selected = state.filtered[state.cursor];
        const resolvedLabel = selected ? selected.label : '(none)';
        cleanup(resolvedLabel);
        resolve(state.filtered[state.cursor]?.value ?? options.defaultValue ?? firstOption.value);
        return;
      }

      if (isKey(key, 'c', { ctrl: true })) {
        const fallbackValue = options.defaultValue ?? firstOption.value;
        const fallbackOption = options.options.find((opt) => Object.is(opt.value, fallbackValue));
        handle.dispose();
        cleanup(fallbackOption?.label ?? '(none)');
        resolve(fallbackValue);
        return;
      }

      // ── Normal mode ────────────────────────────────────────
      if (state.mode === 'normal') {
        if (isKey(key, 'escape')) {
          // Escape in normal mode — cancel
          // TODO: bare \x1b may false-trigger on slow connections where escape
          // sequences arrive as separate bytes. Timer-based disambiguation is a
          // shared debt with textarea-editor.ts — unify in a future PR.
          const fallbackValue = options.defaultValue ?? firstOption.value;
          const fallbackOption = options.options.find((opt) => Object.is(opt.value, fallbackValue));
          handle.dispose();
          cleanup(fallbackOption?.label ?? '(none)');
          resolve(fallbackValue);
          return;
        }

        if (key.text === 'j' || isKey(key, 'down')) {
          navigateDown();
          return;
        }

        if (key.text === 'k' || isKey(key, 'up')) {
          navigateUp();
          return;
        }

        if (key.text === '/') {
          // Enter insert mode without typing
          switchMode('insert');
          return;
        }

        // Any other printable — enter insert mode and type the char
        if (isPrintableKey(key)) {
          state.mode = 'insert';
          typeChar(key.text);
          return;
        }

        return;
      }

      // ── Insert mode ────────────────────────────────────────
      if (isKey(key, 'escape')) {
        // Escape in insert mode — return to normal
        switchMode('normal');
        return;
      }

      if (isKey(key, 'up')) {
        navigateUp();
        return;
      }

      if (isKey(key, 'down')) {
        navigateDown();
        return;
      }

      if (isKey(key, 'backspace')) {
        if (state.query.length > 0) {
          const prevLineCount = renderLineCount();
          state.query = state.query.slice(0, -1);
          applyFilter();
          clearAndRerender(prevLineCount);
        }
        return;
      }

      // Printable character (all printable keys including j/k)
      if (isPrintableKey(key)) {
        typeChar(key.text);
      }
    });
  });
}
