import { createSurface } from '@flyingrobots/bijou';

import type { Surface } from '@flyingrobots/bijou';

import { viewport } from './viewport.js';

import { EMPTY_CELL } from './focus-area.part01.js';

import type { FocusAreaRenderOptions, FocusAreaState } from './focus-area.part01.js';

import { focusAreaSurfaceInto } from './focus-area.part04.js';

import { resolveGutter } from './focus-area.part05.js';
export function focusArea(state: FocusAreaState, options?: FocusAreaRenderOptions): string {
  const focused = options?.focused ?? true;
  const showScrollbar = options?.showScrollbar ?? true;
  const ctx = options?.ctx;
  const mode = ctx?.mode ?? 'interactive';

  // Pipe and accessible modes: no gutter, full width to content
  const hasGutter = mode !== 'pipe' && mode !== 'accessible';
  const contentWidth = hasGutter ? Math.max(1, state.width - 1) : state.width;

  // Clamp scrollX to render-time content width (may differ from state-time
  // width when pipe/accessible mode removes the gutter)
  let scrollX: number | undefined;
  if (state.overflowX === 'scroll') {
    const maxRenderX = Math.max(0, state.scroll.maxX + (contentWidth < state.width ? 0 : 1));
    scrollX = Math.min(state.scroll.x, maxRenderX);
  }

  const body = viewport({
    width: contentWidth,
    height: state.height,
    content: state.content,
    scrollY: state.scroll.y,
    scrollX,
    showScrollbar,
    scrollbarMode: state.scrollbarMode,
  });

  if (!hasGutter) return body;

  // Determine gutter string
  const gutter = resolveGutter(focused, ctx, options);

  // Prepend gutter to each line
  const lines = body.split('\n');
  return lines.map((line) => gutter + line).join('\n');
}
export function focusAreaSurface(
  content: Surface,
  state: FocusAreaState,
  options?: FocusAreaRenderOptions,
): Surface {
  const surface = createSurface(state.width, state.height, EMPTY_CELL);
  return focusAreaSurfaceInto(content, state, surface, options);
}
