import { commandIntent, defineBlock, defineDataRequirement, defineViewData } from '@flyingrobots/bijou';
import type { BlockDefinition } from '@flyingrobots/bijou';
import { DOGFOOD_BLOCK_MODES, DOGFOOD_BLOCK_PACKAGE } from './dogfood-block-common.js';
import { renderBlockLabWorkbenchBlock } from './dogfood-block-workbench-render.js';

export interface BlockLabWorkbenchBlockConfig {
  readonly storyCount?: number;
  readonly selectedStoryLabel?: string;
  readonly profileLabel?: string;
}

export type StorybookWorkbenchBlockConfig = BlockLabWorkbenchBlockConfig;

export const blockLabStoriesRequirement = defineDataRequirement({
  id: 'blocklab.stories',
  resource: 'dogfood.blocklab.stories',
  label: 'Story catalog',
  description: 'Available component stories for the DOGFOOD BlockLab workbench.',
  facts: [{ kind: 'entity', key: 'dogfood.block', value: 'BlockLabWorkbenchBlock' }],
});

export const storybookStoriesRequirement = blockLabStoriesRequirement;

export const blockLabSelectionRequirement = defineDataRequirement({
  id: 'blocklab.selection',
  resource: 'dogfood.blocklab.selection',
  label: 'Selected story',
  description: 'The active story, variant, and profile in the BlockLab workbench.',
  facts: [{ kind: 'entity', key: 'dogfood.block', value: 'BlockLabWorkbenchBlock' }],
});

export const storybookSelectionRequirement = blockLabSelectionRequirement;

export const blockLabWorkbenchData = defineViewData({
  id: 'blocklab-workbench.data',
  label: 'BlockLabWorkbenchBlock data',
  description: 'DOGFOOD BlockLab catalog and selection data.',
  requirements: [
    { name: 'stories', requirement: blockLabStoriesRequirement },
    { name: 'selection', requirement: blockLabSelectionRequirement },
  ],
});

export const storybookWorkbenchData = blockLabWorkbenchData;

export const blockLabSelectStoryIntent = commandIntent<{ readonly storyId: string }>(
  'blocklab.selectStory',
  {
    label: 'Select story',
    description: 'Request focus for a component story.',
    facts: [{ kind: 'entity', key: 'dogfood.command', value: 'BlockLabWorkbenchBlock' }],
  },
);

export const storybookSelectStoryIntent = blockLabSelectStoryIntent;

export const blockLabCycleVariantIntent = commandIntent<{ readonly direction: -1 | 1 }>(
  'blocklab.cycleVariant',
  {
    label: 'Cycle variant',
    description: 'Request the next or previous variant for the selected story.',
    facts: [{ kind: 'entity', key: 'dogfood.command', value: 'BlockLabWorkbenchBlock' }],
  },
);

export const storybookCycleVariantIntent = blockLabCycleVariantIntent;

export const blockLabSetProfileIntent = commandIntent<{ readonly profileIndex: number }>(
  'blocklab.setProfile',
  {
    label: 'Set profile',
    description: 'Request a viewport/profile preset for the selected story.',
    facts: [{ kind: 'entity', key: 'dogfood.command', value: 'BlockLabWorkbenchBlock' }],
  },
);

export const storybookSetProfileIntent = blockLabSetProfileIntent;

export const blockLabWorkbenchBlock: BlockDefinition<BlockLabWorkbenchBlockConfig, string> = defineBlock({
  metadata: {
    packageName: DOGFOOD_BLOCK_PACKAGE,
    blockName: 'BlockLabWorkbenchBlock',
    family: 'dogfood-workbench',
    scale: 'app',
    modes: DOGFOOD_BLOCK_MODES,
    docs: {
      summary: 'Frames the component story catalog, live preview, testing notes, and footer controls.',
      useWhen: [
        'DOGFOOD needs to present component stories inside the same app frame posture as docs.',
      ],
      avoidWhen: [
        'A production app needs to embed a single component preview without the DOGFOOD story catalog.',
      ],
      relatedDocs: ['docs/design/DF-069-block-authored-dogfood.md'],
    },
    sourcePath: 'examples/docs/storybook-app.ts',
    slots: [
      { id: 'catalog', required: true, description: 'Story catalog navigation.' },
      { id: 'preview', required: true, description: 'Live component story preview.' },
      { id: 'testing', required: false, description: 'Mode-lowering and interaction notes.' },
      { id: 'footer', required: false, description: 'Workbench key hints and status text.' },
    ],
    variants: [
      {
        id: 'wide',
        label: 'Wide',
        requiredSlots: ['catalog', 'preview'],
        optionalSlots: ['testing', 'footer'],
        facts: [{ kind: 'state', key: 'dogfood.blocklab.layout', value: 'wide' }],
      },
      {
        id: 'narrow',
        label: 'Narrow',
        requiredSlots: ['preview'],
        optionalSlots: ['catalog', 'testing', 'footer'],
        facts: [{ kind: 'state', key: 'dogfood.blocklab.layout', value: 'narrow' }],
      },
    ],
    composedComponents: ['createFramedApp()', 'viewportSurface()', 'browsableListSurface()'],
    semanticFacts: [{ kind: 'entity', key: 'dogfood.block', value: 'BlockLabWorkbenchBlock' }],
    storyIds: ['blocklab.workbench.wide', 'blocklab.workbench.narrow'],
    examples: [{ id: 'blocklab.dogfood', label: 'DOGFOOD BlockLab workbench' }],
    tags: ['dogfood', 'blocklab', 'workbench', 'app-frame'],
  },
  data: blockLabWorkbenchData,
  commands: [
    blockLabSelectStoryIntent,
    blockLabCycleVariantIntent,
    blockLabSetProfileIntent,
  ],
  render: renderBlockLabWorkbenchBlock,
});

export const storybookWorkbenchBlock = blockLabWorkbenchBlock;
