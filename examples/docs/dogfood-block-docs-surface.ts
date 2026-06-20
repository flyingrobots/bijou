import { defineBlock } from '@flyingrobots/bijou';
import type { BlockDefinition } from '@flyingrobots/bijou';
import { DOGFOOD_BLOCK_MODES, DOGFOOD_BLOCK_PACKAGE } from './dogfood-block-common.js';
import {
  docsCopyLinkIntent,
  docsNavigateIntent,
  docsOpenProofIntent,
  docsSearchIntent,
  dogfoodDocsSurfaceData,
} from './dogfood-block-docs-surface-data.js';
import { renderDogfoodDocsSurfaceBlock } from './dogfood-block-docs-surface-render.js';
import type { DogfoodDocsSurfaceBlockConfig } from './dogfood-block-docs-surface-types.js';

export const dogfoodDocsSurfaceBlock: BlockDefinition<DogfoodDocsSurfaceBlockConfig, string> = defineBlock({
  metadata: {
    packageName: DOGFOOD_BLOCK_PACKAGE,
    blockName: 'DogfoodDocsSurfaceBlock',
    family: 'docs-surface',
    scale: 'workspace',
    modes: DOGFOOD_BLOCK_MODES,
    docs: {
      summary: 'Owns the canonical DOGFOOD docs workspace across navigation, reader, search, and proof artifacts.',
      useWhen: ['DOGFOOD needs one inspectable Block contract for the documentation app surface.'],
      avoidWhen: ['A page only needs one local article, nav list, or search overlay.'],
      relatedDocs: ['docs/DOGFOOD.md', 'docs/design/DF-030-dogfood-docs-surface-block.md'],
    },
    sourcePath: 'examples/docs/app.ts',
    slots: [
      { id: 'navigation', required: true, description: 'Docs tree and selected route.' },
      { id: 'reader', required: true, description: 'Selected documentation reader content.' },
      { id: 'search', required: false, description: 'Current search query and hit count.' },
      { id: 'proofPanel', required: false, description: 'Linked proof artifact inventory.' },
    ],
    variants: [
      {
        id: 'canonical',
        label: 'Canonical docs',
        requiredSlots: ['navigation', 'reader'],
        optionalSlots: ['search', 'proofPanel'],
        facts: [{ kind: 'state', key: 'dogfood.docsSurface.layout', value: 'canonical' }],
      },
    ],
    composedComponents: [
      'NavigationListBlock',
      'DocumentationArticleBlock',
      'SearchPanelBlock',
      'GuideInspectorBlock',
      'createDocsApp()',
    ],
    semanticFacts: [{ kind: 'entity', key: 'dogfood.block', value: 'DogfoodDocsSurfaceBlock' }],
    storyIds: ['dogfood-docs-surface.canonical'],
    examples: [{ id: 'dogfood.docs.surface', label: 'DOGFOOD docs surface' }],
    tags: ['dogfood', 'docs', 'surface', 'canonical'],
  },
  data: dogfoodDocsSurfaceData,
  commands: [
    docsNavigateIntent,
    docsSearchIntent,
    docsOpenProofIntent,
    docsCopyLinkIntent,
  ],
  render: renderDogfoodDocsSurfaceBlock,
});
