import type { LayoutNode, Surface } from '@flyingrobots/bijou';

import { layoutNodeToSurface } from './layout-node-surface.js';

import { visibleLength } from './viewport.part01.js';

import type { ScrollState } from './viewport.part01.js';
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
export function normalizeViewportContent(content: Surface | LayoutNode): Surface {
  if (isSurfaceContent(content)) return content;
  return layoutNodeToSurface(content);
}
export function isSurfaceContent(value: Surface | LayoutNode): value is Surface {
  return 'cells' in value;
}
export function scrollBy(state: ScrollState, dy: number): ScrollState {
  const y = Math.max(0, Math.min(state.y + dy, state.maxY));
  return { ...state, y };
}
export function scrollTo(state: ScrollState, y: number): ScrollState {
  return { ...state, y: Math.max(0, Math.min(y, state.maxY)) };
}
export function scrollByX(state: ScrollState, dx: number): ScrollState {
  return { ...state, x: Math.max(0, Math.min(state.x + dx, state.maxX)) };
}
export function scrollToX(state: ScrollState, x: number): ScrollState {
  return { ...state, x: Math.max(0, Math.min(x, state.maxX)) };
}
export function scrollToTop(state: ScrollState): ScrollState {
  return { ...state, y: 0 };
}
export function scrollToBottom(state: ScrollState): ScrollState {
  return { ...state, y: state.maxY };
}
export function pageDown(state: ScrollState): ScrollState {
  return scrollBy(state, state.visibleLines);
}
export function pageUp(state: ScrollState): ScrollState {
  return scrollBy(state, -state.visibleLines);
}
