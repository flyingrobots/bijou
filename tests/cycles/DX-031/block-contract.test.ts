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
    expect(blocks).toContain('defineSchemaBlock()');
    expect(blocks).toContain('Schema-bound blocks validate unknown boundary data');
  });

  it('exports public block helpers from the bijou root barrel', () => {
    const rootBarrel = readRepoFile('packages/bijou/src/index.ts');
    const rootBarrelPart3 = readRepoFile('packages/bijou/src/index.part03.ts');
    const rootBarrelPart4 = readRepoFile('packages/bijou/src/index.part04.ts');

    expect(rootBarrel).toContain("export * from './index.part03.js'");
    expect(rootBarrel).toContain("export * from './index.part04.js'");
    expect(rootBarrelPart4).toContain('BlockMetadata');
    expect(rootBarrelPart4).toContain('BlockDefinition');
    expect(rootBarrelPart4).toContain('BlockPackageManifest');
    expect(rootBarrelPart4).toContain('defineBlock');
    expect(rootBarrelPart4).toContain('defineBlockPackage');
    expect(rootBarrelPart4).toContain('validateBlockMetadata');
    expect(rootBarrelPart4).toContain('blockMetadataSummary');
    expect(rootBarrelPart3).toContain('ViewDataContract');
    expect(rootBarrelPart3).toContain('CommandIntent');
    expect(rootBarrelPart4).toContain('defineBlockSchemaAdapter');
    expect(rootBarrelPart4).toContain('defineSchemaBlock');
    expect(rootBarrelPart4).toContain('bindSchemaBlockInput');
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
