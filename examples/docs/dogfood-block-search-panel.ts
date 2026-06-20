import { commandIntent, defineBlock, defineDataRequirement, defineViewData } from '@flyingrobots/bijou';
import type { BlockDefinition } from '@flyingrobots/bijou';
import { DOGFOOD_BLOCK_MODES, DOGFOOD_BLOCK_PACKAGE } from './dogfood-block-common.js';
import { renderSearchPanelBlock } from './dogfood-block-search-panel-render.js';

export interface SearchPanelBlockConfig {
  readonly title?: string;
  readonly query?: string;
  readonly resultCount?: number;
  readonly activeResultLabel?: string;
}

export const searchQueryRequirement = defineDataRequirement({
  id: 'search.query',
  resource: 'dogfood.search.query',
  label: 'Search query',
  description: 'Current DOGFOOD search query.',
  facts: [{ kind: 'entity', key: 'dogfood.block', value: 'SearchPanelBlock' }],
});

export const searchItemsRequirement = defineDataRequirement({
  id: 'search.items',
  resource: 'dogfood.search.items',
  label: 'Search results',
  description: 'Visible DOGFOOD search result rows.',
  facts: [{ kind: 'entity', key: 'dogfood.block', value: 'SearchPanelBlock' }],
});

export const searchSelectionRequirement = defineDataRequirement({
  id: 'search.selection',
  resource: 'dogfood.search.selection',
  label: 'Search selection',
  description: 'Focused DOGFOOD search result.',
  optional: true,
  facts: [{ kind: 'entity', key: 'dogfood.block', value: 'SearchPanelBlock' }],
});

export const searchPanelData = defineViewData({
  id: 'search-panel.data',
  label: 'SearchPanelBlock data',
  description: 'DOGFOOD search query, results, and focused row.',
  requirements: [
    { name: 'query', requirement: searchQueryRequirement },
    { name: 'items', requirement: searchItemsRequirement },
    { name: 'selection', requirement: searchSelectionRequirement },
  ],
});

export const searchSubmitQueryIntent = commandIntent<{ readonly query: string }>(
  'search.submitQuery',
  {
    label: 'Submit query',
    description: 'Request DOGFOOD search results for the active query.',
    facts: [{ kind: 'entity', key: 'dogfood.command', value: 'SearchPanelBlock' }],
  },
);

export const searchSelectResultIntent = commandIntent<{ readonly resultId: string }>(
  'search.selectResult',
  {
    label: 'Select result',
    description: 'Request activation of a DOGFOOD search result.',
    facts: [{ kind: 'entity', key: 'dogfood.command', value: 'SearchPanelBlock' }],
  },
);

export const searchDismissIntent = commandIntent('search.dismiss', {
  label: 'Dismiss search',
  description: 'Request closing the DOGFOOD search surface.',
  facts: [{ kind: 'entity', key: 'dogfood.command', value: 'SearchPanelBlock' }],
});

export const searchPanelBlock: BlockDefinition<SearchPanelBlockConfig, string> = defineBlock({
  metadata: {
    packageName: DOGFOOD_BLOCK_PACKAGE,
    blockName: 'SearchPanelBlock',
    family: 'dogfood-search',
    scale: 'panel',
    modes: DOGFOOD_BLOCK_MODES,
    docs: {
      summary: 'Owns the DOGFOOD search query and result-selection command contract.',
      useWhen: ['DOGFOOD needs a searchable command or page picker surface.'],
      avoidWhen: ['A surface only needs local filtering without global search semantics.'],
      relatedDocs: ['docs/DOGFOOD.md'],
    },
    sourcePath: 'examples/docs/app.ts',
    slots: [
      { id: 'query', required: true, description: 'Current search query.' },
      { id: 'items', required: true, description: 'Visible search results.' },
      { id: 'selection', required: false, description: 'Focused search result.' },
    ],
    variants: [
      {
        id: 'overlay',
        label: 'Overlay',
        requiredSlots: ['query', 'items'],
        optionalSlots: ['selection'],
        facts: [{ kind: 'state', key: 'dogfood.search.surface', value: 'overlay' }],
      },
    ],
    composedComponents: ['createFramedApp() search', 'browsableListSurface()'],
    semanticFacts: [{ kind: 'entity', key: 'dogfood.block', value: 'SearchPanelBlock' }],
    storyIds: ['search-panel.overlay'],
    examples: [{ id: 'dogfood.search', label: 'DOGFOOD search panel' }],
    tags: ['dogfood', 'search', 'frame'],
  },
  data: searchPanelData,
  commands: [
    searchSubmitQueryIntent,
    searchSelectResultIntent,
    searchDismissIntent,
  ],
  render: renderSearchPanelBlock,
});
