import { sanitizePositiveInt, type BijouContext } from '@flyingrobots/bijou';
import type { SelectedRowOverflow } from './collection-surface.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A single item in a browsable list.
 *
 * @template T - Type of the item's value payload.
 */
export interface BrowsableListItem<T = string> {
  /** Display label shown in the list. */
  label: string;
  /** Value payload returned when this item is selected. */
  value: T;
  /** Optional description displayed after the label, rendered as `label — description`. */
  description?: string;
}

/**
 * Readonly state for the browsable list widget.
 *
 * @template T - Type of each item's value payload.
 */
export interface BrowsableListState<T = string> {
  /** All items in the list. */
  readonly items: readonly BrowsableListItem<T>[];
  /** Index of the currently focused item. */
  readonly focusIndex: number;
  /** Vertical scroll offset (first visible item index). */
  readonly scrollY: number;
  /** Maximum number of visible items. */
  readonly height: number;
}

/**
 * Options for creating a new browsable list state.
 *
 * @template T - Type of each item's value payload.
 */
export interface BrowsableListOptions<T = string> {
  /** Items to populate the list. */
  readonly items: readonly BrowsableListItem<T>[];
  /** Maximum number of visible items (default: 10). */
  readonly height?: number;
}

export interface BrowsableListRenderItemState<T> {
  readonly item: BrowsableListItem<T>;
  readonly index: number;
  readonly focused: boolean;
  readonly ctx?: BijouContext;
}

export type BrowsableListItemRenderer<T> = (state: BrowsableListRenderItemState<T>) => string;

/** Options for rendering the browsable list view. */
export interface BrowsableListRenderOptions<T = string> {
  /** Character(s) shown next to the focused item (default: `"\u25b8"`). */
  readonly focusIndicator?: string;
  /** Bijou context for theming and styling. */
  readonly ctx?: BijouContext;
  /** Optional row formatter for custom list chrome. */
  readonly renderItem?: BrowsableListItemRenderer<T>;
}

/** Options for rendering the browsable list into a `Surface`. */
export interface BrowsableListSurfaceOptions<T = string> extends BrowsableListRenderOptions<T> {
  /** Fixed viewport width. Defaults to the widest rendered row. */
  readonly width?: number;
  /** Show a scrollbar track on the right edge. Default: false. */
  readonly showScrollbar?: boolean;
  /** Overflow behavior for the focused row. Defaults to `clip`. */
  readonly focusedRowOverflow?: SelectedRowOverflow;
}

// ---------------------------------------------------------------------------
// State creation
// ---------------------------------------------------------------------------

/**
 * Create initial browsable list state from items and optional height.
 * Focus starts at index 0 with scroll at the top.
 * @template T - Type of each item's value payload.
 * @param options - Items and optional viewport height.
 * @returns Fresh browsable list state with focus at the top.
 */
export function createBrowsableListState<T = string>(
  options: BrowsableListOptions<T>,
): BrowsableListState<T> {
  const height = sanitizePositiveInt(options.height, 10);
  return {
    items: [...options.items],
    focusIndex: 0,
    scrollY: 0,
    height,
  };
}

// ---------------------------------------------------------------------------
// Scroll helper
// ---------------------------------------------------------------------------

/**
 * Clamp scroll position so the focused item stays within the visible window.
 *
 * @param focusIndex - Index of the focused item.
 * @param scrollY - Current scroll offset.
 * @param height - Viewport height in items.
 * @param totalItems - Total number of items.
 * @returns Adjusted scroll offset.
 */
function adjustScroll(focusIndex: number, scrollY: number, height: number, totalItems: number): number {
  let newScrollY = scrollY;
  if (focusIndex < newScrollY) {
    newScrollY = focusIndex;
  } else if (focusIndex >= newScrollY + height) {
    newScrollY = focusIndex - height + 1;
  }
  const maxScroll = Math.max(0, totalItems - height);
  return Math.min(newScrollY, maxScroll);
}

export { adjustScroll };
