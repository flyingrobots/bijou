import { describe, expect, it } from 'vitest';
import {
  blockMetadataSummary,
  commandIntent,
  defineBlock,
  defineBlockPackage,
  defineDataRequirement,
  defineViewData,
  validateBlockMetadata,
  type BlockMetadata,
} from '../../../packages/bijou/src/index.js';
import { readRepoFile } from '../repo.js';

const readerSurfaceMetadata: BlockMetadata = {
  packageName: '@flyingrobots/bijou',
  blockName: 'ReaderSurface',
  family: 'content-reading',
  scale: 'section',
  modes: ['interactive', 'static', 'pipe', 'accessible'],
  docs: {
    summary: 'Composes a readable content region with optional navigation and outline slots.',
    relatedDocs: ['docs/design/DX-031-standard-bijou-blocks.md'],
  },
  slots: [
    { id: 'content', required: true },
    { id: 'navigation', required: false },
    { id: 'outline', required: false },
  ],
  variants: [
    {
      id: 'docs-reader',
      label: 'Docs reader',
      requiredSlots: ['content'],
      optionalSlots: ['navigation', 'outline'],
      facts: [{ kind: 'entity', key: 'region', value: 'content' }],
    },
  ],
  configOptions: [
    {
      id: 'density',
      kind: 'enum',
      values: ['comfortable', 'compact'],
    },
  ],
  composedComponents: ['markdown', 'viewportSurface'],
  semanticFacts: [{ kind: 'entity', key: 'block', value: 'ReaderSurface' }],
  storyIds: ['reader-surface/docs-reader'],
  tags: ['content', 'docs'],
};

describe('DX-031 block contract cycle', () => {
  it('keeps the active cycle doc tied to the landed block contract slice', () => {
    const cycle = readRepoFile('docs/design/DX-031-standard-bijou-blocks.md');

    expect(cycle).toContain('## Block Contract');
    expect(cycle).toContain('## Public Block API And Distribution');
    expect(cycle).toContain('## Implementation Outline');
    expect(cycle).toContain('## Acceptance Criteria');
    expect(cycle).toContain('## Playback');
    expect(cycle).toContain('DX-031A Block Contract');
    expect(cycle).toContain('defineBlock()');
    expect(cycle).toContain('defineBlockPackage()');
    expect(cycle).toContain('validateBlockMetadata()');
  });

  it('documents the current public block contract from the design-system entrypoint', () => {
    const blocks = readRepoFile('docs/design-system/blocks.md');

    expect(blocks).toContain('## Current public contract');
    expect(blocks).toContain('BlockMetadata');
    expect(blocks).toContain('BlockPackageManifest');
    expect(blocks).toContain('defineBlock()');
    expect(blocks).toContain('Schema-bound blocks remain a follow-on');
  });

  it('exports public block helpers from the bijou root barrel', () => {
    const rootBarrel = readRepoFile('packages/bijou/src/index.ts');

    expect(rootBarrel).toContain('BlockMetadata');
    expect(rootBarrel).toContain('BlockDefinition');
    expect(rootBarrel).toContain('BlockPackageManifest');
    expect(rootBarrel).toContain('defineBlock');
    expect(rootBarrel).toContain('defineBlockPackage');
    expect(rootBarrel).toContain('validateBlockMetadata');
    expect(rootBarrel).toContain('blockMetadataSummary');
    expect(rootBarrel).toContain('ViewDataContract');
    expect(rootBarrel).toContain('CommandIntent');
  });

  it('lets authors define a block and package manifest without global registration', () => {
    const article = defineDataRequirement({
      id: 'article',
      resource: 'docs.article',
    });
    const data = defineViewData({
      id: 'reader.data',
      requirements: [{ name: 'article', requirement: article }],
    });
    const openArticle = commandIntent<{ articleId: string }>('reader.openArticle');
    const block = defineBlock({
      metadata: readerSurfaceMetadata,
      data,
      commands: [openArticle],
      render: ({ slots }) => ({
        output: slots?.content ?? '',
        facts: [{ kind: 'entity', key: 'block', value: 'ReaderSurface' }],
      }),
    });
    const manifest = defineBlockPackage({
      packageName: '@example/bijou-blocks-docs',
      version: '1.0.0',
      bijouPeerRange: '^5.0.0',
      blocks: [block.metadata.blockName],
      docs: ['docs/README.md'],
      tags: ['docs'],
    });

    expect(validateBlockMetadata(block.metadata).passed).toBe(true);
    expect(blockMetadataSummary(block.metadata)).toContain('requiredSlots=content');
    expect(block.render({ slots: { content: 'hello' } }).output).toBe('hello');
    expect(block.data?.requirement('article')).toBe(article);
    expect(block.commands?.[0]).toBe(openArticle);
    expect(manifest.blocks).toEqual(['ReaderSurface']);
  });
});
