import type { SelectionContentModel, SelectionOwner, SelectionRange, SelectionRangeInput } from './selection.part01.js';

import { selectionRegion } from './selection.part02.js';

import type { CoordinateSelectionInput, CoordinateSelectionResult, SelectionClipboardEffect } from './selection.part02.js';

import { extractLineSelection, extractTableSelection, pickSelectionOwner } from './selection.part04.js';

import { extractMixedSelection, screenPointToContentPoint } from './selection.part05.js';

import { assertSelectionOwner, normalizePoint, rectContainsPoint } from './selection.part06.js';

import { comparePoints } from './selection.part07.js';
export function selectionRange(
  owner: SelectionOwner,
  input: SelectionRangeInput,
): SelectionRange {
  assertSelectionOwner(owner, 'selection range');
  const anchor = screenPointToContentPoint(owner, input.anchor);
  const focus = screenPointToContentPoint(owner, input.focus);
  const direction = comparePoints(anchor, focus) <= 0 ? 'forward' : 'backward';
  const start = direction === 'forward' ? anchor : focus;
  const end = direction === 'forward' ? focus : anchor;

  return Object.freeze({
    ownerId: owner.id,
    anchor,
    focus,
    start,
    end,
    contentRect: selectionRegion(owner).contentRect,
    direction,
    dragSource: input.dragSource ?? 'unknown',
  });
}
export function extractSelectionText(
  content: SelectionContentModel,
  range: SelectionRange,
): string {
  if (content.kind === 'table') {
    return extractTableSelection(content, range);
  }
  if (content.kind === 'mixed') {
    return extractMixedSelection(content, range);
  }

  const lines = content.kind === 'prose' ? content.paragraphs : content.lines;
  return extractLineSelection(lines, range);
}
export function selectionClipboardEffect(
  range: SelectionRange,
  text: string,
): SelectionClipboardEffect {
  return Object.freeze({
    kind: 'clipboard.write',
    ownerId: range.ownerId,
    text,
    facts: Object.freeze([
      Object.freeze({ kind: 'entity', key: 'selection.owner', value: range.ownerId }),
      Object.freeze({ kind: 'state', key: 'clipboard.effect', value: 'pending' }),
    ]),
  });
}
export function coordinateSelection(input: CoordinateSelectionInput): CoordinateSelectionResult {
  const normalizedAnchor = normalizePoint(input.anchor);
  const normalizedFocus = normalizePoint(input.focus);
  const blocker = input.blockers?.find((candidate) => rectContainsPoint(
    candidate.rect,
    normalizedAnchor,
  ));
  if (blocker !== undefined) {
    return Object.freeze({
      status: 'blocked',
      reason: blocker.reason,
      blockerId: blocker.id,
    });
  }

  const owner = pickSelectionOwner(input.owners, normalizedAnchor);
  if (owner === undefined) {
    return Object.freeze({
      status: 'fallback',
      reason: 'terminal-native',
    });
  }

  const range = selectionRange(owner, {
    anchor: normalizedAnchor,
    focus: normalizedFocus,
    dragSource: input.dragSource,
  });
  const text = extractSelectionText(owner.content, range);

  return Object.freeze({
    status: 'selected',
    owner,
    range,
    text,
    effect: selectionClipboardEffect(range, text),
  });
}
