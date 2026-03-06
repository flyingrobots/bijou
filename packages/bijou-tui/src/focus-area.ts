/**
 * Focus area building block — a scrollable pane with a colored left gutter.
 *
 * Wraps `viewport()` and prepends a styled gutter character (`▎`) to each
 * line indicating focus state: bright accent when focused, muted when unfocused.
 *
 * Follows the building block pattern: immutable state + pure transformers +
 * pure render + convenience keymap factory.
 *
 * ```ts
 * // In TEA init:
 * const fa = createFocusAreaState({ content, width: 60, height: 20 });
 *
 * // In TEA view:
 * const output = focusArea(fa, { focused: true, ctx });
 *
 * // In TEA update:
 * case 'scroll-down':
 *   return [{ ...model, fa: focusAreaScrollBy(model.fa, 1) }, []];
 * ```
 */

import type { BijouContext, TokenValue } from '@flyingrobots/bijou';
import { renderByMode } from '@flyingrobots/bijou';
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
  scrollByX,
  scrollToX,
} from './viewport.js';
import { createKeyMap, type KeyMap } from './keybindings.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Horizontal overflow behavior. */
export type OverflowX = 'scroll' | 'hidden';

/** Immutable state for the focus area widget. */
export interface FocusAreaState {
  /** Full text content displayed in the focus area. */
  readonly content: string;
  /** Underlying scroll position state. */
  readonly scroll: ScrollState;
  /** Total width in columns (including gutter). */
  readonly width: number;
  /** Total height in rows. */
  readonly height: number;
  /** Horizontal overflow behavior. */
  readonly overflowX: OverflowX;
}

/** Options for creating a new focus area state. */
export interface FocusAreaOptions {
  /** Full text content to display. */
  readonly content: string;
  /** Total width in columns (including gutter). */
  readonly width: number;
  /** Total height in rows. */
  readonly height: number;
  /** Horizontal overflow behavior. Default: `'hidden'`. */
  readonly overflowX?: OverflowX;
}

