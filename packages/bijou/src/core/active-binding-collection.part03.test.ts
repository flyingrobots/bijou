import { describe, expect, it } from 'vitest';
import { commandIntent, defineDataRequirement, defineViewData } from './binding.js';
import { defineBindingLifecycleOwner } from './binding-lifecycle.js';
import { defineBlock, type BlockMetadata } from './block-metadata.js';
import { collectActiveBindings } from './active-binding-collection.js';

const readerMetadata: BlockMetadata = {
  packageName: '@flyingrobots/bijou',
  blockName: 'ReaderSurface',
  family: 'reader',
  scale: 'section',
  modes: ['interactive', 'static', 'pipe', 'accessible'],
  docs: { summary: 'Reader content surface.' },
  slots: [{ id: 'content', required: true }],
};

describe('active binding collection primitives', () => {
  it('collects declared view data contracts without executing block render functions', () => {
      const owner = defineBindingLifecycleOwner({ id: 'reader.view', kind: 'view' });
      const article = defineDataRequirement({ id: 'article', resource: 'docs.article' });
      const outline = defineDataRequirement({ id: 'outline', resource: 'docs.outline' });
      const data = defineViewData({
        requirements: [
          { name: 'article', requirement: article },
          { name: 'outline', requirement: outline },
        ],
      });
      let renderCalls = 0;
      const block = defineBlock({
        metadata: readerMetadata,
        data,
        commands: [commandIntent('reader.selectHeading')],
        render: () => {
          renderCalls += 1;
          return { output: 'rendered' };
        },
      });
      const collection = collectActiveBindings({
        contracts: [{
          owner,
          contract: block.data ?? data,
          providerIds: [
            { requirementId: 'article', providerId: 'docs.articleProvider' },
          ],
        }],
      });
      expect(renderCalls).toBe(0);
      expect(collection.entries().map((entry) => entry.requirement.id)).toEqual([
        'article',
        'outline',
      ]);
      expect(collection.get('reader.view', 'article')?.providerId).toBe(
        'docs.articleProvider',
      );
      expect(collection.get('reader.view', 'outline')?.providerId).toBeUndefined();
      expect('commands' in collection).toBe(false);
      expect('dispatch' in collection).toBe(false);
    });
});
