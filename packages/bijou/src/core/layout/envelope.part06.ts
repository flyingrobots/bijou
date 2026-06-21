import { sanitizeNonNegativeInt } from '../numeric.js';

import type { LayoutBound, LayoutDirection, LogicalAlign } from './envelope.part01.js';

import type { StackLayoutChildInput, StackTrack } from './envelope.part02.js';
export function resolveStackTrackSizes(
  children: readonly StackLayoutChildInput[],
  available: number,
): number[] {
  const sizes = new Array<number>(children.length).fill(0);
  let fixed = 0;
  let totalFlex = 0;

  for (const [index, child] of children.entries()) {
    const track = child.track;
    if (track.kind === 'fixed') {
      const size = sanitizeNonNegativeInt(track.size, 0);
      sizes[index] = size;
      fixed += size;
    } else {
      totalFlex += trackWeight(track);
    }
  }

  if (fixed > available) {
    let remaining = available;
    for (const [index, child] of children.entries()) {
      if (child.track.kind !== 'fixed') continue;
      const next = Math.min(sizes[index] ?? 0, remaining);
      sizes[index] = next;
      remaining = Math.max(0, remaining - next);
    }
    return sizes;
  }

  const remaining = Math.max(0, available - fixed);
  if (totalFlex <= 0 || remaining <= 0) return sizes;

  let assigned = 0;
  const fractionalShares: { readonly index: number; readonly remainder: number }[] = [];
  for (const [index, child] of children.entries()) {
    const track = child.track;
    if (track.kind !== 'flex') continue;
    const raw = (remaining * trackWeight(track)) / totalFlex;
    const whole = Math.floor(raw);
    sizes[index] = whole;
    assigned += whole;
    fractionalShares.push({ index, remainder: raw - whole });
  }

  let leftover = remaining - assigned;
  fractionalShares.sort((left, right) => right.remainder - left.remainder || left.index - right.index);
  for (const share of fractionalShares) {
    if (leftover <= 0) break;
    sizes[share.index] = (sizes[share.index] ?? 0) + 1;
    leftover -= 1;
  }

  return sizes;
}
export function trackWeight(track: StackTrack): number {
  if (track.kind !== 'flex') return 0;
  const weight = track.weight ?? 1;
  if (!Number.isFinite(weight) || weight <= 0) return 1;
  return Math.max(1, Math.floor(weight));
}
export function resolveInlineOffset(
  parentSize: number,
  childSize: number,
  align: LogicalAlign,
  direction: LayoutDirection,
): number {
  const remaining = Math.max(0, parentSize - childSize);
  if (align === 'stretch') return 0;
  if (align === 'center') return Math.floor(remaining / 2);
  if (direction === 'rtl') {
    return align === 'start' ? remaining : 0;
  }
  return align === 'start' ? 0 : remaining;
}
export function resolveBlockOffset(parentSize: number, childSize: number, align: LogicalAlign): number {
  const remaining = Math.max(0, parentSize - childSize);
  if (align === 'stretch' || align === 'start') return 0;
  if (align === 'center') return Math.floor(remaining / 2);
  return remaining;
}
export function normalizeBound(value: LayoutBound | undefined, min: number): LayoutBound {
  if (value === 'unbounded' || value === undefined) return 'unbounded';
  return Math.max(min, sanitizeNonNegativeInt(value, min));
}
export function normalizePreferred(value: number | undefined, min: number, max: LayoutBound): number {
  const preferred = sanitizeNonNegativeInt(value, min);
  if (max === 'unbounded') return Math.max(min, preferred);
  return Math.max(min, Math.min(max, preferred));
}
export function normalizeDirection(direction: LayoutDirection | undefined): LayoutDirection {
  return direction ?? 'ltr';
}
