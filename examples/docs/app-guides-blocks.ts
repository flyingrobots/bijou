import {
  standardBlocks,
  type BlockDefinition,
} from '../../packages/bijou/src/index.js';
import type { GuideDoc } from './app-guide-contract.js';
import {
  BLOCK_PREVIEW_GUIDE_ID,
  BLOCKS_PAGE_ID,
  COUNTER_DEMO_BLOCK_GUIDE_ID,
} from './app-ids.js';
import {
  BLOCKS_LOWERING_TEXT,
  BLOCKS_MAKE_YOUR_OWN_TEXT,
  BLOCKS_PRE_MADE_TEXT,
  BLOCKS_PREVIEW_TEXT,
  BLOCKS_WHAT_ARE_BLOCKS_TEXT,
} from './app-content.js';
import {
  standardBlockDocumentationText,
  standardBlockInventoryMarkdown,
  standardBlockLoweringMarkdown,
} from './app-standard-block-docs.js';
import { dogfoodSurfaceBlockInventoryMarkdown } from './app-dogfood-surface-block-docs.js';
import {
  counterDemoBlock,
  counterDemoDocumentationText,
} from './counter-block-demo.js';
import { dogfoodText } from './app-localization.js';
import { slugify } from './app-slug.js';

export function blockPreviewGuideId(block: BlockDefinition): string {
  return `${BLOCK_PREVIEW_GUIDE_ID}-${slugify(block.metadata.blockName)}`;
}

export function blockPreviewGuideDoc(block: BlockDefinition): GuideDoc {
  return {
    id: blockPreviewGuideId(block),
    pageId: BLOCKS_PAGE_ID,
    title: `  ${block.metadata.blockName}`,
    summary: block.metadata.docs.summary,
    body: standardBlockDocumentationText(block),
  };
}

export function standardBlockForPreviewGuide(
  doc: GuideDoc,
): BlockDefinition | undefined {
  if (doc.pageId !== BLOCKS_PAGE_ID) return undefined;
  return standardBlocks.find(
    (block) => blockPreviewGuideId(block) === doc.id,
  );
}

const COUNTER_DEMO_GUIDE: GuideDoc = {
  id: COUNTER_DEMO_BLOCK_GUIDE_ID,
  pageId: BLOCKS_PAGE_ID,
  title: `  ${counterDemoBlock.metadata.blockName}`,
  summary: counterDemoBlock.metadata.docs.summary,
  body: counterDemoDocumentationText(),
};

export const BLOCK_GUIDES: readonly GuideDoc[] = [
  {
    id: 'blocks-what-are-blocks',
    pageId: BLOCKS_PAGE_ID,
    title: 'What are Blocks',
    summary:
      'The design-system posture for larger, opinionated Bijou assemblies.',
    body: BLOCKS_WHAT_ARE_BLOCKS_TEXT,
  },
  {
    id: 'blocks-make-your-own',
    pageId: BLOCKS_PAGE_ID,
    title: 'How to Make Your Own Blocks',
    summary:
      'The block authoring contract: metadata first, schema adapters at boundaries, and commands as intent.',
    body: BLOCKS_MAKE_YOUR_OWN_TEXT,
  },
  {
    id: 'blocks-pre-made',
    pageId: BLOCKS_PAGE_ID,
    title: 'Pre-made Blocks',
    summary:
      'The first-party standard blocks exported by @flyingrobots/bijou.',
    body: BLOCKS_PRE_MADE_TEXT,
    localizedBody: (localization) =>
      standardBlockInventoryMarkdown(localization),
  },
  {
    id: 'blocks-dogfood-surfaces',
    pageId: BLOCKS_PAGE_ID,
    title: 'blocks-dogfood-surfaces',
    summary: '',
    body: '',
    localizedTitle: (localization) =>
      dogfoodText(
        localization,
        'blocks.surfaceInventory.title',
        'DOGFOOD Surface Blocks',
      ),
    localizedSummary: (localization) =>
      dogfoodText(
        localization,
        'blocks.surfaceInventory.summary',
        'The semantic Blocks DOGFOOD uses for its own visible product surfaces.',
      ),
    localizedBody: (localization) =>
      dogfoodSurfaceBlockInventoryMarkdown(localization),
  },
  {
    id: BLOCK_PREVIEW_GUIDE_ID,
    pageId: BLOCKS_PAGE_ID,
    title: 'Block Preview',
    summary:
      'A code-backed preview index for standard blocks, variants, and declared stories.',
    body: BLOCKS_PREVIEW_TEXT,
  },
  ...standardBlocks.map(blockPreviewGuideDoc),
  COUNTER_DEMO_GUIDE,
  {
    id: 'blocks-lowering',
    pageId: BLOCKS_PAGE_ID,
    title: 'How Blocks Lower',
    summary:
      'How standard block declarations carry mode and semantic facts before rendered block output lands.',
    body: BLOCKS_LOWERING_TEXT,
    localizedBody: (localization) =>
      standardBlockLoweringMarkdown(localization),
  },
];
