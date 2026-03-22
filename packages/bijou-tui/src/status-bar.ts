/**
 * Status bar — a single-line bar with left/center/right sections.
 *
 * Sections are laid out with priority: left > right > center.
 * On overlap, center is truncated first, then right.
 */

import { createSurface, parseAnsiToSurface, type Surface } from '@flyingrobots/bijou';
import { visibleLength, clipToWidth } from './viewport.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Options for rendering a status bar. */
export interface StatusBarOptions {
  /** Content aligned to the left edge. */
  readonly left?: string;
  /** Content centered in the bar. */
  readonly center?: string;
  /** Content aligned to the right edge. */
  readonly right?: string;
  /** Total width of the bar in columns. */
  readonly width: number;
  /** Character used to fill empty space (default: `' '`). */
  readonly fillChar?: string;
}

interface StatusBarSegment {
  readonly start: number;
  readonly len: number;
  readonly text: string;
}

interface StatusBarLayout {
  readonly width: number;
  readonly fill: string;
  readonly segments: readonly StatusBarSegment[];
}

// ---------------------------------------------------------------------------
// statusBar()
// ---------------------------------------------------------------------------

/**
 * Render a single-line status bar with left, center, and right sections.
 *
 * Layout priority: left > right > center. On overlap, center is truncated
 * first, then right. Sections may contain ANSI escape codes.
 *
 * @param options - Bar content, width, and fill character.
 * @returns Rendered status bar string of exactly `width` visible characters.
 */
export function statusBar(options: StatusBarOptions): string {
  const layout = layoutStatusBar(options);
  if (layout == null) return '';

  let result = '';
  let pos = 0;

  for (const seg of layout.segments) {
    if (seg.start > pos) {
      result += layout.fill.repeat(seg.start - pos);
    }
    result += seg.text;
    pos = seg.start + seg.len;
  }

  if (pos < layout.width) {
    result += layout.fill.repeat(layout.width - pos);
  }

  return result;
}

/**
 * Render a single-line status bar directly into a `Surface`.
 *
 * Use this in shell chrome and other structured TUI composition paths where the
 * bar should stay on the `Surface` path instead of being flattened to text
 * first. Keep {@link statusBar} for explicit text output or pipe-mode lowering.
 *
 * @param options - Bar content, width, and fill character.
 * @returns Surface sized exactly to the requested bar width and one row tall.
 */
export function statusBarSurface(options: StatusBarOptions): Surface {
  const layout = layoutStatusBar(options);
  if (layout == null) return createSurface(0, 0);

  const surface = createSurface(layout.width, 1, {
    char: layout.fill,
    empty: false,
  });

  for (const seg of layout.segments) {
    const segmentSurface = parseAnsiToSurface(seg.text, seg.len, 1);
    surface.blit(segmentSurface, seg.start, 0, 0, 0, seg.len, 1);
  }

  return surface;
}

function layoutStatusBar(options: StatusBarOptions): StatusBarLayout | null {
  const {
    left = '',
    center = '',
    right = '',
    width,
    fillChar: rawFillChar,
  } = options;

  if (width <= 0) return null;

  // Use first character of fillChar, default to space
  const fill = rawFillChar ? rawFillChar[0]! : ' ';

  // Measure visible lengths
  const leftLen = visibleLength(left);
  const centerLen = visibleLength(center);
  const rightLen = visibleLength(right);

  // Determine how much space left takes
  const clippedLeft = leftLen > width ? clipToWidth(left, width) : left;
  const actualLeftLen = Math.min(leftLen, width);

  // Right starts from the right edge; available space is what left didn't take
  const rightAvail = width - actualLeftLen;
  let clippedRight: string;
  let actualRightLen: number;
  if (rightLen <= rightAvail) {
    clippedRight = right;
    actualRightLen = rightLen;
  } else {
    clippedRight = rightAvail > 0 ? clipToWidth(right, rightAvail) : '';
    actualRightLen = Math.min(rightLen, Math.max(0, rightAvail));
  }

  // Center: available space is between left and right
  const centerAvail = width - actualLeftLen - actualRightLen;
  let clippedCenter: string;
  let actualCenterLen: number;
  if (centerLen <= centerAvail) {
    clippedCenter = center;
    actualCenterLen = centerLen;
  } else {
    clippedCenter = centerAvail > 0 ? clipToWidth(center, centerAvail) : '';
    actualCenterLen = Math.min(centerLen, Math.max(0, centerAvail));
  }

  // Build the result: lay out on the fill bar
  // Left starts at 0
  const leftStart = 0;

  // Right ends at width
  const rightStart = width - actualRightLen;

  // Center is centered in the full width, but clamped to not overlap left or right
  let centerStart = Math.floor((width - actualCenterLen) / 2);
  // Ensure center doesn't overlap with left
  if (centerStart < actualLeftLen) {
    centerStart = actualLeftLen;
  }
  // Ensure center doesn't overlap with right
  if (centerStart + actualCenterLen > rightStart) {
    // Shift center left, but not before left boundary
    centerStart = Math.max(actualLeftLen, rightStart - actualCenterLen);
    // If still overlapping, re-clip center
    if (centerStart + actualCenterLen > rightStart) {
      const spaceForCenter = rightStart - centerStart;
      if (spaceForCenter > 0) {
        clippedCenter = clipToWidth(clippedCenter, spaceForCenter);
        actualCenterLen = spaceForCenter;
      } else {
        clippedCenter = '';
        actualCenterLen = 0;
      }
    }
  }

  // Build the output as an array of fill chars, then overlay sections
  // We need to handle ANSI codes, so we build the string by concatenation
  const segments: Array<{ start: number; len: number; text: string }> = [];

  if (actualLeftLen > 0) {
    segments.push({ start: leftStart, len: actualLeftLen, text: clippedLeft });
  }
  if (actualCenterLen > 0) {
    segments.push({ start: centerStart, len: actualCenterLen, text: clippedCenter });
  }
  if (actualRightLen > 0) {
    segments.push({ start: rightStart, len: actualRightLen, text: clippedRight });
  }

  // Sort segments by start position
  segments.sort((a, b) => a.start - b.start);

  return { width, fill, segments };
}
