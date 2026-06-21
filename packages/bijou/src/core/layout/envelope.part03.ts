import { sanitizeNonNegativeInt } from '../numeric.js';

import type { AssignedLayoutRect, AssignedLayoutRectInput, ContentExtent, ContentExtentInput, LayoutEnvelope, LayoutEnvelopeInput, LayoutFact, LayoutPreference, LayoutPreferenceInput, ResolvedLayoutEnvelope } from './envelope.part01.js';

import type { LayoutRenderInput, LayoutRenderResult } from './envelope.part02.js';

import { contentExtent } from './envelope.part05.js';

import { normalizeBound, normalizeDirection, normalizePreferred } from './envelope.part06.js';

import { normalizeRequiredText } from './envelope.part07.js';
export function layoutPreference(input: LayoutPreferenceInput = {}): LayoutPreference {
  const minInline = sanitizeNonNegativeInt(input.minInline, 0);
  const minBlock = sanitizeNonNegativeInt(input.minBlock, 0);
  const maxInline = normalizeBound(input.maxInline, minInline);
  const maxBlock = normalizeBound(input.maxBlock, minBlock);

  return Object.freeze({
    minInline,
    preferredInline: normalizePreferred(input.preferredInline, minInline, maxInline),
    maxInline,
    minBlock,
    preferredBlock: normalizePreferred(input.preferredBlock, minBlock, maxBlock),
    maxBlock,
  });
}
export function assignedLayoutRect(input: AssignedLayoutRectInput): AssignedLayoutRect {
  return Object.freeze({
    inlineStart: sanitizeNonNegativeInt(input.inlineStart, 0),
    blockStart: sanitizeNonNegativeInt(input.blockStart, 0),
    inlineSize: sanitizeNonNegativeInt(input.inlineSize, 0),
    blockSize: sanitizeNonNegativeInt(input.blockSize, 0),
  });
}
export function defineLayoutEnvelope(input: LayoutEnvelopeInput): LayoutEnvelope {
  const id = normalizeRequiredText(input.id, 'layout envelope: id is required');
  const role = normalizeRequiredText(input.role, 'layout envelope: role is required');
  const direction = normalizeDirection(input.direction);
  const envelope: LayoutEnvelope = {
    id,
    role,
    direction,
    constraints: input.constraints,
    preference: input.preference,
    ...(input.fit === undefined ? {} : { fit: input.fit }),
  };
  return Object.freeze(envelope);
}
export function assignLayoutChild(
  envelope: LayoutEnvelope,
  assigned: AssignedLayoutRectInput,
  reason: string,
): ResolvedLayoutEnvelope {
  const resolved: ResolvedLayoutEnvelope = {
    ...envelope,
    assigned: assignedLayoutRect(assigned),
    reason: normalizeRequiredText(reason, 'layout assignment: reason is required'),
  };
  return Object.freeze(resolved);
}
export function isResolvedLayoutEnvelope(envelope: LayoutEnvelope): envelope is ResolvedLayoutEnvelope {
  return envelope.assigned !== null
    && typeof envelope.assigned === 'object'
    && typeof envelope.reason === 'string'
    && envelope.reason.length > 0;
}
export function renderWithResolvedLayout<Output>(
  envelope: LayoutEnvelope,
  renderer: (input: LayoutRenderInput) => Output,
): LayoutRenderResult<Output> {
  if (!isResolvedLayoutEnvelope(envelope)) {
    throw new Error(`layout render seam: visible node ${envelope.id} requires an assigned layout envelope`);
  }

  const output = renderer({ envelope, assigned: envelope.assigned });
  return Object.freeze({
    envelope,
    assigned: envelope.assigned,
    output,
  });
}
export function contentExtentFromSurface(
  surface: { readonly width: number; readonly height: number },
  facts: readonly LayoutFact[] = [],
): ContentExtent {
  return contentExtent('surface', {
    inlineSize: surface.width,
    blockSize: surface.height,
    facts,
  });
}
export function contentExtentFromBuffer(input: ContentExtentInput): ContentExtent {
  return contentExtent('buffer', {
    inlineSize: input.inlineSize ?? input.width ?? 0,
    blockSize: input.blockSize ?? input.height ?? 0,
    baseline: input.baseline,
    facts: input.facts ?? [],
  });
}
