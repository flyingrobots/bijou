import { commandIntent, defineBlock, defineDataRequirement, defineViewData } from '@flyingrobots/bijou';
import type { BlockDefinition } from '@flyingrobots/bijou';
import { DOGFOOD_BLOCK_MODES, DOGFOOD_BLOCK_PACKAGE } from './dogfood-block-common.js';
import { renderGuideInspectorBlock } from './dogfood-block-guide-inspector-render.js';

export interface GuideInspectorBlockSection {
  readonly title: string;
  readonly content: string;
  readonly tone?: 'default' | 'muted';
}

export interface GuideInspectorBlockConfig {
  readonly selectionLabel?: string;
  readonly factCount?: number;
  readonly sections?: readonly GuideInspectorBlockSection[];
}

export const guideInspectorSelectionRequirement = defineDataRequirement({
  id: 'guide-inspector.selection',
  resource: 'dogfood.guide.inspector.selection',
  label: 'Guide selection',
  description: 'Current section or block selection shown in the DOGFOOD guide inspector.',
  facts: [{ kind: 'entity', key: 'dogfood.block', value: 'GuideInspectorBlock' }],
});

export const guideInspectorFactsRequirement = defineDataRequirement({
  id: 'guide-inspector.facts',
  resource: 'dogfood.guide.inspector.facts',
  label: 'Guide facts',
  description: 'Facts, posture, and source links for the selected DOGFOOD guide row.',
  optional: true,
  facts: [{ kind: 'entity', key: 'dogfood.block', value: 'GuideInspectorBlock' }],
});

export const guideInspectorData = defineViewData({
  id: 'guide-inspector.data',
  label: 'GuideInspectorBlock data',
  description: 'DOGFOOD guide selection details and facts.',
  requirements: [
    { name: 'selection', requirement: guideInspectorSelectionRequirement },
    { name: 'facts', requirement: guideInspectorFactsRequirement },
  ],
});

export const guideInspectorOpenSourceIntent = commandIntent<{ readonly sourcePath: string }>(
  'guideInspector.openSource',
  {
    label: 'Open source',
    description: 'Request opening the source path for the selected guide row.',
    facts: [{ kind: 'entity', key: 'dogfood.command', value: 'GuideInspectorBlock' }],
  },
);

export const guideInspectorFocusSectionIntent = commandIntent<{ readonly sectionId: string }>(
  'guideInspector.focusSection',
  {
    label: 'Focus section',
    description: 'Request focus for another section related to the current inspector row.',
    facts: [{ kind: 'entity', key: 'dogfood.command', value: 'GuideInspectorBlock' }],
  },
);

export const guideInspectorBlock: BlockDefinition<GuideInspectorBlockConfig, string> = defineBlock({
  metadata: {
    packageName: DOGFOOD_BLOCK_PACKAGE,
    blockName: 'GuideInspectorBlock',
    family: 'dogfood-inspector',
    scale: 'panel',
    modes: DOGFOOD_BLOCK_MODES,
    docs: {
      summary: 'Owns the DOGFOOD side inspector for selected guide rows and block facts.',
      useWhen: ['DOGFOOD needs a semantic side panel explaining the current docs selection.'],
      avoidWhen: ['A surface needs to render primary documentation content.'],
      relatedDocs: ['docs/DOGFOOD.md'],
    },
    sourcePath: 'examples/docs/app.ts',
    slots: [
      { id: 'selection', required: true, description: 'Current selected guide row.' },
      { id: 'facts', required: false, description: 'Selection facts, posture, and source hints.' },
    ],
    variants: [
      {
        id: 'guide-info',
        label: 'Guide info',
        requiredSlots: ['selection'],
        optionalSlots: ['facts'],
        facts: [{ kind: 'state', key: 'dogfood.inspector.surface', value: 'guide-info' }],
      },
    ],
    composedComponents: ['inspector()', 'boxSurface()'],
    semanticFacts: [{ kind: 'entity', key: 'dogfood.block', value: 'GuideInspectorBlock' }],
    storyIds: ['guide-inspector.guide-info'],
    examples: [{ id: 'dogfood.guide.inspector', label: 'DOGFOOD guide inspector' }],
    tags: ['dogfood', 'inspector', 'facts'],
  },
  data: guideInspectorData,
  commands: [
    guideInspectorOpenSourceIntent,
    guideInspectorFocusSectionIntent,
  ],
  render: renderGuideInspectorBlock,
});
