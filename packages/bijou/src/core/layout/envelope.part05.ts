import { sanitizeNonNegativeInt } from '../numeric.js';

import type { ContentExtent, LayoutFact, ResolvedLayoutEnvelope } from './envelope.part01.js';

import { fact, formatPreference, formatRange, freezeFacts } from './envelope.part07.js';
export function layoutExplanationFacts(envelope: ResolvedLayoutEnvelope): readonly LayoutFact[] {
  return Object.freeze([
    fact('node.id', envelope.id),
    fact('role', envelope.role),
    fact('direction', envelope.direction),
    fact('constraints.inline', formatRange(envelope.constraints.minInline, envelope.constraints.maxInline)),
    fact('constraints.block', formatRange(envelope.constraints.minBlock, envelope.constraints.maxBlock)),
    fact('preference.inline', formatPreference(
      envelope.preference.minInline,
      envelope.preference.preferredInline,
      envelope.preference.maxInline,
    )),
    fact('preference.block', formatPreference(
      envelope.preference.minBlock,
      envelope.preference.preferredBlock,
      envelope.preference.maxBlock,
    )),
    fact('assigned', [
      `inline-start ${String(envelope.assigned.inlineStart)}`,
      `block-start ${String(envelope.assigned.blockStart)}`,
      `inline-size ${String(envelope.assigned.inlineSize)}`,
      `block-size ${String(envelope.assigned.blockSize)}`,
    ].join(' ')),
    fact('reason', envelope.reason),
  ]);
}
export function layoutExplanationText(envelope: ResolvedLayoutEnvelope): string {
  const facts = layoutExplanationFacts(envelope);
  return [
    `node ${envelope.id}`,
    ...facts
      .filter((item) => item.key !== 'node.id')
      .map((item) => `${item.key} ${String(item.value)}`),
  ].join('\n');
}
export function contentExtent(source: ContentExtent['source'], input: Omit<ContentExtent, 'source'>): ContentExtent {
  const extent: ContentExtent = {
    source,
    inlineSize: sanitizeNonNegativeInt(input.inlineSize, 0),
    blockSize: sanitizeNonNegativeInt(input.blockSize, 0),
    ...(input.baseline === undefined ? {} : { baseline: sanitizeNonNegativeInt(input.baseline, 0) }),
    facts: freezeFacts(input.facts),
  };
  return Object.freeze(extent);
}
