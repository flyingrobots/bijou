/**
 * Browsable list building block — a scrollable, navigable list with focus tracking.
 *
 * Provides state transformers for focus and page navigation, a pure render
 * function with viewport clipping, and a convenience keymap for vim-style
 * navigation.
 *
 * ```ts
 * // In TEA init:
 * const listState = createBrowsableListState({ items, height: 10 });
 *
 * // In TEA view:
 * const output = browsableList(model.listState);
 *
 * // In TEA update:
 * case 'focus-next':
 *   return [{ ...model, listState: listFocusNext(model.listState) }, []];
 * case 'select':
 *   const selected = model.listState.items[model.listState.focusIndex];
 *   // handle selection...
 * ```
 */

export type { BrowsableListItem, BrowsableListItemRenderer, BrowsableListOptions, BrowsableListRenderItemState, BrowsableListRenderOptions, BrowsableListState, BrowsableListSurfaceOptions } from './browsable-list.part01.js';
export { createBrowsableListState } from './browsable-list.part01.js';
export { browsableList, listFocusNext, listFocusPrev, listPageDown, listPageUp } from './browsable-list.part02.js';
export { browsableListKeyMap, browsableListSurface } from './browsable-list.part03.js';
