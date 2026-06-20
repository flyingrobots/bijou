import { commandIntent, defineBlock, defineDataRequirement, defineViewData } from '@flyingrobots/bijou';
import type { BlockDefinition, BlockRenderInput, BlockRenderResult } from '@flyingrobots/bijou';
import { DOGFOOD_BLOCK_MODES, DOGFOOD_BLOCK_PACKAGE } from './dogfood-block-common.js';

export interface TitleScreenBlockConfig {
  readonly title?: string;
  readonly subtitle?: string;
}

export const titleRouteRequirement = defineDataRequirement({
  id: 'title.route',
  resource: 'dogfood.route',
  label: 'Current route',
  description: 'Current DOGFOOD route used by the title screen call-to-action posture.',
  facts: [{ kind: 'entity', key: 'dogfood.block', value: 'TitleScreenBlock' }],
});

export const titleScreenData = defineViewData({
  id: 'title-screen.data',
  label: 'TitleScreenBlock data',
  description: 'DOGFOOD title route context.',
  requirements: [
    { name: 'route', requirement: titleRouteRequirement },
  ],
});

export const titleOpenDocsIntent = commandIntent('title.openDocs', {
  label: 'Open docs',
  description: 'Request navigation from the title screen into the documentation app.',
  facts: [{ kind: 'entity', key: 'dogfood.command', value: 'TitleScreenBlock' }],
});

export const titleOpenBlockLabIntent = commandIntent('title.openBlockLab', {
  label: 'Open BlockLab',
  description: 'Request navigation from the title screen into the BlockLab workbench.',
  facts: [{ kind: 'entity', key: 'dogfood.command', value: 'TitleScreenBlock' }],
});

export const titleOpenStorybookIntent = titleOpenBlockLabIntent;

export const titleOpenSettingsIntent = commandIntent('title.openSettings', {
  label: 'Open settings',
  description: 'Request the frame-owned DOGFOOD settings surface.',
  facts: [{ kind: 'entity', key: 'dogfood.command', value: 'TitleScreenBlock' }],
});

export const titleScreenBlock: BlockDefinition<TitleScreenBlockConfig, string> = defineBlock({
  metadata: {
    packageName: DOGFOOD_BLOCK_PACKAGE,
    blockName: 'TitleScreenBlock',
    family: 'dogfood-entry',
    scale: 'app',
    modes: DOGFOOD_BLOCK_MODES,
    docs: {
      summary: 'Introduces Bijou DOGFOOD and routes users toward docs, BlockLab, or settings.',
      useWhen: ['DOGFOOD needs a first screen that exposes app-level entry intents.'],
      avoidWhen: ['A nested documentation article needs local section content.'],
      relatedDocs: ['docs/DOGFOOD.md'],
    },
    sourcePath: 'examples/docs/app.ts',
    slots: [
      { id: 'hero', required: true, description: 'Primary title and value proposition.' },
      { id: 'actions', required: false, description: 'Available entry actions.' },
    ],
    variants: [
      {
        id: 'default',
        label: 'Default',
        requiredSlots: ['hero'],
        optionalSlots: ['actions'],
        facts: [{ kind: 'state', key: 'dogfood.title.layout', value: 'default' }],
      },
    ],
    composedComponents: ['landing page', 'AppFrame settings'],
    semanticFacts: [{ kind: 'entity', key: 'dogfood.block', value: 'TitleScreenBlock' }],
    storyIds: ['title-screen.default'],
    examples: [{ id: 'dogfood.title', label: 'DOGFOOD title screen' }],
    tags: ['dogfood', 'title', 'navigation'],
  },
  data: titleScreenData,
  commands: [
    titleOpenDocsIntent,
    titleOpenBlockLabIntent,
    titleOpenSettingsIntent,
  ],
  render: renderTitleScreenBlock,
});

function renderTitleScreenBlock(
  input: BlockRenderInput<TitleScreenBlockConfig>,
): BlockRenderResult<string> {
  const title = input.config?.title ?? 'Bijou Docs';
  const subtitle = input.config?.subtitle ?? 'Blocks, components, localization, and terminal UI proof.';

  if (input.mode === 'pipe' || input.mode === 'accessible') {
    return {
      output: `${title}: ${subtitle}`,
      facts: [{ kind: 'entity', key: 'dogfood.block', value: 'TitleScreenBlock' }],
    };
  }

  return {
    output: [
      title,
      subtitle,
      'Actions: open docs; open BlockLab; open settings',
    ].join('\n'),
    facts: [{ kind: 'entity', key: 'dogfood.block', value: 'TitleScreenBlock' }],
  };
}
