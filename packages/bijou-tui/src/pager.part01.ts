/**
 * Pager building block — a scrollable text viewer with status line.
 *
 * Wraps `viewport()` with a "Line N/M" status indicator and provides
 * a convenience keymap for vim-style scroll navigation.
 *
 * ```ts
 * // In TEA init:
 * const pagerState = createPagerState({ content, width: 80, height: 20 });
 *
 * // In TEA view:
 * const output = pager(model.pagerState);
 *
 * // In TEA update:
 * case 'scroll-down':
 *   return [{ ...model, pagerState: pagerScrollBy(model.pagerState, 1) }, []];
 * ```
 */
import { type Surface } from '@flyingrobots/bijou';
import {
  type ScrollbarMode,
  type ScrollState,
  createScrollState,
  scrollBy,
} from './viewport.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Immutable state for the pager widget. */
export interface PagerState {
  /** Underlying scroll position state. */
  readonly scroll: ScrollState;
  /** Full text content displayed in the pager. */
  readonly content: string;
  /** Available width in columns. */
  readonly width: number;
  /** Total available height in rows (including status line). */
  readonly height: number;
}
/** Options for creating a new pager state. */
export interface PagerOptions {
  /** Full text content to display. */
  readonly content: string;
  /** Available width in columns. */
  readonly width: number;
  /** Total available height in rows (one row reserved for status). */
  readonly height: number;
}
/** Options for rendering the pager view. */
export interface PagerRenderOptions {
  /** Show a scrollbar track on the right edge. Default: true. */
  readonly showScrollbar?: boolean;
  /** Reserve a gutter column or overlay the rightmost content cell. Default: `'gutter'`. */
  readonly scrollbarMode?: ScrollbarMode;
  /** Show a "Line N/M" status line below the viewport. Default: true. */
  readonly showStatus?: boolean;
}
// ---------------------------------------------------------------------------
// State creation
// ---------------------------------------------------------------------------

/**
 * Create initial pager state for the given content and dimensions.
 *
 * The viewport height is `height - 1` when status is shown (the default),
 * reserving one line for the status indicator.
 *
 * @param options - Content, width, and height for the pager.
 * @returns Fresh pager state with scroll at the top.
 */
export function createPagerState(options: PagerOptions): PagerState {
  const { content, width, height } = options;
  const viewportHeight = Math.max(1, height - 1); // reserve 1 for status
  return {
    scroll: createScrollState(content, viewportHeight),
    content,
    width,
    height,
  };
}
/**
 * Create pager state for already-rendered surface content.
 *
 * Uses the surface height directly for scroll bounds so callers can keep
 * pager composition on the `Surface` path without flattening content first.
 */
export function createPagerStateForSurface(
  content: Surface,
  options: Omit<PagerOptions, 'content'>,
): PagerState {
  const { width, height } = options;
  const viewportHeight = Math.max(1, height - 1);
  return {
    scroll: {
      y: 0,
      maxY: Math.max(0, content.height - viewportHeight),
      x: 0,
      maxX: 0,
      totalLines: content.height,
      visibleLines: viewportHeight,
    },
    content: '',
    width,
    height,
  };
}
// ---------------------------------------------------------------------------
// State transformers
// ---------------------------------------------------------------------------

/**
 * Scroll by a relative number of lines.
 *
 * @param state - Current pager state.
 * @param dy - Number of lines to scroll (positive = down, negative = up).
 * @returns Updated pager state with new scroll position.
 */
export function pagerScrollBy(state: PagerState, dy: number): PagerState {
  return { ...state, scroll: scrollBy(state.scroll, dy) };
}
