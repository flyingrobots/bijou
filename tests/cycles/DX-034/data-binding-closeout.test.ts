import { describe, expect, it } from 'vitest';
import {
  activeBindingCollection,
  activeBindingEntry,
  appShellBlock,
  bindingFrameUpdateFromSnapshots,
  bindingSnapshot,
  defineAppShellComposition,
  defineBindingLifecycleOwner,
  defineDataProvider,
  defineDataRequirement,
  inspectorPanelBlock,
  provide,
  providerScope,
  readerSurfaceBlock,
  standardBlockStories,
} from '../../../packages/bijou/src/index.js';
import { readRepoFile } from '../repo.js';

interface ArticleData {
  readonly body: string;
  readonly outline: readonly string[];
}

interface InspectorData {
  readonly selection: string;
  readonly details: readonly string[];
}

describe('DX-034 data binding closeout', () => {
  it('renders a provider-bound AppShell from immutable binding frames', () => {
    const owner = defineBindingLifecycleOwner({ id: 'docs.shell', kind: 'app-shell' });
    const navigation = defineDataRequirement({ id: 'navigation', resource: 'docs.navigation' });
    const content = defineDataRequirement({ id: 'content', resource: 'docs.article' });
    const inspector = defineDataRequirement({ id: 'inspector', resource: 'docs.selection' });
    const status = defineDataRequirement({ id: 'status', resource: 'docs.status' });
    const scope = providerScope([
      provide(defineDataProvider({ id: 'docs.navigationProvider', resource: navigation.resource })),
      provide(defineDataProvider({ id: 'docs.articleProvider', resource: content.resource })),
      provide(defineDataProvider({ id: 'docs.selectionProvider', resource: inspector.resource })),
      provide(defineDataProvider({ id: 'docs.statusProvider', resource: status.resource })),
    ], { id: 'docs.shell.providers' });
    const collection = activeBindingCollection([
      activeBindingEntry({ owner, requirement: navigation, providerId: 'docs.navigationProvider' }),
      activeBindingEntry({ owner, requirement: content, providerId: 'docs.articleProvider' }),
      activeBindingEntry({ owner, requirement: inspector, providerId: 'docs.selectionProvider' }),
      activeBindingEntry({ owner, requirement: status, providerId: 'docs.statusProvider' }),
    ]);
    const composition = defineAppShellComposition({
      id: 'docs.shell',
      providers: scope,
      slots: {
        navigation: readerSurfaceBlock,
        content: readerSurfaceBlock,
        inspector: inspectorPanelBlock,
        status: inspectorPanelBlock,
      },
    });

    const update = bindingFrameUpdateFromSnapshots({
      collection,
      scope,
      snapshots: [
        bindingSnapshot({
          providerId: 'docs.navigationProvider',
          requirementId: 'navigation',
          version: 1,
          status: 'ready',
          data: 'Docs navigation',
        }),
        bindingSnapshot({
          providerId: 'docs.articleProvider',
          requirementId: 'content',
          version: 2,
          status: 'ready',
          data: {
            body: 'DX-034 provider-bound content',
            outline: ['providers', 'commands'],
          } satisfies ArticleData,
        }),
        bindingSnapshot({
          providerId: 'docs.selectionProvider',
          requirementId: 'inspector',
          version: 3,
          status: 'ready',
          data: {
            selection: 'DX-034',
            details: ['ready', 'version 3'],
          } satisfies InspectorData,
        }),
        bindingSnapshot({
          providerId: 'docs.statusProvider',
          requirementId: 'status',
          version: 4,
          status: 'stale',
          data: 'cache updating',
        }),
      ],
    });

    const article = update.frame.require<ArticleData>('content');
    const selection = update.frame.require<InspectorData>('inspector');
    const renderedReader = readerSurfaceBlock.render({
      mode: 'pipe',
      slots: {
        content: article.body,
        outline: article.outline,
      },
    }).output;
    const renderedInspector = inspectorPanelBlock.render({
      mode: 'pipe',
      slots: {
        selection: selection.selection,
        details: selection.details,
      },
    }).output;
    const renderedShell = appShellBlock.render({
      mode: 'pipe',
      slots: {
        navigation: update.frame.require<string>('navigation'),
        content: renderedReader,
        inspector: renderedInspector,
        status: `${update.frame.status('status')}: ${update.frame.get<string>('status')}`,
      },
    });

    expect(composition.providerScope()).toBe(scope);
    expect(composition.slotIds()).toEqual(['navigation', 'content', 'inspector', 'status']);
    expect(update.issues).toEqual([]);
    expect(update.records.map((record) => record.requirementId)).toEqual([
      'navigation',
      'content',
      'inspector',
      'status',
    ]);
    expect(String(renderedShell.output)).toContain('AppShell');
    expect(String(renderedShell.output)).toContain('navigation: Docs navigation');
    expect(String(renderedShell.output)).toContain('DX-034 provider-bound content');
    expect(String(renderedShell.output)).toContain('selection: DX-034');
    expect(String(renderedShell.output)).toContain('status: stale: cache updating');
    expect('provider' in update).toBe(false);
    expect('subscribe' in update).toBe(false);
    expect('refresh' in update).toBe(false);
    expect('dispatch' in update).toBe(false);
  });

  it('keeps binding-state story coverage visible for DOGFOOD and lower modes', () => {
    const storiesByBlock = new Map(
      ['ReaderSurface', 'InspectorPanel'].map((blockName) => [
        blockName,
        standardBlockStories
          .filter((story) => story.blockName === blockName)
          .map((story) => story.state),
      ]),
    );

    expect(storiesByBlock.get('ReaderSurface')).toEqual([
      'ready',
      'loading',
      'stale',
      'empty',
      'error',
    ]);
    expect(storiesByBlock.get('InspectorPanel')).toEqual([
      'ready',
      'empty',
      'loading',
      'stale',
      'error',
    ]);

    const dogfoodBlocksTest = readRepoFile('tests/cycles/DX-031/dogfood-blocks-section.test.ts');
    expect(dogfoodBlocksTest).toContain('lowering summary');
    expect(dogfoodBlocksTest).toContain('standardBlockStories');
  });

  it('marks DX-034 landed in Method evidence after closing issue 182', () => {
    const design = readRepoFile('docs/design/DX-034-declarative-view-data-binding.md');
    const changelog = readRepoFile('docs/CHANGELOG.md');

    expect(design).toContain('DX-034 is landed for the `v6.0.0` release boundary.');
    expect(design).toContain('Provider-bound AppShell proof is present');
    expect(design).toContain('DOGFOOD binding-state proof is present');
    expect(design).not.toContain('16. Next: prove rendered AppShell');
    expect(design).not.toContain('17. Next: add DOGFOOD stories');

    expect(changelog).toContain('DX-034 data binding closeout');
    expect(changelog).toContain('provider-bound AppShell');
  });

  it('keeps compressed v6 lineage pointing to issue 182 evidence', () => {
    const bearing = readRepoFile('docs/BEARING.md');
    const design = readRepoFile('docs/design/DX-034-declarative-view-data-binding.md');
    const roadmap = readRepoFile('docs/ROADMAP.md');
    const backlog = readRepoFile('docs/method/backlog/v6.0.0/README.md');
    const roadmapClosedLineage = sectionBetween(roadmap, '## Closed Lineage', '## Maintenance Rule');

    expect(bearing).not.toContain('[#182](https://github.com/flyingrobots/bijou/issues/182) — `DX-034`');
    expect(roadmapClosedLineage).toContain('`v6.0.0`');
    expect(roadmapClosedLineage).toContain('Skipped public release; complete lineage');
    expect(roadmap).not.toContain('[#182](https://github.com/flyingrobots/bijou/issues/182)');
    expect(design).toContain('contract without keeping issue #182 open');

    expect(backlog).toContain('## Landed Data Binding Anchor');
    expect(backlog).toContain('issue #182');
  });
});

function sectionBetween(source: string, start: string, end: string): string {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);

  expect(startIndex).toBeGreaterThanOrEqual(0);
  expect(endIndex).toBeGreaterThan(startIndex);

  return source.slice(startIndex, endIndex);
}
