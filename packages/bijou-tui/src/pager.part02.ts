import {
  viewport,
  createScrollState,
  scrollTo,
  scrollToTop,
  scrollToBottom,
  pageDown,
  pageUp,
} from './viewport.js';
import { type PagerRenderOptions, type PagerState } from './pager.part01.js';

/**
 * Scroll to an absolute line.
 *
 * @param state - Current pager state.
 * @param y - Target line number (zero-based).
 * @returns Updated pager state with new scroll position.
 */
export function pagerScrollTo(state: PagerState, y: number): PagerState {
  return { ...state, scroll: scrollTo(state.scroll, y) };
}
/**
 * Scroll to the first line.
 *
 * @param state - Current pager state.
 * @returns Updated pager state scrolled to the top.
 */
export function pagerScrollToTop(state: PagerState): PagerState {
  return { ...state, scroll: scrollToTop(state.scroll) };
}
/**
 * Scroll to the last line.
 *
 * @param state - Current pager state.
 * @returns Updated pager state scrolled to the bottom.
 */
export function pagerScrollToBottom(state: PagerState): PagerState {
  return { ...state, scroll: scrollToBottom(state.scroll) };
}
/**
 * Page down (one viewport height).
 *
 * @param state - Current pager state.
 * @returns Updated pager state advanced by one page.
 */
export function pagerPageDown(state: PagerState): PagerState {
  return { ...state, scroll: pageDown(state.scroll) };
}
/**
 * Page up (one viewport height).
 *
 * @param state - Current pager state.
 * @returns Updated pager state moved back by one page.
 */
export function pagerPageUp(state: PagerState): PagerState {
  return { ...state, scroll: pageUp(state.scroll) };
}
/**
 * Update content while preserving scroll position (clamped).
 *
 * @param state - Current pager state.
 * @param content - New text content to display.
 * @returns Updated pager state with new content and clamped scroll position.
 */
export function pagerSetContent(
  state: PagerState,
  content: string,
): PagerState {
  const viewportHeight = Math.max(1, state.height - 1);
  const newScroll = createScrollState(content, viewportHeight);
  const clampedY = Math.min(state.scroll.y, newScroll.maxY);
  return {
    ...state,
    content,
    scroll: { ...newScroll, y: clampedY },
  };
}
// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

/**
 * Render the pager — viewport content plus optional status line.
 *
 * @param state - Current pager state.
 * @param options - Rendering options (scrollbar, status line).
 * @returns Rendered pager string with viewport and optional status.
 */
export function pager(state: PagerState, options?: PagerRenderOptions): string {
  const showScrollbar = options?.showScrollbar ?? true;
  const scrollbarMode = options?.scrollbarMode ?? 'gutter';
  const showStatus = options?.showStatus ?? true;

  const viewportHeight = showStatus
    ? Math.max(1, state.height - 1)
    : state.height;

  // Clamp scroll to the active viewport height (which may differ from
  // the height used when creating state if showStatus changed).
  const maxY = Math.max(0, state.scroll.totalLines - viewportHeight);
  const clampedY = Math.max(0, Math.min(state.scroll.y, maxY));

  const body = viewport({
    width: state.width,
    height: viewportHeight,
    content: state.content,
    scrollY: clampedY,
    showScrollbar,
    scrollbarMode,
  });

  if (!showStatus) return body;

  const currentLine = clampedY + 1;
  const totalLines = state.scroll.totalLines;
  const status = `  Line ${String(currentLine)}/${String(totalLines)}`;

  return body + '\n' + status;
}
