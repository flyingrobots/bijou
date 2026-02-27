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

import {
  type ScrollState,
  viewport,
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

export interface PagerState {
  readonly scroll: ScrollState;
  readonly content: string;
  readonly width: number;
  readonly height: number;
}

export interface PagerOptions {
  readonly content: string;
  readonly width: number;
  readonly height: number;
}

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

// ---------------------------------------------------------------------------
// State transformers
// ---------------------------------------------------------------------------

/** Scroll by a relative number of lines. */
export function pagerScrollBy(state: PagerState, dy: number): PagerState {
  return { ...state, scroll: scrollBy(state.scroll, dy) };
}

/** Scroll to an absolute line. */
export function pagerScrollTo(state: PagerState, y: number): PagerState {
  return { ...state, scroll: scrollTo(state.scroll, y) };
}

/** Scroll to the first line. */
export function pagerScrollToTop(state: PagerState): PagerState {
  return { ...state, scroll: scrollToTop(state.scroll) };
}

/** Scroll to the last line. */
export function pagerScrollToBottom(state: PagerState): PagerState {
  return { ...state, scroll: scrollToBottom(state.scroll) };
}

/** Page down (one viewport height). */
export function pagerPageDown(state: PagerState): PagerState {
  return { ...state, scroll: pageDown(state.scroll) };
}

/** Page up (one viewport height). */
export function pagerPageUp(state: PagerState): PagerState {
  return { ...state, scroll: pageUp(state.scroll) };
}

/** Update content while preserving scroll position (clamped). */
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
