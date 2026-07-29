import { createSurface, sanitizePositiveInt, type Surface } from '@flyingrobots/bijou';
import { createKeyMap, type KeyMap } from './keybindings.js';
import { viewportSurface, visibleLength } from './viewport.js';
import { collectionRowsSurface } from './collection-surface.js';
import type { BrowsableListState, BrowsableListSurfaceOptions } from './browsable-list.part01.js';
import { renderBrowsableListLines } from './browsable-list.part02.js';

/**
 * Render the browsable list directly into a viewport-backed `Surface`.
 *
 * This keeps scroll ownership on the shared `viewportSurface()` masking
 * primitive instead of each list carrying bespoke slice logic.
 *
 * @template T - Type of each item's value payload.
 * @param state - Current list state.
 * @param options - Rendering options plus optional fixed width.
 * @returns Surface-sized list viewport using the list height as the visible window.
 */
export function browsableListSurface<T>(
  state: BrowsableListState<T>,
  options?: BrowsableListSurfaceOptions<T>,
): Surface {
  const indicator = options?.focusIndicator ?? '\u25b8';
  const lines = renderBrowsableListLines(
    state,
    indicator,
    options?.ctx,
    options?.renderItem,
  );
  const width = options?.width != null
    ? Math.max(1, sanitizePositiveInt(options.width, 1))
    : Math.max(1, ...lines.map((line) => visibleLength(line)));

  if (lines.length === 0) {
    return createSurface(width, Math.max(1, state.height));
  }

  const content = collectionRowsSurface(lines, {
    width,
    selectedRowIndex: state.focusIndex,
    selectedRowOverflow: options?.focusedRowOverflow,
    ctx: options?.ctx,
  });

  return viewportSurface({
    width,
    height: Math.max(1, state.height),
    content,
    scrollY: state.scrollY,
    showScrollbar: options?.showScrollbar ?? false,
  });
}

// ---------------------------------------------------------------------------
// Convenience keymap
// ---------------------------------------------------------------------------

/**
 * Create a preconfigured KeyMap for browsable list navigation.
 *
 * The caller provides their own message types for each action:
 * ```ts
 * const keys = browsableListKeyMap({
 *   focusNext: { type: 'next' },
 *   focusPrev: { type: 'prev' },
 *   pageDown: { type: 'page-down' },
 *   pageUp: { type: 'page-up' },
 *   select: { type: 'select' },
 *   quit: { type: 'quit' },
 * });
 * ```
 *
 * @template Msg - Application message type dispatched by key bindings.
 * @param actions - Map of navigation actions to message values.
 * @returns Preconfigured key map with vim-style list bindings.
 */
export function browsableListKeyMap<Msg>(actions: {
  focusNext: Msg;
  focusPrev: Msg;
  pageDown: Msg;
  pageUp: Msg;
  select: Msg;
  quit: Msg;
}): KeyMap<Msg> {
  return createKeyMap<Msg>()
    .group('Navigation', (g) => g
      .bind('j', 'Next item', actions.focusNext)
      .bind('down', 'Next item', actions.focusNext)
      .bind('k', 'Previous item', actions.focusPrev)
      .bind('up', 'Previous item', actions.focusPrev)
      .bind('d', 'Page down', actions.pageDown)
      .bind('pagedown', 'Page down', actions.pageDown)
      .bind('u', 'Page up', actions.pageUp)
      .bind('pageup', 'Page up', actions.pageUp),
    )
    .bind('enter', 'Select', actions.select)
    .bind('q', 'Quit', actions.quit)
    .bind('ctrl+c', 'Quit', actions.quit);
}
