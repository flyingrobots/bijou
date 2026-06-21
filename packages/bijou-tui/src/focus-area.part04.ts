import type { Cell, Surface } from '@flyingrobots/bijou';

import type { FocusAreaRenderOptions, FocusAreaState } from './focus-area.part01.js';

import { resolveGutterCell, resolveScrollbarCells } from './focus-area.part05.js';

import { paintScrollbarInto } from './focus-area.part06.js';
export function focusAreaSurfaceInto(
  content: Surface,
  state: FocusAreaState,
  target: Surface,
  options?: FocusAreaRenderOptions,
  offsetX = 0,
  offsetY = 0,
): Surface {
  const focused = options?.focused ?? true;
  const showScrollbar = options?.showScrollbar ?? true;
  const ctx = options?.ctx;
  const mode = ctx?.mode ?? 'interactive';
  const hasGutter = mode !== 'pipe' && mode !== 'accessible' && state.width > 1;
  const gutterWidth = hasGutter ? 1 : 0;
  const bodyWidth = Math.max(0, state.width - gutterWidth);
  const needsScrollbar = showScrollbar && content.height > state.height && bodyWidth > 0;
  const contentWidth = needsScrollbar && state.scrollbarMode === 'gutter'
    ? Math.max(0, bodyWidth - 1)
    : bodyWidth;
  const scrollY = Math.max(0, Math.min(state.scroll.y, Math.max(0, content.height - state.height)));
  const scrollX = state.overflowX === 'scroll'
    ? Math.max(0, Math.min(state.scroll.x, Math.max(0, content.width - contentWidth)))
    : 0;

  if (contentWidth > 0 && state.height > 0) {
    target.blit(content, offsetX + gutterWidth, offsetY, scrollX, scrollY, contentWidth, state.height);
  }

  if (needsScrollbar) {
    const scrollbarX = offsetX + gutterWidth + bodyWidth - 1;
    const scrollbarCells = resolveScrollbarCells(ctx, options);
    paintScrollbarInto(
      target,
      scrollbarX,
      offsetY,
      state.height,
      content.height,
      scrollY,
      scrollbarCells.track,
      scrollbarCells.thumb,
    );
  }

  if (hasGutter) {
    const gutterCell = resolveGutterCell(focused, ctx, options);
    for (let y = 0; y < state.height; y++) {
      paintCellPreservingBackground(target, offsetX, offsetY + y, gutterCell);
    }
  }

  return target;
}
export function paintCellPreservingBackground(target: Surface, x: number, y: number, cell: Cell): void {
  const existing = target.get(x, y);
  const hasExplicitBackground = cell.bg != null || cell.bgRGB != null;
  target.set(x, y, {
    char: cell.char,
    fg: cell.fg,
    bg: hasExplicitBackground ? cell.bg : existing.bg,
    fgRGB: cell.fgRGB,
    bgRGB: hasExplicitBackground ? cell.bgRGB : existing.bgRGB,
    modifiers: cell.modifiers,
    opacity: hasExplicitBackground ? cell.opacity : (cell.opacity ?? existing.opacity),
    empty: false,
  });
}
