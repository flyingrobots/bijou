import { defineBlock, defineDataRequirement, defineViewData } from '@flyingrobots/bijou';
import type { BlockDefinition, BlockRenderInput, BlockRenderResult } from '@flyingrobots/bijou';
import { DOGFOOD_BLOCK_MODES, DOGFOOD_BLOCK_PACKAGE } from './dogfood-block-common.js';

export interface FooterHintBlockConfig {
  readonly controls?: string;
  readonly activeHint?: string;
  readonly status?: string;
}

export const footerControlsRequirement = defineDataRequirement({
  id: 'footer.controls',
  resource: 'dogfood.frame.footer.controls',
  label: 'Footer controls',
  description: 'Shell-owned controls visible in the DOGFOOD footer hint line.',
  facts: [{ kind: 'entity', key: 'dogfood.block', value: 'FooterHintBlock' }],
});

export const footerStatusRequirement = defineDataRequirement({
  id: 'footer.status',
  resource: 'dogfood.frame.footer.status',
  label: 'Footer status',
  description: 'Optional active pane or page status appended to the footer.',
  optional: true,
  facts: [{ kind: 'entity', key: 'dogfood.block', value: 'FooterHintBlock' }],
});

export const footerHintData = defineViewData({
  id: 'footer-hint.data',
  label: 'FooterHintBlock data',
  description: 'DOGFOOD frame footer controls and active status hints.',
  requirements: [
    { name: 'controls', requirement: footerControlsRequirement },
    { name: 'status', requirement: footerStatusRequirement },
  ],
});

export const footerHintBlock: BlockDefinition<FooterHintBlockConfig, string> = defineBlock({
  metadata: {
    packageName: DOGFOOD_BLOCK_PACKAGE,
    blockName: 'FooterHintBlock',
    family: 'dogfood-shell',
    scale: 'panel',
    modes: DOGFOOD_BLOCK_MODES,
    docs: {
      summary: 'Owns the shell footer hint contract for visible DOGFOOD controls and active status.',
      useWhen: ['DOGFOOD needs to show shell-level key hints or active-pane controls.'],
      avoidWhen: ['A surface needs a full help overlay or command palette.'],
      relatedDocs: ['docs/DOGFOOD.md'],
    },
    sourcePath: 'examples/docs/app.ts',
    slots: [
      { id: 'controls', required: true, description: 'Always-visible shell controls.' },
      { id: 'status', required: false, description: 'Active-pane or page status text.' },
    ],
    variants: [
      {
        id: 'line',
        label: 'Line',
        requiredSlots: ['controls'],
        optionalSlots: ['status'],
        facts: [{ kind: 'state', key: 'dogfood.footer.surface', value: 'line' }],
      },
    ],
    composedComponents: ['createFramedApp() footer', 'localized footer hints'],
    semanticFacts: [{ kind: 'entity', key: 'dogfood.block', value: 'FooterHintBlock' }],
    storyIds: ['footer-hint.line'],
    examples: [{ id: 'dogfood.footer', label: 'DOGFOOD footer hints' }],
    tags: ['dogfood', 'footer', 'shell'],
  },
  data: footerHintData,
  render: renderFooterHintBlock,
});

function renderFooterHintBlock(
  input: BlockRenderInput<FooterHintBlockConfig>,
): BlockRenderResult<string> {
  const parts = [
    input.config?.controls,
    input.config?.activeHint,
    input.config?.status,
  ]
    .map((part) => part?.trim())
    .filter((part): part is string => part != null && part !== '');
  const output = parts.length > 0 ? parts.join(' • ') : 'No footer hints';

  if (input.mode === 'pipe' || input.mode === 'accessible') {
    return {
      output,
      facts: [{ kind: 'entity', key: 'dogfood.block', value: 'FooterHintBlock' }],
    };
  }

  return {
    output: [
      'FooterHintBlock',
      output,
    ].join('\n'),
    facts: [{ kind: 'entity', key: 'dogfood.block', value: 'FooterHintBlock' }],
  };
}
