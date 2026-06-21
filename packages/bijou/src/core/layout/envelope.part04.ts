import { sanitizeNonNegativeInt } from '../numeric.js';

import type { ContentExtent, ResolvedLayoutEnvelope } from './envelope.part01.js';

import type { MeasureTextContentInput, PlaceInRectInput, StackLayoutInput, StackLayoutResult } from './envelope.part02.js';

import { assignLayoutChild, assignedLayoutRect } from './envelope.part03.js';

import { contentExtent } from './envelope.part05.js';

import { normalizeDirection, resolveBlockOffset, resolveInlineOffset, resolveStackTrackSizes, trackWeight } from './envelope.part06.js';

import { normalizeRequiredText } from './envelope.part07.js';
export function measureTextContent(input: MeasureTextContentInput): ContentExtent {
  const measured = input.adapter({
    text: input.text,
    availableInline: sanitizeNonNegativeInt(input.availableInline, 0),
    direction: normalizeDirection(input.direction),
    wrap: input.wrap ?? 'none',
  });
  return contentExtent('text', measured);
}
export function resolveStackLayout(input: StackLayoutInput): StackLayoutResult {
  const children = [...input.children];
  const assigned = assignedLayoutRect(input.rect);
  const axis = input.axis;
  const direction = normalizeDirection(input.direction);
  const gap = sanitizeNonNegativeInt(input.gap, 0);
  const mainSize = axis === 'inline' ? assigned.inlineSize : assigned.blockSize;
  const crossSize = axis === 'inline' ? assigned.blockSize : assigned.inlineSize;
  const totalGap = gap * Math.max(0, children.length - 1);
  const available = Math.max(0, mainSize - totalGap);
  const sizes = resolveStackTrackSizes(children, available);
  const resolvedChildren: ResolvedLayoutEnvelope[] = [];
  let cursor = axis === 'inline' ? assigned.inlineStart : assigned.blockStart;

  for (const [index, child] of children.entries()) {
    const size = sizes[index] ?? 0;
    const rect = axis === 'inline'
      ? {
          inlineStart: cursor,
          blockStart: assigned.blockStart,
          inlineSize: size,
          blockSize: crossSize,
        }
      : {
          inlineStart: assigned.inlineStart,
          blockStart: cursor,
          inlineSize: crossSize,
          blockSize: size,
    };
    const reason = child.track.kind === 'fixed'
      ? `stack ${axis} fixed track ${String(size)} cells`
      : `stack ${axis} flex track ${String(trackWeight(child.track))} resolved by largest-remainder-source-order`;
    resolvedChildren.push(assignLayoutChild(child.envelope, rect, reason));
    cursor += size + (index < children.length - 1 ? gap : 0);
  }

  return Object.freeze({
    id: normalizeRequiredText(input.id, 'stack layout: id is required'),
    role: normalizeRequiredText(input.role, 'stack layout: role is required'),
    axis,
    direction,
    assigned,
    roundingPolicy: 'largest-remainder-source-order' as const,
    children: Object.freeze(resolvedChildren),
  });
}
export function placeInRect(input: PlaceInRectInput): ResolvedLayoutEnvelope {
  const parent = assignedLayoutRect(input.parent);
  const direction = normalizeDirection(input.direction ?? input.envelope.direction);
  const inlineAlign = input.inlineAlign;
  const blockAlign = input.blockAlign;
  const inlineSize = inlineAlign === 'stretch'
    ? parent.inlineSize
    : Math.min(parent.inlineSize, sanitizeNonNegativeInt(input.size.inlineSize, 0));
  const blockSize = blockAlign === 'stretch'
    ? parent.blockSize
    : Math.min(parent.blockSize, sanitizeNonNegativeInt(input.size.blockSize, 0));
  const inlineOffset = resolveInlineOffset(parent.inlineSize, inlineSize, inlineAlign, direction);
  const blockOffset = resolveBlockOffset(parent.blockSize, blockSize, blockAlign);

  return assignLayoutChild(
    input.envelope,
    {
      inlineStart: parent.inlineStart + inlineOffset,
      blockStart: parent.blockStart + blockOffset,
      inlineSize,
      blockSize,
    },
    `place ${direction} inline ${inlineAlign} block ${blockAlign}`,
  );
}
