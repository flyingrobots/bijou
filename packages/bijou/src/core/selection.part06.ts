import type { LayoutRect } from '../ports/surface.js';

import { sanitizeNonNegativeInt, sanitizePositiveInt } from './numeric.js';

import type { MixedSelectionContentRegion, SelectionOwner, SelectionPoint, SelectionRange } from './selection.part01.js';

import { isSelectionOwner } from './selection.part02.js';
export function childRangeForRegion(
  range: SelectionRange,
  region: MixedSelectionContentRegion,
): SelectionRange | undefined {
  const childEndY = region.rect.y + region.rect.height - 1;
  const childEndX = region.rect.x + region.rect.width - 1;
  const startY = Math.max(range.start.y, region.rect.y);
  const endY = Math.min(range.end.y, childEndY);
  if (startY > endY) {
    return undefined;
  }

  const startX = startY === range.start.y
    ? Math.max(range.start.x, region.rect.x)
    : region.rect.x;
  const endX = endY === range.end.y
    ? Math.min(range.end.x, childEndX)
    : childEndX;
  if (startX > childEndX || endX < region.rect.x) {
    return undefined;
  }

  const start = Object.freeze({
    x: Math.max(startX, region.rect.x) - region.rect.x,
    y: startY - region.rect.y,
  });
  const end = Object.freeze({
    x: Math.min(endX, childEndX) - region.rect.x,
    y: endY - region.rect.y,
  });

  return Object.freeze({
    ownerId: `${range.ownerId}:${region.id}`,
    anchor: start,
    focus: end,
    start,
    end,
    contentRect: Object.freeze({
      x: 0,
      y: 0,
      width: region.rect.width,
      height: region.rect.height,
    }),
    direction: 'forward',
    dragSource: range.dragSource,
  });
}
export function assertSelectionOwner(owner: SelectionOwner, scope: string): void {
  if (!isSelectionOwner(owner)) {
    throw new Error(`${scope}: owner was not created by defineSelectionOwner()`);
  }
}
export function normalizeRequiredText(input: {
  readonly scope: string;
  readonly field: string;
  readonly value: string;
}): string {
  const normalized = input.value.trim();
  if (normalized.length === 0) {
    throw new Error(`${input.scope}: ${input.field} is required`);
  }

  return normalized;
}
export function normalizeRect(rect: LayoutRect): LayoutRect {
  return {
    x: sanitizeNonNegativeInt(rect.x),
    y: sanitizeNonNegativeInt(rect.y),
    width: sanitizePositiveInt(rect.width),
    height: sanitizePositiveInt(rect.height),
  };
}
export function freezeRect(rect: LayoutRect): LayoutRect {
  return Object.freeze({ ...rect });
}
export function normalizePoint(point: SelectionPoint): SelectionPoint {
  return Object.freeze({
    x: sanitizeNonNegativeInt(point.x),
    y: sanitizeNonNegativeInt(point.y),
  });
}
export function rectContainsPoint(rect: LayoutRect, point: SelectionPoint): boolean {
  const normalizedRect = normalizeRect(rect);
  return (
    point.x >= normalizedRect.x
    && point.y >= normalizedRect.y
    && point.x < normalizedRect.x + normalizedRect.width
    && point.y < normalizedRect.y + normalizedRect.height
  );
}
