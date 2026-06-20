import { commandIntent, defineBlock, defineDataRequirement, defineViewData } from '@flyingrobots/bijou';
import type { BlockDefinition } from '@flyingrobots/bijou';
import { DOGFOOD_BLOCK_MODES, DOGFOOD_BLOCK_PACKAGE } from './dogfood-block-common.js';
import { renderNavigationListBlock } from './dogfood-block-navigation-list-render.js';

export interface NavigationListBlockConfig {
  readonly itemCount?: number;
  readonly activeLabel?: string;
  readonly activeItemId?: string;
  readonly items?: readonly NavigationListBlockItem[];
}

export interface NavigationListBlockItem {
  readonly id: string;
  readonly label: string;
  readonly depth?: number;
}

export const navigationItemsRequirement = defineDataRequirement({
  id: 'navigation.items',
  resource: 'dogfood.navigation.items',
  label: 'Navigation items',
  description: 'Visible DOGFOOD navigation groups and rows.',
  facts: [{ kind: 'entity', key: 'dogfood.block', value: 'NavigationListBlock' }],
});

export const navigationSelectionRequirement = defineDataRequirement({
  id: 'navigation.selection',
  resource: 'dogfood.navigation.selection',
  label: 'Navigation selection',
  description: 'Focused or active DOGFOOD navigation row.',
  facts: [{ kind: 'entity', key: 'dogfood.block', value: 'NavigationListBlock' }],
});

export const navigationListData = defineViewData({
  id: 'navigation-list.data',
  label: 'NavigationListBlock data',
  description: 'DOGFOOD navigation rows and selected item.',
  requirements: [
    { name: 'items', requirement: navigationItemsRequirement },
    { name: 'selection', requirement: navigationSelectionRequirement },
  ],
});

export const navigationSelectItemIntent = commandIntent<{ readonly itemId: string }>(
  'navigation.selectItem',
  {
    label: 'Select item',
    description: 'Request activation of a DOGFOOD navigation row.',
    facts: [{ kind: 'entity', key: 'dogfood.command', value: 'NavigationListBlock' }],
  },
);

export const navigationExpandGroupIntent = commandIntent<{ readonly groupId: string }>(
  'navigation.expandGroup',
  {
    label: 'Expand group',
    description: 'Request expansion of a DOGFOOD navigation group.',
    facts: [{ kind: 'entity', key: 'dogfood.command', value: 'NavigationListBlock' }],
  },
);

export const navigationCollapseGroupIntent = commandIntent<{ readonly groupId: string }>(
  'navigation.collapseGroup',
  {
    label: 'Collapse group',
    description: 'Request collapse of a DOGFOOD navigation group.',
    facts: [{ kind: 'entity', key: 'dogfood.command', value: 'NavigationListBlock' }],
  },
);

export const navigationListBlock: BlockDefinition<NavigationListBlockConfig, string> = defineBlock({
  metadata: {
    packageName: DOGFOOD_BLOCK_PACKAGE,
    blockName: 'NavigationListBlock',
    family: 'dogfood-navigation',
    scale: 'panel',
    modes: DOGFOOD_BLOCK_MODES,
    docs: {
      summary: 'Owns DOGFOOD section and guide navigation as selectable semantic rows.',
      useWhen: ['DOGFOOD needs selectable navigation with explicit command intents.'],
      avoidWhen: ['A component only needs a local menu without app navigation semantics.'],
      relatedDocs: ['docs/DOGFOOD.md'],
    },
    sourcePath: 'examples/docs/app.ts',
    slots: [
      { id: 'items', required: true, description: 'Navigation rows and groups.' },
      { id: 'selection', required: false, description: 'Current focused or active row.' },
    ],
    variants: [
      {
        id: 'docs-sidebar',
        label: 'Docs sidebar',
        requiredSlots: ['items'],
        optionalSlots: ['selection'],
        facts: [{ kind: 'state', key: 'dogfood.navigation.scope', value: 'docs-sidebar' }],
      },
    ],
    composedComponents: ['browsableListSurface()', 'viewportSurface()'],
    semanticFacts: [{ kind: 'entity', key: 'dogfood.block', value: 'NavigationListBlock' }],
    storyIds: ['navigation-list.docs-sidebar'],
    examples: [{ id: 'dogfood.navigation', label: 'DOGFOOD docs navigation' }],
    tags: ['dogfood', 'navigation', 'selection'],
  },
  data: navigationListData,
  commands: [
    navigationSelectItemIntent,
    navigationExpandGroupIntent,
    navigationCollapseGroupIntent,
  ],
  render: renderNavigationListBlock,
});
