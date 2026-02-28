/**
 * Scrollable content viewport for TUI apps.
 *
 * Renders a visible window into content that may be larger than the
 * available screen space, with optional scrollbar indicator.
 */

import { graphemeWidth, graphemeClusterWidth, segmentGraphemes, clipToWidth as coreClipToWidth } from '@flyingrobots/bijou';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Configuration for rendering a scrollable viewport window.
 */
export interface ViewportOptions {
  /** Visible width in columns. Content lines longer than this are clipped. */
  readonly width: number;
  /** Visible height in rows. */
  readonly height: number;
  /** Full content string (may be taller/wider than the viewport). */
  readonly content: string;
  /** Vertical scroll offset (0-based line index). Default: 0. */
  readonly scrollY?: number;
  /** Horizontal scroll offset (0-based column index). Default: 0. */
  readonly scrollX?: number;
  /** Show a scrollbar track on the right edge. Default: true. */
  readonly showScrollbar?: boolean;
}

/**
 * Immutable snapshot of scroll position and bounds for a viewport.
 */
export interface ScrollState {
  /** Current vertical scroll offset. */
  readonly y: number;
  /** Maximum vertical scroll offset. */
  readonly maxY: number;
  /** Current horizontal scroll offset. */
  readonly x: number;
  /** Maximum horizontal scroll offset. */
  readonly maxX: number;
  /** Total number of content lines. */
  readonly totalLines: number;
  /** Number of visible lines (viewport height). */
  readonly visibleLines: number;
}

// ---------------------------------------------------------------------------
// ANSI helpers
// ---------------------------------------------------------------------------

