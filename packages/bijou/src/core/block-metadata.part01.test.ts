import { describe, expect, it } from 'vitest';
import { blockMetadataSummary, defineBlock, validateBlockMetadata, type BlockMetadata } from './block-metadata.js';
import { commandIntent, defineDataRequirement, defineViewData } from './binding.js';

const appShellMetadata: BlockMetadata = {
  packageName: '@flyingrobots/bijou',
  blockName: 'AppShell',
  family: 'app-structure',
  scale: 'app',
  modes: ['interactive', 'static', 'pipe', 'accessible'],
  sourcePath: 'packages/bijou/src/core/block-metadata.ts',
  docs: {
    summary: 'Shell composition.',
    useWhen: ['Persistent regions.'],
    avoidWhen: ['A single component is enough.'],
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
      description: 'Spacing rhythm.',
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

function loose(block: object): unknown { return Reflect.apply(defineBlock, undefined, [block]); }

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

  it('attaches inspectable data and command contracts to block definitions', () => {
      const article = defineDataRequirement({
        id: 'article',
        resource: 'docs.article',
      });
      const data = defineViewData({
        id: 'reader.data',
        requirements: [{ name: 'article', requirement: article }],
      });
      const selectHeading = commandIntent<{ headingId: string }>('reader.selectHeading');
      const block = defineBlock({
        metadata: appShellMetadata,
        data,
        commands: [selectHeading],
        render: () => ({ output: 'reader' }),
      });

      expect(block.data).toBe(data);
      expect(block.commands).toEqual([selectHeading]);
      expect(Object.isFrozen(block)).toBe(true);
      expect(Object.isFrozen(block.commands)).toBe(true);
      expect(block.data?.requirement('article')).toBe(article);
      expect(block.commands?.[0]?.id).toBe('reader.selectHeading');
      expect('provider' in block).toBe(false);
      expect('subscribe' in block).toBe(false);
    });

  it('rejects loose block data and command contracts', () => {
      expect(() => loose({
        metadata: appShellMetadata,
        data: {
          id: 'reader.data',
          requirements: [],
        },
        render: () => ({ output: 'reader' }),
      })).toThrow('block definition: data must be created by defineViewData()');
      expect(() => loose({
        metadata: appShellMetadata,
        commands: [{
          id: 'reader.selectHeading',
          facts: [],
        }],
        render: () => ({ output: 'reader' }),
      })).toThrow('block definition: command at index 0 must be created by commandIntent()');
    });
});
