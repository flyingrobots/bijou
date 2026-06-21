import { sanitizeNonNegativeInt } from './numeric.js';

import { SELECTION_OWNER_BRAND } from './selection.part01.js';

import type { SelectionBlocker, SelectionBlockerReason, SelectionDragSource, SelectionOwner, SelectionOwnerInput, SelectionPoint, SelectionRange, SelectionRegion } from './selection.part01.js';

import { freezeContentModel } from './selection.part05.js';

import { assertSelectionOwner, freezeRect, normalizeRect, normalizeRequiredText } from './selection.part06.js';

import { normalizeInt } from './selection.part07.js';
export interface CoordinateSelectionInput {
  readonly owners: readonly SelectionOwner[];
  readonly blockers?: readonly SelectionBlocker[];
  readonly anchor: SelectionPoint;
  readonly focus: SelectionPoint;
  readonly dragSource?: SelectionDragSource;
}
export interface SelectionFact {
  readonly kind: string;
  readonly key: string;
  readonly value: string | number | boolean;
}
export interface SelectionClipboardEffect {
  readonly kind: 'clipboard.write';
  readonly ownerId: string;
  readonly text: string;
  readonly facts: readonly SelectionFact[];
}
export type CoordinateSelectionResult =
  | {
      readonly status: 'selected';
      readonly owner: SelectionOwner;
      readonly range: SelectionRange;
      readonly text: string;
      readonly effect: SelectionClipboardEffect;
    }
  | {
      readonly status: 'blocked';
      readonly reason: SelectionBlockerReason;
      readonly blockerId: string;
    }
  | {
      readonly status: 'fallback';
      readonly reason: 'terminal-native';
    };
export function defineSelectionOwner(input: SelectionOwnerInput): SelectionOwner {
  const id = normalizeRequiredText({
    scope: 'selection owner',
    field: 'id',
    value: input.id,
  });
  const layoutNodeId = normalizeRequiredText({
    scope: 'selection owner',
    field: 'layoutNodeId',
    value: input.layoutNodeId,
  });
  const rect = freezeRect(normalizeRect(input.rect));
  const viewport = Object.freeze({
    scrollX: sanitizeNonNegativeInt(input.viewport?.scrollX),
    scrollY: sanitizeNonNegativeInt(input.viewport?.scrollY),
  });
  const policy = input.policy ?? 'selectable';
  if (policy !== 'selectable' && policy !== 'disabled') {
    throw new Error(`selection owner ${id}: unsupported policy ${policy}`);
  }

  return Object.freeze<SelectionOwner>({
    [SELECTION_OWNER_BRAND]: true,
    id,
    layoutNodeId,
    rect,
    viewport,
    policy,
    zIndex: normalizeInt(input.zIndex, 0),
    content: freezeContentModel(input.content),
  });
}
export function isSelectionOwner(value: unknown): value is SelectionOwner {
  return (
    typeof value === 'object'
    && value !== null
    && (value as Partial<SelectionOwner>)[SELECTION_OWNER_BRAND] === true
  );
}
export function selectionRegion(owner: SelectionOwner): SelectionRegion {
  assertSelectionOwner(owner, 'selection region');
  const contentRect = Object.freeze({
    x: owner.viewport.scrollX,
    y: owner.viewport.scrollY,
    width: owner.rect.width,
    height: owner.rect.height,
  });

  return Object.freeze({
    ownerId: owner.id,
    layoutNodeId: owner.layoutNodeId,
    screenRect: owner.rect,
    contentRect,
    clippingRect: owner.rect,
    zIndex: owner.zIndex,
    enabled: owner.policy === 'selectable',
  });
}
