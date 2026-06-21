import type { Cell, Surface } from '@flyingrobots/bijou';

import type { ScrollbarMode } from './viewport.js';

import { createKeyMap } from './keybindings.js';

import type { KeyMap } from './keybindings.js';

import { EMPTY_CELL } from './focus-area.part01.js';

import type { OverflowX } from './focus-area.part01.js';

import { paintCellPreservingBackground } from './focus-area.part04.js';
export function paintScrollbarInto(
  target: Surface,
  column: number,
  row: number,
  viewportHeight: number,
  totalLines: number,
  scrollY: number,
  trackCell: Cell,
  thumbCell: Cell,
): void {
  if (totalLines <= viewportHeight) {
    for (let y = 0; y < viewportHeight; y++) {
      paintCellPreservingBackground(target, column, row + y, EMPTY_CELL);
    }
    return;
  }

  const thumbSize = Math.max(1, Math.round((viewportHeight / totalLines) * viewportHeight));
  const maxScroll = totalLines - viewportHeight;
  const scrollFraction = maxScroll > 0 ? scrollY / maxScroll : 0;
  const thumbStart = Math.round(scrollFraction * (viewportHeight - thumbSize));

  for (let index = 0; index < viewportHeight; index++) {
    const isThumb = index >= thumbStart && index < thumbStart + thumbSize;
    paintCellPreservingBackground(
      target,
      column,
      row + index,
      isThumb ? thumbCell : trackCell,
    );
  }
}
export function resolveFocusAreaViewportWidth(
  totalLines: number,
  width: number,
  height: number,
  overflowX: OverflowX,
  scrollbarMode: ScrollbarMode,
): number | undefined {
  const gutterWidth = width > 1 ? 1 : 0;
  const contentWidth = Math.max(1, width - gutterWidth);
  const hasScrollbar = totalLines > height && contentWidth > 1;
  const scrollableWidth = hasScrollbar && scrollbarMode === 'gutter'
    ? Math.max(1, contentWidth - 1)
    : contentWidth;
  return overflowX === 'scroll' ? scrollableWidth : undefined;
}
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
