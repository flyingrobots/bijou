import { describe, expect, it } from 'vitest';
import {
  defineBlock,
  type BlockDefinition,
} from '@flyingrobots/bijou';
import {
  DOGFOOD_BLOCK_PACKAGE,
  defaultDogfoodBlockRegistry,
  dogfoodBlockRegistry,
  dogfoodBlockRegistryEntry,
  isDogfoodBlockRegistry,
  isDogfoodBlockRegistryEntry,
  storybookWorkbenchBlock,
  storybookWorkbenchBlockRegistryEntry,
  type DogfoodBlockRegistryEntry,
} from '../../../examples/docs/dogfood-blocks.js';

describe('DF-069 DOGFOOD block registry primitives', () => {
  it('creates frozen registry entries around branded block definitions without rendering', () => {
    let renderCalls = 0;
    const block = testBlock('NavigationListBlock', () => {
      renderCalls += 1;
      return 'navigation';
    });
    const entry = dogfoodBlockRegistryEntry({
      block,
      role: 'navigation',
      surfaceId: 'docs.nav',
      tags: ['primary', 'docs'],
    });
    const registry = dogfoodBlockRegistry([entry]);

    expect(isDogfoodBlockRegistryEntry(entry)).toBe(true);
    expect(isDogfoodBlockRegistry(registry)).toBe(true);
    expect(Object.isFrozen(entry)).toBe(true);
    expect(Object.isFrozen(entry.tags)).toBe(true);
    expect(Object.isFrozen(registry)).toBe(true);
    expect(renderCalls).toBe(0);
    expect(registry.blockNames()).toEqual(['NavigationListBlock']);
    expect(registry.surfaceIds()).toEqual(['docs.nav']);
    expect(registry.roles()).toEqual(['navigation']);
    expect(registry.forSurface(' docs.nav ')).toBe(entry);
    expect(registry.forBlock(' NavigationListBlock ')).toBe(entry);
  });

  it('rejects loose block-shaped objects and unsupported roles from untyped callers', () => {
    const block = testBlock('DocumentationArticleBlock');

    expect(() => dogfoodBlockRegistryEntry({
      block: { ...block } as BlockDefinition,
      role: 'article',
      surfaceId: 'docs.article',
    })).toThrow();

    expect(() => dogfoodBlockRegistryEntry({
      block,
      role: 'prop-soup' as never,
      surfaceId: 'docs.article',
    })).toThrow();
  });

  it('rejects duplicate block and surface ownership', () => {
    const article = dogfoodBlockRegistryEntry({
      block: testBlock('DocumentationArticleBlock'),
      role: 'article',
      surfaceId: 'docs.article',
    });
    const articleAgain = dogfoodBlockRegistryEntry({
      block: testBlock('DocumentationArticleBlock'),
      role: 'article',
      surfaceId: 'docs.article.alt',
    });
    const conflictingSurface = dogfoodBlockRegistryEntry({
      block: testBlock('GuideInspectorBlock'),
      role: 'inspector',
      surfaceId: 'docs.article',
    });

    expect(() => dogfoodBlockRegistry([article, articleAgain])).toThrow();
    expect(() => dogfoodBlockRegistry([article, conflictingSurface])).toThrow();
  });

  it('returns immutable snapshots and keeps block discovery free of provider handles', () => {
    const entry = dogfoodBlockRegistryEntry({
      block: testBlock('SettingsMenuBlock'),
      role: 'settings',
      surfaceId: 'docs.settings',
      description: 'DOGFOOD settings menu surface.',
    });
    const registry = dogfoodBlockRegistry([entry]);
    const entries = registry.entries() as DogfoodBlockRegistryEntry[];

    expect(() => entries.push(entry)).toThrow();
    expect(() => (registry.surfaceIds() as string[]).push('docs.other')).toThrow();
    expect(Object.keys(entry)).not.toContain('provider');
    expect(Object.keys(entry)).not.toContain('providerHandle');
    expect(Object.keys(entry)).not.toContain('subscription');
    expect(Object.keys(entry)).not.toContain('refresh');
    expect(Object.keys(entry)).not.toContain('dispatch');
    expect(Object.keys(entry)).not.toContain('render');
  });

  it('creates new registries through with() without mutating previous collections', () => {
    const title = dogfoodBlockRegistryEntry({
      block: testBlock('TitleScreenBlock'),
      role: 'title',
      surfaceId: 'landing.title',
    });
    const settings = dogfoodBlockRegistryEntry({
      block: testBlock('SettingsMenuBlock'),
      role: 'settings',
      surfaceId: 'docs.settings',
    });
    const registry = dogfoodBlockRegistry([title]);
    const next = registry.with(settings);

    expect(registry.blockNames()).toEqual(['TitleScreenBlock']);
    expect(next.blockNames()).toEqual(['TitleScreenBlock', 'SettingsMenuBlock']);
    expect(next.forSurface('docs.settings')).toBe(settings);
  });

  it('publishes Storybook as an inspectable DOGFOOD workbench block', () => {
    expect(storybookWorkbenchBlockRegistryEntry.block).toBe(storybookWorkbenchBlock);
    expect(storybookWorkbenchBlockRegistryEntry.role).toBe('workbench');
    expect(defaultDogfoodBlockRegistry.forSurface('storybook.workbench')).toBe(
      storybookWorkbenchBlockRegistryEntry,
    );
    expect(defaultDogfoodBlockRegistry.blockNames()).toEqual(['StorybookWorkbenchBlock']);
    expect(storybookWorkbenchBlock.data?.names()).toEqual(['stories', 'selection']);
    expect(storybookWorkbenchBlock.commands?.map((intent) => intent.id)).toEqual([
      'storybook.selectStory',
      'storybook.cycleVariant',
      'storybook.setProfile',
    ]);

    const output = storybookWorkbenchBlock.render({
      config: {
        storyCount: 12,
        selectedStoryLabel: 'Button / Primary',
        profileLabel: 'desktop',
      },
      mode: 'pipe',
    }).output;

    expect(output).toBe(
      'StorybookWorkbench stories: 12; selected: Button / Primary; profile: desktop',
    );
  });
});

function testBlock(
  blockName: string,
  render: () => string = () => blockName,
): BlockDefinition<unknown, string> {
  return defineBlock({
    metadata: {
      packageName: DOGFOOD_BLOCK_PACKAGE,
      blockName,
      family: 'dogfood-fixtures',
      scale: 'section',
      modes: ['interactive', 'static', 'pipe', 'accessible'],
      docs: {
        summary: `${blockName} test block.`,
      },
      slots: [
        { id: 'content', required: true },
      ],
      semanticFacts: [{ kind: 'entity', key: 'block', value: blockName }],
    },
    render: () => ({ output: render() }),
  });
}
