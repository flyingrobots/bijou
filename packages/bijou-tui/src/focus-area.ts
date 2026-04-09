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

import type { BijouContext, Cell, Surface, PackedSurface, TokenValue } from '@flyingrobots/bijou';
import { createSurface, parseAnsiToSurface, renderByMode } from '@flyingrobots/bijou';
import { parseHex, encodeModifiers } from '@flyingrobots/bijou/perf';
import { resolveBCSSTextToken } from './css/text-style.js';
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
  /** Optional BCSS id for the focus area. */
  readonly id?: string;
  /** Optional BCSS classes for the focus area. */
  readonly classes?: readonly string[];
  /** Bijou context for styling and mode detection. */
  readonly ctx?: BijouContext;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Gutter character: left one quarter block (U+258E). */
const GUTTER_CHAR = '▎';
const EMPTY_CELL: Cell = { char: ' ', empty: false };
const SCROLLBAR_TRACK_CELL: Cell = { char: '│', empty: false };
const SCROLLBAR_THUMB_CELL: Cell = { char: '█', empty: false };
const gutterCellCache = new Map<string, Cell>();

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
  return {
    content,
    scroll: createScrollState(
      content,
      height,
      resolveFocusAreaViewportWidth(content.split('\n').length, width, height, overflowX),
    ),
    width,
    height,
    overflowX,
  };
}

/**
 * Create focus area state for already-rendered surface content.
 *
 * Uses the surface dimensions directly to compute scroll bounds so callers can
 * keep pane rendering surface-native without string round-tripping.
 */
export function createFocusAreaStateForSurface(
  surface: Surface,
  options: Omit<FocusAreaOptions, 'content'>,
): FocusAreaState {
  const { overflowX = 'hidden' } = options;
  const width = Math.max(1, options.width);
  const height = Math.max(1, options.height);
  const viewportWidth = resolveFocusAreaViewportWidth(surface.height, width, height, overflowX);
  const maxX = viewportWidth === undefined ? 0 : Math.max(0, surface.width - viewportWidth);
  return {
    content: '',
    scroll: {
      y: 0,
      maxY: Math.max(0, surface.height - height),
      x: 0,
      maxX,
      totalLines: surface.height,
      visibleLines: height,
    },
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
  const totalLines = content.split('\n').length;
  const viewportWidth = resolveFocusAreaViewportWidth(totalLines, state.width, state.height, state.overflowX);
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
 * Render the focus area into a surface without converting the pane body back
 * into a string first.
 */
export function focusAreaSurface(
  content: Surface,
  state: FocusAreaState,
  options?: FocusAreaRenderOptions,
): Surface {
  const surface = createSurface(state.width, state.height, EMPTY_CELL);
  return focusAreaSurfaceInto(content, state, surface, options);
}

/**
 * Paint the focus area into an existing target surface.
 *
 * The caller owns clearing the destination region beforehand when reusing the
 * same target across frames.
 */
export function focusAreaSurfaceInto(
  content: Surface,
  state: FocusAreaState,
  target: Surface,
  options?: FocusAreaRenderOptions,
  offsetX = 0,
  offsetY = 0,
): Surface {
  const focused = options?.focused ?? true;
  const showScrollbar = options?.showScrollbar ?? true;
  const ctx = options?.ctx;
  const mode = ctx?.mode ?? 'interactive';
  const hasGutter = mode !== 'pipe' && mode !== 'accessible' && state.width > 1;
  const gutterWidth = hasGutter ? 1 : 0;
  const bodyWidth = Math.max(0, state.width - gutterWidth);
  const needsScrollbar = showScrollbar && content.height > state.height && bodyWidth > 0;
  const contentWidth = needsScrollbar ? Math.max(0, bodyWidth - 1) : bodyWidth;
  const scrollY = Math.max(0, Math.min(state.scroll.y, Math.max(0, content.height - state.height)));
  const scrollX = state.overflowX === 'scroll'
    ? Math.max(0, Math.min(state.scroll.x, Math.max(0, content.width - contentWidth)))
    : 0;

  if (contentWidth > 0 && state.height > 0) {
    target.blit(content, offsetX + gutterWidth, offsetY, scrollX, scrollY, contentWidth, state.height);
  }

  if (needsScrollbar) {
    paintScrollbarInto(target, offsetX + gutterWidth + contentWidth, offsetY, state.height, content.height, scrollY);
  }

  if (hasGutter) {
    const gutterCell = resolveGutterCell(focused, ctx, options);
    const packed: boolean = 'buffer' in target;
    const fgRgb = packed && gutterCell.fg ? parseHex(gutterCell.fg) : undefined;
    if (fgRgb) {
      const [fR, fG, fB] = fgRgb;
      let bR = -1, bG = 0, bB = 0;
      const bgRgb = gutterCell.bg ? parseHex(gutterCell.bg) : undefined;
      if (bgRgb) { [bR, bG, bB] = bgRgb; }
      for (let y = 0; y < state.height; y++) {
        (target as PackedSurface).setRGB(offsetX, offsetY + y, gutterCell.char, fR, fG, fB, bR, bG, bB, encodeModifiers(gutterCell.modifiers));
      }
    } else {
      for (let y = 0; y < state.height; y++) {
        target.set(offsetX, offsetY + y, gutterCell);
      }
    }
  }

  return target;
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
      const baseToken = focused
        ? (options?.focusedGutterToken ?? ctx.semantic('accent'))
        : (options?.unfocusedGutterToken ?? ctx.semantic('muted'));
      const token = resolveBCSSTextToken(
        ctx,
        {
          type: 'FocusArea',
          id: options?.id,
          classes: [...(options?.classes ?? []), focused ? 'focused' : 'unfocused'],
        },
        {
          hex: baseToken.hex,
          bg: baseToken.bg,
          modifiers: baseToken.modifiers as string[] | undefined,
        },
      );

      return ctx.style.styled(token as any, GUTTER_CHAR);
    },
  }, options);
}

