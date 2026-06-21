import { clipToWidth, visibleLength } from './viewport.part01.js';

import type { ViewportOptions } from './viewport.part01.js';

import { sliceAnsi } from './viewport.part02.js';

import { SCROLLBAR_THUMB, SCROLLBAR_TRACK, renderScrollbar, resolveViewportContentWidth } from './viewport.part03.js';
export function overlayScrollbarChar(
  line: string,
  width: number,
  railChar: string,
): string {
  if (width <= 0) return '';
  if (width === 1) return railChar;
  const prefixWidth = width - 1;
  const prefix = sliceAnsi(line, 0, prefixWidth);
  const prefixVisible = visibleLength(prefix);
  return prefix + ' '.repeat(Math.max(0, prefixWidth - prefixVisible)) + railChar;
}
export function viewport(options: ViewportOptions): string {
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
  } = options;

  const allLines = content.split('\n');
  const totalLines = allLines.length;
  const maxScroll = Math.max(0, totalLines - height);
  const clampedY = Math.max(0, Math.min(scrollY, maxScroll));

  const needsScrollbar = showScrollbar && totalLines > height;
  const contentWidth = resolveViewportContentWidth(width, needsScrollbar, scrollbarMode);

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
    const bar = renderScrollbar(height, totalLines, clampedY, scrollbarTrackChar, scrollbarThumbChar);
    return rendered.map((line, i) => (scrollbarMode === 'overlay'
      ? overlayScrollbarChar(line, width, bar[i] ?? ' ')
      : line + (bar[i] ?? ' '))).join('\n');
  }

  return rendered.join('\n');
}
