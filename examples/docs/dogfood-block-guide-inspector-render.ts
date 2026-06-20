import type { BlockRenderInput, BlockRenderResult } from '@flyingrobots/bijou';
import { s } from './dogfood-block-common.js';
import type { GuideInspectorBlockConfig } from './dogfood-block-guide-inspector.js';

export function renderGuideInspectorBlock(
  input: BlockRenderInput<GuideInspectorBlockConfig>,
): BlockRenderResult<string> {
  const selectionLabel = input.config?.selectionLabel ?? 'none';
  const sections = input.config?.sections ?? [];
  const factCount = input.config?.factCount ?? sections.length;

  if (input.mode === 'pipe' || input.mode === 'accessible') {
    if (sections.length > 0) {
      return {
        output: [
          `Guide inspector: ${selectionLabel}`,
          ...sections.map((section) => `${section.title}: ${section.content}`),
        ].join('\n'),
        facts: [{ kind: 'entity', key: 'dogfood.block', value: 'GuideInspectorBlock' }],
      };
    }

    return {
      output: `Guide inspector: ${selectionLabel}; facts: ${s(factCount)}`,
      facts: [{ kind: 'entity', key: 'dogfood.block', value: 'GuideInspectorBlock' }],
    };
  }

  if (sections.length > 0) {
    return {
      output: [
        'GuideInspectorBlock',
        `selection: ${selectionLabel}`,
        ...sections.flatMap((section) => [
          `${section.title}:`,
          section.content,
        ]),
      ].join('\n'),
      facts: [{ kind: 'entity', key: 'dogfood.block', value: 'GuideInspectorBlock' }],
    };
  }

  return {
    output: [
      'GuideInspectorBlock',
      `selection: ${selectionLabel}`,
      `facts: ${s(factCount)}`,
      'Intents: open source; focus section',
    ].join('\n'),
    facts: [{ kind: 'entity', key: 'dogfood.block', value: 'GuideInspectorBlock' }],
  };
}
