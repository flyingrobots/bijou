/**
 * Status bar — a single-line bar with left/center/right sections.
 *
 * Sections are laid out with priority: left > right > center.
 * On overlap, center is truncated first, then right.
 */

import {
  createSurface,
  parseAnsiToSurface,
  type Surface,
} from '@flyingrobots/bijou';
import { layoutStatusBar, type StatusBarOptions } from './status-bar-layout.js';

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

export type { StatusBarOptions } from './status-bar-layout.js';
