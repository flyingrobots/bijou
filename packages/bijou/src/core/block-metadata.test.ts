import { describe, expect, it } from 'vitest';
import {
  blockMetadataReportText,
  blockMetadataSummary,
  blockPackageManifestReportText,
  blockPackageManifestSummary,
  defineBlock,
  defineBlockPackage,
  validateBlockMetadata,
  validateBlockPackageManifest,
  type BlockMetadata,
} from './block-metadata.js';

const appShellMetadata: BlockMetadata = {
  packageName: '@flyingrobots/bijou',
  blockName: 'AppShell',
  family: 'app-structure',
  scale: 'app',
  modes: ['interactive', 'static', 'pipe', 'accessible'],
  sourcePath: 'packages/bijou/src/core/block-metadata.ts',
  docs: {
    summary: 'Top-level shell composition with named navigation, content, inspector, and status regions.',
    useWhen: ['An app needs a standard frame with persistent regions.'],
    avoidWhen: ['A single in-flow component is enough.'],
    relatedDocs: ['docs/design/DX-031-standard-bijou-blocks.md'],
  },
  slots: [
    { id: 'navigation', label: 'Navigation', required: true },
    { id: 'content', label: 'Content', required: true },
    { id: 'inspector', label: 'Inspector', required: false },
    { id: 'status', label: 'Status', required: false },
  ],
  variants: [
    {
      id: 'docs-shell',
      label: 'Docs shell',
      requiredSlots: ['navigation', 'content'],
      optionalSlots: ['inspector', 'status'],
      facts: [{ kind: 'entity', key: 'region', value: 'content' }],
    },
  ],
  configOptions: [
    {
      id: 'density',
      kind: 'enum',
      values: ['comfortable', 'compact'],
      description: 'Controls default spacing rhythm.',
    },
  ],
  composedComponents: ['createFramedApp', 'viewportSurface'],
  semanticFacts: [
    { kind: 'entity', key: 'block', value: 'AppShell' },
    { kind: 'state', key: 'layoutVariant' },
  ],
  storyIds: ['app-shell/docs-shell'],
  examples: [
    { id: 'dogfood', label: 'DOGFOOD shell', path: 'examples/docs/app.ts' },
  ],
  tags: ['shell', 'layout'],
};

describe('block metadata contract', () => {
  it('validates and summarizes block metadata', () => {
    const block = defineBlock({
      metadata: appShellMetadata,
      render: () => ({
        output: 'app shell',
        facts: [{ kind: 'entity', key: 'block', value: 'AppShell' }],
      }),
    });

    expect(validateBlockMetadata(block.metadata).issues).toEqual([]);
    expect(blockMetadataSummary(block.metadata)).toBe([
      'block metadata: @flyingrobots/bijou/AppShell',
      'family=app-structure',
      'scale=app',
      'modes=interactive,static,pipe,accessible',
      'slots=navigation,content,inspector,status',
      'requiredSlots=navigation,content',
      'variants=docs-shell',
      'config=density',
      'components=createFramedApp,viewportSurface',
      'facts=entity:block=AppShell,state:layoutVariant',
      'stories=app-shell/docs-shell',
      'source=packages/bijou/src/core/block-metadata.ts',
    ].join('\n'));
  });

  it('reports missing fields, empty lists, duplicate ids, and unknown slot references deterministically', () => {
    const report = validateBlockMetadata({
      packageName: '',
      blockName: '   ',
      family: 'app-structure',
      scale: 'app',
      modes: ['pipe', 'pipe'],
      docs: { summary: '' },
      slots: [
        { id: 'content' },
        { id: 'content' },
      ],
      variants: [
        {
          id: 'docs-shell',
          label: 'Docs shell',
          requiredSlots: ['content', 'missing'],
        },
        {
          id: 'docs-shell',
          label: 'Docs shell duplicate',
        },
      ],
      configOptions: [
        { id: 'density', kind: 'enum' },
        { id: 'density', kind: 'string' },
      ],
      storyIds: ['app-shell', 'app-shell'],
    });

    expect(report.passed).toBe(false);
    expect(report.issues.map((issue) => issue.path)).toEqual([
      'packageName',
      'blockName',
      'docs.summary',
      'modes[1]',
      'slots[1].id',
      'variants[0].requiredSlots[1]',
      'variants[1].id',
      'configOptions[0].values',
      'configOptions[1].id',
      'storyIds[1]',
    ]);
    expect(blockMetadataReportText(report)).toContain(
      '- error unknown-reference path=variants[0].requiredSlots[1]: unknown slot reference missing',
    );
  });

  it('reports unsupported enum-like values from untyped package consumers', () => {
    const report = validateBlockMetadata({
      ...appShellMetadata,
      scale: 'workspace' as never,
      modes: ['interactive', 'screen' as never],
    });

    expect(report.passed).toBe(false);
    expect(report.issues.map((issue) => issue.path)).toEqual([
      'scale',
      'modes[1]',
    ]);
    expect(blockMetadataReportText(report)).toContain(
      '- error invalid-value path=scale: unsupported block scale workspace',
    );
  });

  it('throws on invalid block definitions', () => {
    expect(() => defineBlock({
      metadata: {
        ...appShellMetadata,
        family: '',
      },
      render: () => ({ output: 'invalid' }),
    })).toThrow('block metadata: failed');
  });

  it('validates block package manifests without registering globals', () => {
    const manifest = defineBlockPackage({
      packageName: '@example/bijou-blocks-shell',
      version: '1.0.0',
      bijouPeerRange: '^5.0.0',
      blocks: ['AppShell', 'ReaderSurface'],
      docs: ['docs/README.md'],
      tags: ['shell', 'docs'],
    });

    expect(validateBlockPackageManifest(manifest).issues).toEqual([]);
    expect(blockPackageManifestSummary(manifest)).toBe([
      'block package: @example/bijou-blocks-shell@1.0.0',
      'bijouPeerRange=^5.0.0',
      'blocks=AppShell,ReaderSurface',
      'docs=docs/README.md',
      'tags=shell,docs',
    ].join('\n'));
  });

  it('reports invalid block package manifests deterministically', () => {
    const report = validateBlockPackageManifest({
      packageName: '',
      version: '',
      bijouPeerRange: '',
      blocks: ['AppShell', 'AppShell'],
      docs: ['docs/README.md', 'docs/README.md'],
      tags: ['shell', 'shell'],
    });

    expect(report.passed).toBe(false);
    expect(report.issues.map((issue) => issue.path)).toEqual([
      'packageName',
      'version',
      'bijouPeerRange',
      'blocks[1]',
      'docs[1]',
      'tags[1]',
    ]);
    expect(blockPackageManifestReportText(report)).toContain(
      '- error duplicate-id path=blocks[1]: duplicate block id AppShell',
    );
  });
});
