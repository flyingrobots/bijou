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

import { createSurface, stringToSurface, type Surface } from '@flyingrobots/bijou';
import {
  type ScrollState,
  viewport,
  viewportSurface,
  createScrollState,
  scrollBy,
  scrollTo,
  scrollToTop,
  scrollToBottom,
  pageDown,
  pageUp,
} from './viewport.js';
import { createKeyMap, type KeyMap } from './keybindings.js';

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
export function pagerSetContent(state: PagerState, content: string): PagerState {
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
  });

  if (!showStatus) return body;

  const currentLine = clampedY + 1;
  const totalLines = state.scroll.totalLines;
  const status = `  Line ${currentLine}/${totalLines}`;

  return body + '\n' + status;
}

/**
 * Render the pager directly into a surface.
 *
 * Pairs with {@link createPagerStateForSurface} so already-rendered pane
 * content can stay on the structured surface path instead of dropping back
 * through the string viewport helper.
 */
export function pagerSurface(
  content: Surface,
  state: PagerState,
  options?: PagerRenderOptions,
): Surface {
  const showScrollbar = options?.showScrollbar ?? true;
  const showStatus = options?.showStatus ?? true;
  const safeWidth = Math.max(0, Math.floor(state.width));
  const safeHeight = Math.max(0, Math.floor(state.height));

  if (safeWidth === 0 || safeHeight === 0) return createSurface(0, 0);

  const viewportHeight = showStatus
    ? Math.max(1, safeHeight - 1)
    : safeHeight;

  const maxY = Math.max(0, content.height - viewportHeight);
  const clampedY = Math.max(0, Math.min(state.scroll.y, maxY));
  const body = viewportSurface({
    width: safeWidth,
    height: viewportHeight,
    content,
    scrollY: clampedY,
    showScrollbar,
  });

  if (!showStatus) return body;

  const currentLine = clampedY + 1;
  const totalLines = content.height;
  const status = stringToSurface(`  Line ${currentLine}/${totalLines}`, safeWidth, 1);
  const result = createSurface(safeWidth, safeHeight, { char: ' ', empty: false });
  result.blit(body, 0, 0);
  result.blit(status, 0, safeHeight - 1);
  return result;
}

// ---------------------------------------------------------------------------
// Convenience keymap
// ---------------------------------------------------------------------------

/**
 * Create a preconfigured KeyMap for pager navigation.
 *
 * The caller provides their own message types for each action:
 * ```ts
 * const keys = pagerKeyMap({
 *   scrollUp: { type: 'scroll', dy: -1 },
 *   scrollDown: { type: 'scroll', dy: 1 },
 *   pageUp: { type: 'page-up' },
 *   pageDown: { type: 'page-down' },
 *   top: { type: 'top' },
 *   bottom: { type: 'bottom' },
 *   quit: { type: 'quit' },
 * });
 * ```
 *
 * @template Msg - Application message type dispatched by key bindings.
 * @param actions - Map of navigation actions to message values.
 * @returns Preconfigured key map with vim-style pager bindings.
 */
export function pagerKeyMap<Msg>(actions: {
  scrollUp: Msg;
  scrollDown: Msg;
  pageUp: Msg;
  pageDown: Msg;
  top: Msg;
  bottom: Msg;
  quit: Msg;
}): KeyMap<Msg> {
  return createKeyMap<Msg>()
    .group('Scroll', (g) => g
      .bind('k', 'Up', actions.scrollUp)
      .bind('up', 'Up', actions.scrollUp)
      .bind('j', 'Down', actions.scrollDown)
      .bind('down', 'Down', actions.scrollDown)
      .bind('u', 'Page up', actions.pageUp)
      .bind('pageup', 'Page up', actions.pageUp)
      .bind('d', 'Page down', actions.pageDown)
      .bind('pagedown', 'Page down', actions.pageDown)
      .bind('g', 'Top', actions.top)
      .bind('shift+g', 'Bottom', actions.bottom),
    )
    .bind('q', 'Quit', actions.quit)
    .bind('ctrl+c', 'Quit', actions.quit);
}
