import { graphemeClusterWidth, segmentGraphemes } from '@flyingrobots/bijou';

import type { Cell } from '@flyingrobots/bijou';

import { stripAnsi } from './viewport.part01.js';

import type { ScrollbarMode } from './viewport.part01.js';
export function tokenizeAnsi(str: string, width: number): string[] {
  const stripped = stripAnsi(str);
  const graphemes = segmentGraphemes(stripped);
  const result: string[] = [];

  let inEscape = false;
  let escBuf = '';
  let activeAnsi = '';
  let gi = 0;
  let i = 0;
  let visibleCount = 0;

  while (i < str.length && visibleCount < width) {
    const ch = str.charAt(i);

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
        activeAnsi += escBuf;
        escBuf = '';
      }
      i++;
      continue;
    }

    if (gi >= graphemes.length) break;

    const grapheme = graphemes[gi];
    if (grapheme === undefined) break;
    const gWidth = graphemeClusterWidth(grapheme);

    if (visibleCount + gWidth > width) break;

    const styledGrapheme = activeAnsi + grapheme + '\x1b[0m';
    result.push(styledGrapheme);
    if (gWidth === 2) result.push(''); // placeholder for wide char

    visibleCount += gWidth;
    gi++;
    i += grapheme.length;
  }

  while (result.length < width) {
    result.push(' ');
  }

  return result;
}
export const SCROLLBAR_TRACK = '│';
export const SCROLLBAR_THUMB = '█';
export const SCROLLBAR_TRACK_CELL: Cell = { char: SCROLLBAR_TRACK, empty: false };
export const SCROLLBAR_THUMB_CELL: Cell = { char: SCROLLBAR_THUMB, empty: false };
export function renderScrollbar(
  viewportHeight: number,
  totalLines: number,
  scrollY: number,
  trackChar = SCROLLBAR_TRACK,
  thumbChar = SCROLLBAR_THUMB,
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
    bar.push(i >= thumbStart && i < thumbStart + thumbSize ? thumbChar : trackChar);
  }
  return bar;
}
export function resolveViewportContentWidth(
  width: number,
  needsScrollbar: boolean,
  scrollbarMode: ScrollbarMode,
): number {
  if (!needsScrollbar) return width;
  return scrollbarMode === 'overlay' ? width : Math.max(0, width - 1);
}
