import { describe, expect, it } from 'vitest';
import {
  defineBlock,
  type BlockDefinition,
} from '@flyingrobots/bijou';
import {
  blockPreviewBlock,
  blockPreviewBlockRegistryEntry,
  DOGFOOD_BLOCK_PACKAGE,
  defaultDogfoodBlockRegistry,
  documentationArticleBlock,
  documentationArticleBlockRegistryEntry,
  dogfoodBlockCoverageReport,
  dogfoodBlockRegistry,
  dogfoodBlockRegistryEntry,
  guideInspectorBlock,
  guideInspectorBlockRegistryEntry,
  isDogfoodBlockRegistry,
  isDogfoodBlockRegistryEntry,
  navigationListBlock,
  navigationListBlockRegistryEntry,
  settingsMenuBlock,
  settingsMenuBlockRegistryEntry,
  storybookWorkbenchBlock,
  storybookWorkbenchBlockRegistryEntry,
  titleScreenBlock,
  titleScreenBlockRegistryEntry,
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
    expect(defaultDogfoodBlockRegistry.blockNames()).toContain('StorybookWorkbenchBlock');
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

  it('publishes the DOGFOOD title screen as an app-level block', () => {
    expect(titleScreenBlockRegistryEntry.block).toBe(titleScreenBlock);
    expect(titleScreenBlockRegistryEntry.role).toBe('title');
    expect(defaultDogfoodBlockRegistry.forSurface('landing.title')).toBe(titleScreenBlockRegistryEntry);
    expect(titleScreenBlock.data?.names()).toEqual(['route']);
    expect(titleScreenBlock.commands?.map((intent) => intent.id)).toEqual([
      'title.openDocs',
      'title.openStorybook',
      'title.openSettings',
    ]);

    expect(titleScreenBlock.render({
      config: {
        title: 'Bijou',
        subtitle: 'Terminal UI proof',
      },
      mode: 'accessible',
    }).output).toBe('Bijou: Terminal UI proof');
  });

  it('publishes DOGFOOD navigation as a selectable block surface', () => {
    expect(navigationListBlockRegistryEntry.block).toBe(navigationListBlock);
    expect(navigationListBlockRegistryEntry.role).toBe('navigation');
    expect(defaultDogfoodBlockRegistry.forSurface('docs.navigation')).toBe(
      navigationListBlockRegistryEntry,
    );
    expect(navigationListBlock.data?.names()).toEqual(['items', 'selection']);
    expect(navigationListBlock.commands?.map((intent) => intent.id)).toEqual([
      'navigation.selectItem',
      'navigation.expandGroup',
      'navigation.collapseGroup',
    ]);

    expect(navigationListBlock.render({
      config: {
        itemCount: 7,
        activeLabel: 'Blocks',
      },
      mode: 'pipe',
    }).output).toBe('Navigation items: 7; active: Blocks');
  });

  it('publishes DOGFOOD documentation articles as semantic content blocks', () => {
    expect(documentationArticleBlockRegistryEntry.block).toBe(documentationArticleBlock);
    expect(documentationArticleBlockRegistryEntry.role).toBe('article');
    expect(defaultDogfoodBlockRegistry.forSurface('docs.article')).toBe(
      documentationArticleBlockRegistryEntry,
    );
    expect(documentationArticleBlock.data?.names()).toEqual(['article', 'headings']);
    expect(documentationArticleBlock.commands?.map((intent) => intent.id)).toEqual([
      'documentation.selectHeading',
      'documentation.openReference',
    ]);

    expect(documentationArticleBlock.render({
      config: {
        title: 'Blocks',
        headingCount: 5,
      },
      mode: 'accessible',
    }).output).toBe('Article: Blocks; headings: 5');
  });

  it('publishes DOGFOOD settings as a frame-owned block surface', () => {
    expect(settingsMenuBlockRegistryEntry.block).toBe(settingsMenuBlock);
    expect(settingsMenuBlockRegistryEntry.role).toBe('settings');
    expect(defaultDogfoodBlockRegistry.forSurface('frame.settings')).toBe(settingsMenuBlockRegistryEntry);
    expect(settingsMenuBlock.data?.names()).toEqual(['sections', 'selection']);
    expect(settingsMenuBlock.commands?.map((intent) => intent.id)).toEqual([
      'settings.activateRow',
      'settings.setLocale',
      'settings.setShellTheme',
    ]);

    expect(settingsMenuBlock.render({
      config: {
        sectionCount: 3,
        activeSettingLabel: 'Locale',
      },
      mode: 'pipe',
    }).output).toBe('Settings sections: 3; active: Locale');
  });

  it('publishes the DOGFOOD Blocks preview as a block-authored surface', () => {
    expect(blockPreviewBlockRegistryEntry.block).toBe(blockPreviewBlock);
    expect(blockPreviewBlockRegistryEntry.role).toBe('preview');
    expect(defaultDogfoodBlockRegistry.forSurface('blocks.preview')).toBe(blockPreviewBlockRegistryEntry);
    expect(blockPreviewBlock.data?.names()).toEqual(['definition', 'modes']);
    expect(blockPreviewBlock.commands?.map((intent) => intent.id)).toEqual([
      'blockPreview.selectBlock',
      'blockPreview.cycleMode',
    ]);

    expect(blockPreviewBlock.render({
      config: {
        blockName: 'ReaderSurface',
        modeCount: 4,
      },
      mode: 'pipe',
    }).output).toBe('Block preview: ReaderSurface; modes: 4');
  });

  it('publishes the DOGFOOD guide inspector as a block-authored surface', () => {
    expect(guideInspectorBlockRegistryEntry.block).toBe(guideInspectorBlock);
    expect(guideInspectorBlockRegistryEntry.role).toBe('inspector');
    expect(defaultDogfoodBlockRegistry.forSurface('guide.inspector')).toBe(
      guideInspectorBlockRegistryEntry,
    );
    expect(guideInspectorBlock.data?.names()).toEqual(['selection', 'facts']);
    expect(guideInspectorBlock.commands?.map((intent) => intent.id)).toEqual([
      'guideInspector.openSource',
      'guideInspector.focusSection',
    ]);

    expect(guideInspectorBlock.render({
      config: {
        selectionLabel: 'Block Preview',
        factCount: 6,
      },
      mode: 'accessible',
    }).output).toBe('Guide inspector: Block Preview; facts: 6');
  });

  it('covers the intended semantic DOGFOOD surfaces without discovery-time rendering', () => {
    const report = dogfoodBlockCoverageReport();

    expect(report.missingSurfaceIds).toEqual([]);
    expect(report.registeredSurfaceIds).toEqual([
      'landing.title',
      'docs.navigation',
      'docs.article',
      'blocks.preview',
      'guide.inspector',
      'frame.settings',
      'storybook.workbench',
    ]);
    expect(defaultDogfoodBlockRegistry.blockNames()).toEqual([
      'TitleScreenBlock',
      'NavigationListBlock',
      'DocumentationArticleBlock',
      'BlockPreviewBlock',
      'GuideInspectorBlock',
      'SettingsMenuBlock',
      'StorybookWorkbenchBlock',
    ]);
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
