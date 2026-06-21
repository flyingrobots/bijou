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
  describe,
  expect,
  inspectorPanelBlock,
  it,
  provide,
  providerScope,
  readerSurfaceBlock,
} from './data-binding-closeout.test-support.js';

import type { ArticleData, InspectorData } from './data-binding-closeout.test-support.js';

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
    const statusSlot = update.frame.status('status') ?? 'missing';
    const statusText = update.frame.get<string>('status') ?? '';
    const renderedShell = appShellBlock.render({
      mode: 'pipe',
      slots: {
        navigation: update.frame.require<string>('navigation'),
        content: renderedReader,
        inspector: renderedInspector,
        status: `${statusSlot}: ${statusText}`,
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
});
