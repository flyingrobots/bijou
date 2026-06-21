import { createSurface } from '@flyingrobots/bijou';

import type { OverflowBehavior, Surface } from '@flyingrobots/bijou';

import type { LayoutRect } from './layout-rect.js';

import type { RenderNotificationStackOptions } from './notification.part01.js';

import { wrapLineSurface } from './notification.part10.js';
export function composeColumnRows(
  left: Surface,
  right: Surface,
  width: number,
  overflow: OverflowBehavior,
): readonly Surface[] {
  const safeWidth = Math.max(1, width);
  const rightWidth = Math.min(right.width, safeWidth);

  if (overflow === 'truncate') {
    const row = createSurface(safeWidth, 1);
    const leftWidth = Math.max(0, safeWidth - rightWidth);
    if (leftWidth > 0) {
      row.blit(left, 0, 0, 0, 0, leftWidth, 1);
    }
    if (rightWidth > 0) {
      row.blit(right, safeWidth - rightWidth, 0, Math.max(0, right.width - rightWidth), 0, rightWidth, 1);
    }
    return [row];
  }

  const gap = rightWidth > 0 ? 1 : 0;
  const leftWidth = Math.max(1, safeWidth - rightWidth - gap);
  const wrappedLeft = wrapLineSurface(left, leftWidth);
  return wrappedLeft.map((rowSurface, index) => {
    const row = createSurface(safeWidth, 1);
    row.blit(rowSurface, 0, 0);
    if (index === 0 && rightWidth > 0) {
      row.blit(right, safeWidth - rightWidth, 0, Math.max(0, right.width - rightWidth), 0, rightWidth, 1);
    }
    return row;
  });
}
export function resolveRegion(options: RenderNotificationStackOptions): LayoutRect {
  const screenWidth = Math.max(0, options.screenWidth);
  const screenHeight = Math.max(0, options.screenHeight);
  if (options.region == null) {
    return { row: 0, col: 0, width: screenWidth, height: screenHeight };
  }
  return {
    row: Math.max(0, options.region.row),
    col: Math.max(0, options.region.col),
    width: Math.max(0, options.region.width),
    height: Math.max(0, options.region.height),
  };
}
