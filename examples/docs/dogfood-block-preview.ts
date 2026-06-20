import { commandIntent, defineBlock, defineDataRequirement, defineViewData } from '@flyingrobots/bijou';
import type { BlockDefinition, BlockRenderInput, BlockRenderResult } from '@flyingrobots/bijou';
import { DOGFOOD_BLOCK_MODES, DOGFOOD_BLOCK_PACKAGE, s } from './dogfood-block-common.js';

export interface BlockPreviewBlockConfig {
  readonly blockName?: string;
  readonly modeCount?: number;
}

export const blockPreviewDefinitionRequirement = defineDataRequirement({
  id: 'block-preview.definition',
  resource: 'dogfood.blocks.preview.definition',
  label: 'Preview block definition',
  description: 'Block definition selected for the DOGFOOD Blocks preview.',
  facts: [{ kind: 'entity', key: 'dogfood.block', value: 'BlockPreviewBlock' }],
});

export const blockPreviewModesRequirement = defineDataRequirement({
  id: 'block-preview.modes',
  resource: 'dogfood.blocks.preview.modes',
  label: 'Preview modes',
  description: 'Lowering modes rendered for the selected block preview.',
  facts: [{ kind: 'entity', key: 'dogfood.block', value: 'BlockPreviewBlock' }],
});

export const blockPreviewData = defineViewData({
  id: 'block-preview.data',
  label: 'BlockPreviewBlock data',
  description: 'Selected block definition plus lowering modes.',
  requirements: [
    { name: 'definition', requirement: blockPreviewDefinitionRequirement },
    { name: 'modes', requirement: blockPreviewModesRequirement },
  ],
});

export const blockPreviewSelectBlockIntent = commandIntent<{ readonly blockName: string }>(
  'blockPreview.selectBlock',
  {
    label: 'Select block',
    description: 'Request preview focus for a DOGFOOD or standard block.',
    facts: [{ kind: 'entity', key: 'dogfood.command', value: 'BlockPreviewBlock' }],
  },
);

export const blockPreviewCycleModeIntent = commandIntent<{ readonly direction: -1 | 1 }>(
  'blockPreview.cycleMode',
  {
    label: 'Cycle mode',
    description: 'Request the next or previous lowering mode preview.',
    facts: [{ kind: 'entity', key: 'dogfood.command', value: 'BlockPreviewBlock' }],
  },
);

export const blockPreviewBlock: BlockDefinition<BlockPreviewBlockConfig, string> = defineBlock({
  metadata: {
    packageName: DOGFOOD_BLOCK_PACKAGE,
    blockName: 'BlockPreviewBlock',
    family: 'dogfood-blocks',
    scale: 'section',
    modes: DOGFOOD_BLOCK_MODES,
    docs: {
      summary: 'Owns the DOGFOOD live block preview and lowering summary surface.',
      useWhen: ['DOGFOOD needs to show a selected Block across supported output modes.'],
      avoidWhen: ['A page only needs static catalog metadata without live preview output.'],
      relatedDocs: ['docs/design-system/blocks.md'],
    },
    sourcePath: 'examples/docs/app.ts',
    slots: [
      { id: 'definition', required: true, description: 'Selected block definition and stories.' },
      { id: 'lowering', required: false, description: 'Mode-lowering preview output.' },
    ],
    variants: [
      {
        id: 'live',
        label: 'Live',
        requiredSlots: ['definition'],
        optionalSlots: ['lowering'],
        facts: [{ kind: 'state', key: 'dogfood.blockPreview.mode', value: 'live' }],
      },
    ],
    composedComponents: ['renderBlockTree()', 'boxSurface()', 'viewportSurface()'],
    semanticFacts: [{ kind: 'entity', key: 'dogfood.block', value: 'BlockPreviewBlock' }],
    storyIds: ['block-preview.live'],
    examples: [{ id: 'dogfood.blocks.preview', label: 'DOGFOOD block preview' }],
    tags: ['dogfood', 'blocks', 'preview'],
  },
  data: blockPreviewData,
  commands: [
    blockPreviewSelectBlockIntent,
    blockPreviewCycleModeIntent,
  ],
  render: renderBlockPreviewBlock,
});

function renderBlockPreviewBlock(
  input: BlockRenderInput<BlockPreviewBlockConfig>,
): BlockRenderResult<string> {
  const blockName = input.config?.blockName ?? 'none';
  const modeCount = input.config?.modeCount ?? 0;

  if (input.mode === 'pipe' || input.mode === 'accessible') {
    return {
      output: `Block preview: ${blockName}; modes: ${s(modeCount)}`,
      facts: [{ kind: 'entity', key: 'dogfood.block', value: 'BlockPreviewBlock' }],
    };
  }

  return {
    output: [
      'BlockPreviewBlock',
      `block: ${blockName}`,
      `modes: ${s(modeCount)}`,
      'Intents: select block; cycle mode',
    ].join('\n'),
    facts: [{ kind: 'entity', key: 'dogfood.block', value: 'BlockPreviewBlock' }],
  };
}
