import type { BijouContext } from '@flyingrobots/bijou';
import { adjustScroll } from './browsable-list.part01.js';
import type { BrowsableListItemRenderer, BrowsableListRenderOptions, BrowsableListState } from './browsable-list.part01.js';

// ---------------------------------------------------------------------------
// State transformers
// ---------------------------------------------------------------------------

/**
 * Move focus to the next item (wraps around).
 *
 * @template T - Type of each item's value payload.
 * @param state - Current list state.
 * @returns Updated list state with focus on the next item.
 */
export function listFocusNext<T>(state: BrowsableListState<T>): BrowsableListState<T> {
  if (state.items.length === 0) return state;
  const focusIndex = (state.focusIndex + 1) % state.items.length;
  return { ...state, focusIndex, scrollY: adjustScroll(focusIndex, state.scrollY, state.height, state.items.length) };
}

/**
 * Move focus to the previous item (wraps around).
 *
 * @template T - Type of each item's value payload.
 * @param state - Current list state.
 * @returns Updated list state with focus on the previous item.
 */
export function listFocusPrev<T>(state: BrowsableListState<T>): BrowsableListState<T> {
  if (state.items.length === 0) return state;
  const focusIndex = (state.focusIndex - 1 + state.items.length) % state.items.length;
  return { ...state, focusIndex, scrollY: adjustScroll(focusIndex, state.scrollY, state.height, state.items.length) };
}

/**
 * Move focus down by one page (clamps to last item).
 *
 * @template T - Type of each item's value payload.
 * @param state - Current list state.
 * @returns Updated list state with focus advanced by one page.
 */
export function listPageDown<T>(state: BrowsableListState<T>): BrowsableListState<T> {
  if (state.items.length === 0) return state;
  const focusIndex = Math.min(state.focusIndex + state.height, state.items.length - 1);
  return { ...state, focusIndex, scrollY: adjustScroll(focusIndex, state.scrollY, state.height, state.items.length) };
}

/**
 * Move focus up by one page (clamps to first item).
 *
 * @template T - Type of each item's value payload.
 * @param state - Current list state.
 * @returns Updated list state with focus moved back by one page.
 */
export function listPageUp<T>(state: BrowsableListState<T>): BrowsableListState<T> {
  if (state.items.length === 0) return state;
  const focusIndex = Math.max(state.focusIndex - state.height, 0);
  return { ...state, focusIndex, scrollY: adjustScroll(focusIndex, state.scrollY, state.height, state.items.length) };
}

function renderBrowsableListLines<T>(
  state: BrowsableListState<T>,
  indicator: string,
  ctx?: BijouContext,
  renderItem?: BrowsableListItemRenderer<T>,
): string[] {
  const pad = ' '.repeat(indicator.length);
  return state.items.map((item, index) => {
    if (renderItem) {
      return renderItem({
        item,
        index,
        focused: index === state.focusIndex,
        ctx,
      });
    }
    const prefix = index === state.focusIndex ? indicator : pad;
    const desc = item.description == null
      ? ''
      : ctx
        ? ` ${ctx.style.styled(ctx.semantic('muted'), `\u2014 ${item.description}`)}`
        : ` \u2014 ${item.description}`;
    return `${prefix} ${item.label}${desc}`;
  });
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

/**
 * Render the browsable list — visible items within the viewport with a
 * focus indicator on the currently focused item.
 *
 * Items with a `description` field render as `label — description`.
 *
 * @template T - Type of each item's value payload.
 * @param state - Current list state.
 * @param options - Rendering options (focus indicator, context).
 * @returns Rendered list string with focus indicator on the active item.
 */
export function browsableList<T>(
  state: BrowsableListState<T>,
  options?: BrowsableListRenderOptions<T>,
): string {
  if (state.items.length === 0) return '';

  const indicator = options?.focusIndicator ?? '\u25b8';
  return renderBrowsableListLines(state, indicator, options?.ctx, options?.renderItem)
    .slice(state.scrollY, state.scrollY + state.height)
    .join('\n');
}

export { renderBrowsableListLines };
