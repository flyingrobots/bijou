/**
 * Scrollable content viewport for TUI apps.
 *
 * Renders a visible window into content that may be larger than the
 * available screen space, with optional scrollbar indicator.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

const ANSI_RE = /\x1b\[[0-9;]*m/g;

export function stripAnsi(str: string): string {
  return str.replace(ANSI_RE, '');
}

export function visibleLength(str: string): number {
  return stripAnsi(str).length;
}

/**
 * Clip a string to a maximum visible width, preserving ANSI escapes.
 * Appends a reset sequence if the string was clipped mid-style.
 */
export function clipToWidth(str: string, maxWidth: number): string {
  let visible = 0;
  let result = '';
  let inEscape = false;

  for (let i = 0; i < str.length; i++) {
    const ch = str[i]!;

    if (ch === '\x1b') {
      inEscape = true;
      result += ch;
      continue;
    }

    if (inEscape) {
      result += ch;
      if (ch === 'm') inEscape = false;
      continue;
    }

    if (visible >= maxWidth) {
      // Append reset in case we clipped inside a styled region
      result += '\x1b[0m';
      break;
    }

    result += ch;
    visible++;
  }

  return result;
}

/**
 * Extract a visible-column substring from an ANSI-styled string.
 * Returns characters between visible columns [startCol, endCol).
 * Preserves any active ANSI styles seen before startCol.
 */
export function sliceAnsi(str: string, startCol: number, endCol: number): string {
  let visible = 0;
  let inEscape = false;
  let activeAnsi = '';
  let result = '';
  let collecting = false;
  let hasStyle = false;

  for (let i = 0; i < str.length; i++) {
    const ch = str[i]!;

    if (ch === '\x1b') {
      inEscape = true;
      if (collecting) {
        result += ch;
        hasStyle = true;
      } else {
        activeAnsi += ch;
      }
      continue;
    }

    if (inEscape) {
      if (collecting) {
        result += ch;
      } else {
        activeAnsi += ch;
      }
      if (ch === 'm') inEscape = false;
      continue;
    }

    if (visible >= endCol) {
      if (hasStyle) result += '\x1b[0m';
      break;
    }

    if (visible >= startCol) {
      if (!collecting) {
        collecting = true;
        result = activeAnsi;
        if (activeAnsi.length > 0) hasStyle = true;
      }
      result += ch;
    }

    visible++;
  }

  // Append reset if we reached end of string with an active style
  if (collecting && hasStyle) result += '\x1b[0m';

  return result;
}

// ---------------------------------------------------------------------------
// Scrollbar rendering
// ---------------------------------------------------------------------------

const SCROLLBAR_TRACK = '│';
const SCROLLBAR_THUMB = '█';

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
 * Returns a string with exactly `height` lines, each at most `width`
 * characters wide (plus optional scrollbar).
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
 * Scroll by a relative amount. Clamps to valid range.
 */
export function scrollBy(state: ScrollState, dy: number): ScrollState {
  const y = Math.max(0, Math.min(state.y + dy, state.maxY));
  return { ...state, y };
}

/**
 * Scroll to an absolute position. Clamps to valid range.
 */
export function scrollTo(state: ScrollState, y: number): ScrollState {
  return { ...state, y: Math.max(0, Math.min(y, state.maxY)) };
}

/**
 * Scroll horizontally by a relative amount. Clamps to valid range.
 */
export function scrollByX(state: ScrollState, dx: number): ScrollState {
  return { ...state, x: Math.max(0, Math.min(state.x + dx, state.maxX)) };
}

/**
 * Scroll horizontally to an absolute position. Clamps to valid range.
 */
export function scrollToX(state: ScrollState, x: number): ScrollState {
  return { ...state, x: Math.max(0, Math.min(x, state.maxX)) };
}

/**
 * Scroll to the top.
 */
export function scrollToTop(state: ScrollState): ScrollState {
  return { ...state, y: 0 };
}

/**
 * Scroll to the bottom.
 */
export function scrollToBottom(state: ScrollState): ScrollState {
  return { ...state, y: state.maxY };
}

/**
 * Page down (scroll by one viewport height).
 */
export function pageDown(state: ScrollState): ScrollState {
  return scrollBy(state, state.visibleLines);
}

/**
 * Page up (scroll by one viewport height).
 */
export function pageUp(state: ScrollState): ScrollState {
  return scrollBy(state, -state.visibleLines);
}