/** Options for rendering the focus area view. */
export interface FocusAreaRenderOptions {
  /** Whether the pane is currently focused. Default: `true`. */
  readonly focused?: boolean;
  /** Token for the focused gutter. Default: `theme.semantic.accent`. */
  readonly focusedGutterToken?: TokenValue;
  /** Token for the unfocused gutter. Default: `theme.semantic.muted`. */
  readonly unfocusedGutterToken?: TokenValue;
  /** Show a scrollbar track on the right edge. Default: `true`. */
  readonly showScrollbar?: boolean;
  /** Bijou context for styling and mode detection. */
  readonly ctx?: BijouContext;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Gutter character: left one quarter block (U+258E). */
const GUTTER_CHAR = '▎';

// ---------------------------------------------------------------------------
// State creation
// ---------------------------------------------------------------------------

/**
 * Create initial focus area state for the given content and dimensions.
 *
 * The viewport width is `width - 1` to account for the gutter column.
 * When `overflowX` is `'scroll'`, horizontal scroll bounds are computed
 * from the widest content line.
 *
 * @param options - Content, width, height, and overflow for the focus area.
 * @returns Fresh focus area state with scroll at the top-left.
 */
export function createFocusAreaState(options: FocusAreaOptions): FocusAreaState {
  const { content, overflowX = 'hidden' } = options;
  // Clamp dimensions to at least 1
  const width = Math.max(1, options.width);
  const height = Math.max(1, options.height);
  // Gutter consumes 1 column; scrollbar consumes 1 more when visible
  const contentWidth = Math.max(1, width - 1);
  const totalLines = content.split('\n').length;
  const hasScrollbar = totalLines > height;
  const scrollableWidth = hasScrollbar ? Math.max(1, contentWidth - 1) : contentWidth;
  const viewportWidth = overflowX === 'scroll' ? scrollableWidth : undefined;
  return {
    content,
    scroll: createScrollState(content, height, viewportWidth),
    width,
    height,
    overflowX,
  };
}

// ---------------------------------------------------------------------------
// State transformers
// ---------------------------------------------------------------------------

/**
 * Scroll vertically by a relative amount.
 *
 * @param state - Current focus area state.
 * @param dy - Relative vertical offset (positive = down).
 * @returns Updated state with new scroll position.
 */
export function focusAreaScrollBy(state: FocusAreaState, dy: number): FocusAreaState {
  return { ...state, scroll: scrollBy(state.scroll, dy) };
}

/**
 * Scroll vertically to an absolute position.
 *
 * @param state - Current focus area state.
 * @param y - Absolute vertical offset (0-based).
 * @returns Updated state with new scroll position.
 */
export function focusAreaScrollTo(state: FocusAreaState, y: number): FocusAreaState {
  return { ...state, scroll: scrollTo(state.scroll, y) };
}

/**
 * Scroll to the first line.
 *
 * @param state - Current focus area state.
 * @returns Updated state scrolled to the top.
 */
export function focusAreaScrollToTop(state: FocusAreaState): FocusAreaState {
  return { ...state, scroll: scrollToTop(state.scroll) };
}

/**
 * Scroll to the last line.
 *
 * @param state - Current focus area state.
 * @returns Updated state scrolled to the bottom.
 */
export function focusAreaScrollToBottom(state: FocusAreaState): FocusAreaState {
  return { ...state, scroll: scrollToBottom(state.scroll) };
}

/**
 * Page down (one viewport height).
 *
 * @param state - Current focus area state.
 * @returns Updated state advanced by one page.
 */
export function focusAreaPageDown(state: FocusAreaState): FocusAreaState {
  return { ...state, scroll: pageDown(state.scroll) };
}

/**
 * Page up (one viewport height).
 *
 * @param state - Current focus area state.
 * @returns Updated state moved back by one page.
 */
export function focusAreaPageUp(state: FocusAreaState): FocusAreaState {
  return { ...state, scroll: pageUp(state.scroll) };
}

/**
 * Scroll horizontally by a relative amount.
 * No-op when `overflowX` is `'hidden'`.
 *
 * @param state - Current focus area state.
 * @param dx - Relative horizontal offset (positive = right).
 * @returns Updated state with new horizontal scroll position.
 */
export function focusAreaScrollByX(state: FocusAreaState, dx: number): FocusAreaState {
  if (state.overflowX === 'hidden') return state;
  return { ...state, scroll: scrollByX(state.scroll, dx) };
}

/**
 * Scroll horizontally to an absolute position.
 * No-op when `overflowX` is `'hidden'`.
 *
 * @param state - Current focus area state.
 * @param x - Absolute horizontal offset (0-based).
 * @returns Updated state with new horizontal scroll position.
 */
export function focusAreaScrollToX(state: FocusAreaState, x: number): FocusAreaState {
  if (state.overflowX === 'hidden') return state;
  return { ...state, scroll: scrollToX(state.scroll, x) };
}

/**
 * Update content while preserving scroll position (clamped).
 *
 * @param state - Current focus area state.
 * @param content - New text content to display.
 * @returns Updated state with new content and clamped scroll position.
 */
export function focusAreaSetContent(state: FocusAreaState, content: string): FocusAreaState {
  const contentWidth = Math.max(1, state.width - 1);
  const totalLines = content.split('\n').length;
  const hasScrollbar = totalLines > state.height;
  const scrollableWidth = hasScrollbar ? Math.max(1, contentWidth - 1) : contentWidth;
  const viewportWidth = state.overflowX === 'scroll' ? scrollableWidth : undefined;
  const newScroll = createScrollState(content, state.height, viewportWidth);
  const clampedY = Math.min(state.scroll.y, newScroll.maxY);
  const clampedX = Math.min(state.scroll.x, newScroll.maxX);
  return {
    ...state,
    content,
    scroll: { ...newScroll, y: clampedY, x: clampedX },
  };
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

/**
 * Render the focus area — viewport content with a colored left gutter.
 *
 * The gutter character (`▎`) is styled based on focus state:
 * - Focused: `focusedGutterToken` (default: `theme.semantic.accent`)
 * - Unfocused: `unfocusedGutterToken` (default: `theme.semantic.muted`)
 * - Static mode: unstyled gutter
 * - Pipe / accessible mode: no gutter (full width to content)
 *
 * @param state - Current focus area state.
 * @param options - Rendering options (focus, tokens, scrollbar, ctx).
 * @returns Rendered focus area string.
 */
export function focusArea(state: FocusAreaState, options?: FocusAreaRenderOptions): string {
  const focused = options?.focused ?? true;
  const showScrollbar = options?.showScrollbar ?? true;
  const ctx = options?.ctx;
  const mode = ctx?.mode ?? 'interactive';

  // Pipe and accessible modes: no gutter, full width to content
  const hasGutter = mode !== 'pipe' && mode !== 'accessible';
  const contentWidth = hasGutter ? Math.max(1, state.width - 1) : state.width;

  // Clamp scrollX to render-time content width (may differ from state-time
  // width when pipe/accessible mode removes the gutter)
  let scrollX: number | undefined;
  if (state.overflowX === 'scroll') {
    const maxRenderX = Math.max(0, state.scroll.maxX + (contentWidth < state.width ? 0 : 1));
    scrollX = Math.min(state.scroll.x, maxRenderX);
  }

  const body = viewport({
    width: contentWidth,
    height: state.height,
    content: state.content,
    scrollY: state.scroll.y,
    scrollX,
    showScrollbar,
  });

  if (!hasGutter) return body;

  // Determine gutter string
  const gutter = resolveGutter(focused, ctx, options);

  // Prepend gutter to each line
  const lines = body.split('\n');
  return lines.map((line) => gutter + line).join('\n');
}

/**
 * Resolve the styled gutter string based on focus state and context.
 */
function resolveGutter(
  focused: boolean,
  ctx: BijouContext | undefined,
  options: FocusAreaRenderOptions | undefined,
): string {
  if (!ctx) return GUTTER_CHAR;

  return renderByMode(ctx.mode, {
    static: () => GUTTER_CHAR,
    interactive: () => {
      const token = focused
        ? (options?.focusedGutterToken ?? ctx.semantic('accent'))
        : (options?.unfocusedGutterToken ?? ctx.semantic('muted'));

      return ctx.style.styled(token, GUTTER_CHAR);
    },
  }, options);
}

// ---------------------------------------------------------------------------
// Convenience keymap
// ---------------------------------------------------------------------------

/**
 * Create a preconfigured KeyMap for focus area navigation.
 *
 * Arrow keys are intentionally excluded — reserved for content-specific
 * navigation (e.g., DAG node selection).
 *
 * @template Msg - Application message type dispatched by key bindings.
 * @param actions - Map of navigation actions to message values.
 * @returns Preconfigured key map with vim-style scroll bindings.
 */
export function focusAreaKeyMap<Msg>(actions: {
  scrollUp: Msg;
  scrollDown: Msg;
  pageUp: Msg;
  pageDown: Msg;
  top: Msg;
  bottom: Msg;
  scrollLeft?: Msg;
  scrollRight?: Msg;
}): KeyMap<Msg> {
  const km = createKeyMap<Msg>()
    .group('Scroll', (g) => {
      g.bind('j', 'Down', actions.scrollDown)
        .bind('k', 'Up', actions.scrollUp)
        .bind('d', 'Page down', actions.pageDown)
        .bind('u', 'Page up', actions.pageUp)
        .bind('g', 'Top', actions.top)
        .bind('shift+g', 'Bottom', actions.bottom);
      if (actions.scrollLeft !== undefined) {
        g.bind('h', 'Scroll left', actions.scrollLeft);
      }
      if (actions.scrollRight !== undefined) {
        g.bind('l', 'Scroll right', actions.scrollRight);
      }
      return g;
    });
  return km;
}