function resolveGutterCell(
  focused: boolean,
  ctx: BijouContext | undefined,
  options: FocusAreaRenderOptions | undefined,
) {
  const key = resolveGutter(focused, ctx, options);
  const cached = gutterCellCache.get(key);
  if (cached != null) return cached;
  const parsed = parseAnsiToSurface(key, 1, 1).get(0, 0);
  gutterCellCache.set(key, parsed);
  return parsed;
}

function paintScrollbarInto(
  target: Surface,
  column: number,
  row: number,
  viewportHeight: number,
  totalLines: number,
  scrollY: number,
): void {
  if (totalLines <= viewportHeight) {
    const p: boolean = 'buffer' in target;
    for (let y = 0; y < viewportHeight; y++) {
      if (p) (target as PackedSurface).setRGB(column, row + y, 0x20, -1, 0, 0, -1, 0, 0);
      else target.set(column, row + y, EMPTY_CELL);
    }
    return;
  }

  const thumbSize = Math.max(1, Math.round((viewportHeight / totalLines) * viewportHeight));
  const maxScroll = totalLines - viewportHeight;
  const scrollFraction = maxScroll > 0 ? scrollY / maxScroll : 0;
  const thumbStart = Math.round(scrollFraction * (viewportHeight - thumbSize));

  const sp: boolean = 'buffer' in target;
  for (let index = 0; index < viewportHeight; index++) {
    const isThumb = index >= thumbStart && index < thumbStart + thumbSize;
    if (sp) {
      (target as PackedSurface).setRGB(column, row + index, isThumb ? 0x2588 : 0x2502, -1, 0, 0, -1, 0, 0);
    } else {
      target.set(column, row + index, isThumb ? SCROLLBAR_THUMB_CELL : SCROLLBAR_TRACK_CELL);
    }
  }
}

function resolveFocusAreaViewportWidth(
  totalLines: number,
  width: number,
  height: number,
  overflowX: OverflowX,
): number | undefined {
  const gutterWidth = width > 1 ? 1 : 0;
  const contentWidth = Math.max(1, width - gutterWidth);
  const hasScrollbar = totalLines > height && contentWidth > 1;
  const scrollableWidth = hasScrollbar ? Math.max(1, contentWidth - 1) : contentWidth;
  return overflowX === 'scroll' ? scrollableWidth : undefined;
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
