import type { Surface } from '@flyingrobots/bijou';

import { createScrollState, pageDown, pageUp, scrollBy, scrollByX, scrollTo, scrollToBottom, scrollToTop, scrollToX } from './viewport.js';

import type { FocusAreaOptions, FocusAreaState } from './focus-area.part01.js';

import { resolveFocusAreaViewportWidth } from './focus-area.part06.js';
export function createFocusAreaStateForSurface(
  surface: Surface,
  options: Omit<FocusAreaOptions, 'content'>,
): FocusAreaState {
  const { overflowX = 'hidden', scrollbarMode = 'gutter' } = options;
  const width = Math.max(1, options.width);
  const height = Math.max(1, options.height);
  const viewportWidth = resolveFocusAreaViewportWidth(surface.height, width, height, overflowX, scrollbarMode);
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
    scrollbarMode,
  };
}
export function focusAreaScrollBy(state: FocusAreaState, dy: number): FocusAreaState {
  return { ...state, scroll: scrollBy(state.scroll, dy) };
}
export function focusAreaScrollTo(state: FocusAreaState, y: number): FocusAreaState {
  return { ...state, scroll: scrollTo(state.scroll, y) };
}
export function focusAreaScrollToTop(state: FocusAreaState): FocusAreaState {
  return { ...state, scroll: scrollToTop(state.scroll) };
}
export function focusAreaScrollToBottom(state: FocusAreaState): FocusAreaState {
  return { ...state, scroll: scrollToBottom(state.scroll) };
}
export function focusAreaPageDown(state: FocusAreaState): FocusAreaState {
  return { ...state, scroll: pageDown(state.scroll) };
}
export function focusAreaPageUp(state: FocusAreaState): FocusAreaState {
  return { ...state, scroll: pageUp(state.scroll) };
}
export function focusAreaScrollByX(state: FocusAreaState, dx: number): FocusAreaState {
  if (state.overflowX === 'hidden') return state;
  return { ...state, scroll: scrollByX(state.scroll, dx) };
}
export function focusAreaScrollToX(state: FocusAreaState, x: number): FocusAreaState {
  if (state.overflowX === 'hidden') return state;
  return { ...state, scroll: scrollToX(state.scroll, x) };
}
export function focusAreaSetContent(state: FocusAreaState, content: string): FocusAreaState {
  const totalLines = content.split('\n').length;
  const viewportWidth = resolveFocusAreaViewportWidth(
    totalLines,
    state.width,
    state.height,
    state.overflowX,
    state.scrollbarMode,
  );
  const newScroll = createScrollState(content, state.height, viewportWidth);
  const clampedY = Math.min(state.scroll.y, newScroll.maxY);
  const clampedX = Math.min(state.scroll.x, newScroll.maxX);
  return {
    ...state,
    content,
    scroll: { ...newScroll, y: clampedY, x: clampedX },
  };
}