/** Pattern matching SGR-style ANSI escape sequences. */
const ANSI_RE = /\x1b\[[0-9;]*m/g;

/**
 * Strip all SGR ANSI escape sequences from a string.
 *
 * @param str - Input string possibly containing ANSI escapes.
 * @returns Plain text with all ANSI color/style sequences removed.
 */
export function stripAnsi(str: string): string {
  return str.replace(ANSI_RE, '');
}

/**
 * Compute the terminal display width of a string.
 *
 * Grapheme-cluster aware: handles emoji, CJK (2 columns), ZWJ sequences,
 * skin tones, flag pairs, and combining marks correctly.
 */
export function visibleLength(str: string): number {
  return graphemeWidth(str);
}

/**
 * Clip a string to a maximum visible width, preserving ANSI escapes.
 * Grapheme-cluster aware: won't split multi-codepoint sequences.
 * Appends a reset sequence if the string was clipped mid-style.
 *
 * Re-exported from `@flyingrobots/bijou` core for backward compatibility.
 */
export const clipToWidth = coreClipToWidth;

/**
 * Extract a visible-column substring from an ANSI-styled string.
 * Return characters between visible columns [startCol, endCol).
 * Grapheme-cluster aware. Preserve any active ANSI styles seen before startCol.
 *
 * O(n): pre-segment stripped text once, then walk the original string
 * with a grapheme pointer instead of re-segmenting per character.
 *
 * @param str - ANSI-styled input string.
 * @param startCol - Start visible column (inclusive, 0-based).
 * @param endCol - End visible column (exclusive).
 * @returns Substring spanning the requested visible columns with ANSI styles preserved.
 */
export function sliceAnsi(str: string, startCol: number, endCol: number): string {
  const stripped = stripAnsi(str);
  const graphemes = segmentGraphemes(stripped);

  let visible = 0;
  let inEscape = false;
  let escBuf = '';
  let activeAnsi = '';
  let result = '';
  let collecting = false;
  let hasStyle = false;
  let didBreakAtEnd = false;
  let gi = 0;
  let i = 0;

  while (i < str.length) {
    const ch = str[i]!;

    if (ch === '\x1b') {
      inEscape = true;
      escBuf = ch;
      i++;
      continue;
    }

    if (inEscape) {
      escBuf += ch;
      if (ch === 'm') {
        inEscape = false;
        if (collecting) {
          result += escBuf;
          hasStyle = true;
        } else {
          activeAnsi += escBuf;
        }
        escBuf = '';
      }
      i++;
      continue;
    }

    // Visible character — consume next pre-segmented grapheme
    if (gi >= graphemes.length) break;

    const grapheme = graphemes[gi]!;
    const gWidth = graphemeClusterWidth(grapheme);

    if (visible >= endCol) {
      if (hasStyle) result += '\x1b[0m';
      didBreakAtEnd = true;
      break;
    }

    if (visible + gWidth > startCol) {
      if (!collecting) {
        collecting = true;
        result = activeAnsi;
        if (activeAnsi.length > 0) hasStyle = true;
      }
      result += grapheme;
    }

    visible += gWidth;
    gi++;
    i += grapheme.length;
  }

  if (collecting && hasStyle && !didBreakAtEnd) result += '\x1b[0m';

  return result;
}

// ---------------------------------------------------------------------------
// Scrollbar rendering
// ---------------------------------------------------------------------------

/** Character used for the scrollbar track (unfilled portion). */
const SCROLLBAR_TRACK = '│';

/** Character used for the scrollbar thumb (filled portion). */
const SCROLLBAR_THUMB = '█';

/**
 * Render a vertical scrollbar as an array of single-character strings.
 *
 * Thumb size is proportional to the visible fraction of content.
 * Return an array of spaces when all content fits within the viewport.
 *
 * @param viewportHeight - Height of the viewport in rows.
 * @param totalLines - Total number of content lines.
 * @param scrollY - Current vertical scroll offset.
 * @returns Array of length `viewportHeight`, each element a single scrollbar character.
 */
function renderScrollbar(
  viewportHeight: number,
  totalLines: number,
  scrollY: number,
): string[] {
  if (totalLines <= viewportHeight) {
    // No scrolling needed — empty gutter
    return Array.from<string>({ length: viewportHeight }).fill(' ');
  }

  // Thumb size: proportional to visible fraction, min 1 row
  const thumbSize = Math.max(1, Math.round((viewportHeight / totalLines) * viewportHeight));

  // Thumb position: proportional to scroll offset
  const maxScroll = totalLines - viewportHeight;
  const scrollFraction = maxScroll > 0 ? scrollY / maxScroll : 0;
  const thumbStart = Math.round(scrollFraction * (viewportHeight - thumbSize));

  const bar: string[] = [];
  for (let i = 0; i < viewportHeight; i++) {
    bar.push(i >= thumbStart && i < thumbStart + thumbSize ? SCROLLBAR_THUMB : SCROLLBAR_TRACK);
  }
  return bar;
}

// ---------------------------------------------------------------------------
// Viewport rendering
// ---------------------------------------------------------------------------

/**
 * Render a scrollable viewport into content.
 *
 * Return a string with exactly `height` lines, each at most `width`
 * characters wide (plus optional scrollbar).
 *
 * @param options - Viewport configuration including dimensions, content, and scroll offsets.
 * @returns Rendered viewport string with lines joined by newlines.
 */
export function viewport(options: ViewportOptions): string {
  const {
    width,
    height,
    content,
    scrollY = 0,
    scrollX = 0,
    showScrollbar = true,
  } = options;

  const allLines = content.split('\n');
  const totalLines = allLines.length;
  const maxScroll = Math.max(0, totalLines - height);
  const clampedY = Math.max(0, Math.min(scrollY, maxScroll));

  // Content width: leave 1 column for scrollbar if shown and needed
  const needsScrollbar = showScrollbar && totalLines > height;
  const contentWidth = needsScrollbar ? width - 1 : width;

  // Slice visible window
  const visibleSlice = allLines.slice(clampedY, clampedY + height);

  // Pad to fill viewport height if content is shorter
  while (visibleSlice.length < height) {
    visibleSlice.push('');
  }

  // Clip/pad each line to content width
  const rendered = visibleSlice.map((line) => {
    let sliced: string;
    if (scrollX > 0) {
      sliced = sliceAnsi(line, scrollX, scrollX + contentWidth);
    } else {
      const vis = visibleLength(line);
      sliced = vis > contentWidth ? clipToWidth(line, contentWidth) : line;
    }
    const slicedVis = visibleLength(sliced);
    return slicedVis < contentWidth ? sliced + ' '.repeat(contentWidth - slicedVis) : sliced;
  });

  // Append scrollbar
  if (needsScrollbar) {
    const bar = renderScrollbar(height, totalLines, clampedY);
    return rendered.map((line, i) => line + bar[i]!).join('\n');
  }

  return rendered.join('\n');
}

// ---------------------------------------------------------------------------
// Scroll state management
// ---------------------------------------------------------------------------

/**
 * Create initial scroll state for content within a viewport.
 *
 * @param content - Full content string (newline-delimited).
 * @param viewportHeight - Visible height in rows.
 * @param viewportWidth - Visible width in columns (used to compute maxX).
 * @returns Initial scroll state positioned at top-left (y=0, x=0).
 */
export function createScrollState(
  content: string,
  viewportHeight: number,
  viewportWidth?: number,
): ScrollState {
  const lines = content.split('\n');
  const totalLines = lines.length;

  let maxX = 0;
  if (viewportWidth !== undefined) {
    let widest = 0;
    for (const line of lines) {
      const w = visibleLength(line);
      if (w > widest) widest = w;
    }
    maxX = Math.max(0, widest - viewportWidth);
  }

  return {
    y: 0,
    maxY: Math.max(0, totalLines - viewportHeight),
    x: 0,
    maxX,
    totalLines,
    visibleLines: viewportHeight,
  };
}

/**
 * Scroll vertically by a relative amount, clamping to valid range.
 *
 * @param state - Current scroll state.
 * @param dy - Relative vertical offset (positive = down, negative = up).
 * @returns New scroll state with updated y position.
 */
export function scrollBy(state: ScrollState, dy: number): ScrollState {
  const y = Math.max(0, Math.min(state.y + dy, state.maxY));
  return { ...state, y };
}

/**
 * Scroll vertically to an absolute position, clamping to valid range.
 *
 * @param state - Current scroll state.
 * @param y - Absolute vertical offset (0-based line index).
 * @returns New scroll state with updated y position.
 */
export function scrollTo(state: ScrollState, y: number): ScrollState {
  return { ...state, y: Math.max(0, Math.min(y, state.maxY)) };
}

/**
 * Scroll horizontally by a relative amount, clamping to valid range.
 *
 * @param state - Current scroll state.
 * @param dx - Relative horizontal offset (positive = right, negative = left).
 * @returns New scroll state with updated x position.
 */
export function scrollByX(state: ScrollState, dx: number): ScrollState {
  return { ...state, x: Math.max(0, Math.min(state.x + dx, state.maxX)) };
}

/**
 * Scroll horizontally to an absolute position, clamping to valid range.
 *
 * @param state - Current scroll state.
 * @param x - Absolute horizontal offset (0-based column index).
 * @returns New scroll state with updated x position.
 */
export function scrollToX(state: ScrollState, x: number): ScrollState {
  return { ...state, x: Math.max(0, Math.min(x, state.maxX)) };
}

/**
 * Scroll to the top (y = 0).
 *
 * @param state - Current scroll state.
 * @returns New scroll state positioned at the top.
 */
export function scrollToTop(state: ScrollState): ScrollState {
  return { ...state, y: 0 };
}

/**
 * Scroll to the bottom (y = maxY).
 *
 * @param state - Current scroll state.
 * @returns New scroll state positioned at the bottom.
 */
export function scrollToBottom(state: ScrollState): ScrollState {
  return { ...state, y: state.maxY };
}

/**
 * Page down (scroll by one viewport height).
 *
 * @param state - Current scroll state.
 * @returns New scroll state scrolled down by `visibleLines` rows.
 */
export function pageDown(state: ScrollState): ScrollState {
  return scrollBy(state, state.visibleLines);
}

/**
 * Page up (scroll by one viewport height).
 *
 * @param state - Current scroll state.
 * @returns New scroll state scrolled up by `visibleLines` rows.
 */
export function pageUp(state: ScrollState): ScrollState {
  return scrollBy(state, -state.visibleLines);
}
