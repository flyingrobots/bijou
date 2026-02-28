/**
 * Status bar — a single-line bar with left/center/right sections.
 *
 * Sections are laid out with priority: left > right > center.
 * On overlap, center is truncated first, then right.
 */

import type { BijouContext } from '@flyingrobots/bijou';
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
  /** Bijou context for theming and styling. */
  readonly ctx?: BijouContext;
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
 * @param options - Bar content, width, fill character, and context.
 * @returns Rendered status bar string of exactly `width` visible characters.
 */
export function statusBar(options: StatusBarOptions): string {
  const {
    left = '',
    center = '',
    right = '',
    width,
    fillChar: rawFillChar,
  } = options;

  if (width <= 0) return '';

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

  // Build result by interleaving fill chars and segments
  let result = '';
  let pos = 0;

  for (const seg of segments) {
    if (seg.start > pos) {
      result += fill.repeat(seg.start - pos);
    }
    result += seg.text;
    pos = seg.start + seg.len;
  }

  // Fill remaining
  if (pos < width) {
    result += fill.repeat(width - pos);
  }

  return result;
}
