import { describe, expect, it } from 'vitest';
import { commandIntent, defineDataProvider, defineDataRequirement, defineViewData, isProviderScope, provide, providerScope } from './binding.js';
import { defineBlock, type BlockMetadata } from './block-metadata.js';
import { AppShellComposition, defineAppShellComposition, isAppShellComposition } from './app-shell-composition.js';

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
  it('composes semantic slots from runtime-backed blocks and explicit provider scopes', () => {
      const navItems = defineDataRequirement({
        id: 'navItems',
        resource: 'docs.navigation',
      });
      const article = defineDataRequirement({
        id: 'article',
        resource: 'docs.article',
      });
      const selection = defineDataRequirement({
        id: 'selection',
        resource: 'docs.selection',
      });
      const navData = defineViewData({
        id: 'navigation.data',
        requirements: [{ name: 'items', requirement: navItems }],
      });
      const readerData = defineViewData({
        id: 'reader.data',
        requirements: [{ name: 'article', requirement: article }],
      });
      const inspectorData = defineViewData({
        id: 'inspector.data',
        requirements: [{ name: 'selection', requirement: selection }],
      });
      const openArticle = commandIntent<{ articleId: string }>('docs.openArticle');
      const selectHeading = commandIntent<{ headingId: string }>('reader.selectHeading');
      const shellProviders = providerScope([
        provide(defineDataProvider({
          id: 'docs.navigationProvider',
          resource: navItems.resource,
        })),
        provide(defineDataProvider({
          id: 'docs.articleProvider',
          resource: article.resource,
        })),
        provide(defineDataProvider({
          id: 'docs.selectionProvider',
          resource: selection.resource,
        })),
      ], { id: 'docs.appShell.providers' });
      const navigationBlock = defineBlock({
        metadata: metadataFor('NavigationList', 'navigation-list'),
        data: navData,
        commands: [openArticle],
        render: () => ({ output: 'navigation' }),
      });
      const readerBlock = defineBlock({
        metadata: metadataFor('ReaderSurface', 'reader-surface'),
        data: readerData,
        commands: [selectHeading],
        render: () => ({ output: 'reader' }),
      });
      const inspectorBlock = defineBlock({
        metadata: metadataFor('InspectorPanel', 'inspector-panel'),
        data: inspectorData,
        render: () => ({ output: 'inspector' }),
      });
      const statusBlock = defineBlock({
        metadata: metadataFor('StatusBar', 'status-bar'),
        render: () => ({ output: 'status' }),
      });

      const composition = defineAppShellComposition({
        id: ' docs.shell ',
        providers: shellProviders,
        slots: {
          navigation: navigationBlock,
          content: [readerBlock],
          inspector: [[inspectorBlock]],
          status: statusBlock,
        },
        facts: [{ kind: 'entity', key: 'shell', value: 'docs' }],
      });

      expect(composition).toBeInstanceOf(AppShellComposition);
      expect(isAppShellComposition(composition)).toBe(true);
      expect(composition.id).toBe('docs.shell');
      expect(isProviderScope(composition.providerScope())).toBe(true);
      expect(composition.providerScope()).toBe(shellProviders);
      expect(composition.slotIds()).toEqual(['navigation', 'content', 'inspector', 'status']);
      expect(composition.slot('navigation')).toEqual([navigationBlock]);
      expect(composition.slot('content')).toEqual([readerBlock]);
      expect(composition.slot('inspector')).toEqual([inspectorBlock]);
      expect(composition.slot('overlays')).toEqual([]);
      expect(composition.blocks()).toEqual([
        navigationBlock,
        readerBlock,
        inspectorBlock,
        statusBlock,
      ]);
      expect(composition.dataContracts()).toEqual([navData, readerData, inspectorData]);
      expect(composition.commandIntents()).toEqual([openArticle, selectHeading]);
      expect(Object.isFrozen(composition)).toBe(true);
      expect(Object.isFrozen(composition.facts)).toBe(true);
      expect(Object.isFrozen(composition.slotIds())).toBe(true);
      expect(Object.isFrozen(composition.slot('content'))).toBe(true);
      expect(Object.isFrozen(composition.slots())).toBe(true);
      expect(Object.isFrozen(composition.slots()[0])).toBe(true);
      expect('render' in composition).toBe(false);
      expect('refresh' in composition).toBe(false);
      expect('subscribe' in composition).toBe(false);
      expect('providers' in composition).toBe(false);
    });
});
