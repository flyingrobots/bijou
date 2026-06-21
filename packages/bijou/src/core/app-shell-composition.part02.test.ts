import { describe, expect, it } from 'vitest';
import { defineBlock, isBlockDefinition, type BlockMetadata } from './block-metadata.js';
import { defineAppShellComposition } from './app-shell-composition.js';

function loose(input: unknown): true { Reflect.apply(defineAppShellComposition, undefined, [input]); return true; }

function metadataFor(blockName: string, storyId: string): BlockMetadata {
  return {
    packageName: '@flyingrobots/bijou',
    blockName,
    family: 'app-structure',
    scale: 'section',
    modes: ['interactive', 'static', 'pipe', 'accessible'],
    docs: {
      summary: `${blockName} test block.`,
      relatedDocs: ['docs/design/DX-034-declarative-view-data-binding.md'],
    },
    slots: [{ id: 'content' }],
    semanticFacts: [{ kind: 'entity', key: 'block', value: blockName }],
    storyIds: [storyId],
  };
}

describe('app shell composition contract', () => {
  it('rejects physical slots, missing content, and empty slot content', () => {
      const block = defineBlock({
        metadata: metadataFor('ReaderSurface', 'reader-surface'),
        render: () => ({ output: 'reader' }),
      });

      expect(() => loose({
        slots: {
          leftNav: block,
          content: block,
        },
      })).toThrow('app shell composition: unsupported slot leftNav');
      expect(() => loose({
        slots: {
          navigation: block,
        },
      })).toThrow('app shell composition: content slot is required');
      expect(() => defineAppShellComposition({
        slots: {
          content: [],
        },
      })).toThrow('app shell composition: slot content must include at least one block');
    });

  it('rejects loose blocks and loose provider scopes', () => {
      const block = defineBlock({
        metadata: metadataFor('ReaderSurface', 'reader-surface'),
        render: () => ({ output: 'reader' }),
      });

      expect(isBlockDefinition(block)).toBe(true);
      expect(() => loose({
        providers: { id: 'loose' },
        slots: { content: block },
      })).toThrow('app shell composition: providers must be created by providerScope()');
      expect(() => loose({
        slots: {
          content: {
            metadata: metadataFor('LooseReaderSurface', 'loose-reader-surface'),
            render: () => ({ output: 'loose' }),
          },
        },
      })).toThrow('slots.content: slot content must be created by defineBlock()');
      expect(() => loose({
        slots: null,
      })).toThrow('app shell composition: slots must be an object');
      expect(() => loose(null)).toThrow(
        'app shell composition: input must be an object',
      );
    });
});
