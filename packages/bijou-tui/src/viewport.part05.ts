import { createSurface, parseAnsiToSurface } from '@flyingrobots/bijou';

import type { Surface } from '@flyingrobots/bijou';

import type { ScrollState, ViewportContent, ViewportSurfaceOptions } from './viewport.part01.js';

import { SCROLLBAR_THUMB, SCROLLBAR_THUMB_CELL, SCROLLBAR_TRACK, SCROLLBAR_TRACK_CELL, renderScrollbar, resolveViewportContentWidth } from './viewport.part03.js';

import { viewport } from './viewport.part04.js';

import { createScrollState, normalizeViewportContent } from './viewport.part06.js';
export function viewportSurface(options: ViewportSurfaceOptions): Surface {
  const {
    width,
    height,
    content,
    scrollY = 0,
    scrollX = 0,
    showScrollbar = true,
    scrollbarMode = 'gutter',
    scrollbarTrackChar = SCROLLBAR_TRACK,
    scrollbarThumbChar = SCROLLBAR_THUMB,
    scrollbarTrackCell = SCROLLBAR_TRACK_CELL,
    scrollbarThumbCell = SCROLLBAR_THUMB_CELL,
  } = options;

  const safeWidth = Math.max(0, Math.floor(width));
  const safeHeight = Math.max(0, Math.floor(height));

  if (typeof content === 'string') {
    return parseAnsiToSurface(
      viewport({
        width: safeWidth,
        height: safeHeight,
        content,
        scrollY,
        scrollX,
        showScrollbar,
        scrollbarMode,
        scrollbarTrackChar,
        scrollbarThumbChar,
      }),
      safeWidth,
      safeHeight,
    );
  }

  const normalizedContent = normalizeViewportContent(content);

  const result = createSurface(safeWidth, safeHeight, { char: ' ', empty: false });
  const totalLines = normalizedContent.height;
  const maxScroll = Math.max(0, totalLines - safeHeight);
  const clampedY = Math.max(0, Math.min(scrollY, maxScroll));

  const needsScrollbar = showScrollbar && totalLines > safeHeight;
  const contentWidth = resolveViewportContentWidth(safeWidth, needsScrollbar, scrollbarMode);

  if (contentWidth > 0 && safeHeight > 0) {
    result.blit(normalizedContent, 0, 0, Math.max(0, scrollX), clampedY, contentWidth, safeHeight);
  }

  if (needsScrollbar && safeWidth > 0) {
    const bar = renderScrollbar(safeHeight, totalLines, clampedY, scrollbarTrackChar, scrollbarThumbChar);
    const scrollbarX = safeWidth - 1;
    for (let y = 0; y < safeHeight; y++) {
      const rail = bar[y] ?? ' ';
      const cell = rail === scrollbarThumbChar ? scrollbarThumbCell : scrollbarTrackCell;
      result.set(scrollbarX, y, { ...cell, char: rail, empty: false });
    }
  }

  return result;
}
export function createScrollStateForContent(
  content: ViewportContent,
  viewportHeight: number,
  viewportWidth?: number,
): ScrollState {
  if (typeof content === 'string') {
    return createScrollState(content, viewportHeight, viewportWidth);
  }

  const normalized = normalizeViewportContent(content);
  const visibleLines = Math.max(0, Math.floor(viewportHeight));
  const safeWidth = viewportWidth == null ? undefined : Math.max(0, Math.floor(viewportWidth));

  return {
    y: 0,
    maxY: Math.max(0, normalized.height - visibleLines),
    x: 0,
    maxX: safeWidth == null ? 0 : Math.max(0, normalized.width - safeWidth),
    totalLines: normalized.height,
    visibleLines,
  };
}
