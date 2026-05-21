import { describe, expect, it } from 'vitest';
import {
  appShellBlock,
  bindingFrameUpdateFromSnapshots,
  bindingSnapshot,
  collectActiveBindings,
  defineBindingLifecycleOwner,
  defineDataProvider,
  provide,
  providerScope,
  readerSurfaceBlock,
} from '@flyingrobots/bijou';

describe('DX-034 provider-bound AppShell proof', () => {
  it('renders AppShell from explicit provider snapshots without provider handles or mutation', () => {
    const owner = defineBindingLifecycleOwner({
      id: 'docs.shell',
      kind: 'app-shell',
      label: 'DOGFOOD shell',
    });
    const collection = collectActiveBindings({
      contracts: [{
        owner,
        contract: readerSurfaceBlock.data!,
        providerIds: [
          { requirementId: 'reader.article', providerId: 'docs.articleProvider' },
          { requirementId: 'reader.outline', providerId: 'docs.outlineProvider' },
        ],
      }],
    });
    const scope = providerScope([
      provide(defineDataProvider({
        id: 'docs.articleProvider',
        resource: 'reader.article',
      })),
      provide(defineDataProvider({
        id: 'docs.outlineProvider',
        resource: 'reader.outline',
      })),
    ], {
      id: 'dogfood.providers',
      label: 'DOGFOOD providers',
    });

    const update = bindingFrameUpdateFromSnapshots({
      collection,
      scope,
      snapshots: [
        bindingSnapshot({
          providerId: 'docs.articleProvider',
          requirementId: 'reader.article',
          version: 1,
          status: 'ready',
          data: {
            title: 'Provider-bound Blocks',
            body: 'AppShell consumes frame data instead of provider handles.',
          },
        }),
        bindingSnapshot({
          providerId: 'docs.outlineProvider',
          requirementId: 'reader.outline',
          version: 1,
          status: 'ready',
          data: ['Frame', 'Render', 'Intent'],
        }),
      ],
    });
    const article = update.frame.require<{ readonly title: string; readonly body: string }>('reader.article');
    const outline = update.frame.get<readonly string[]>('reader.outline');
    const reader = readerSurfaceBlock.render({
      mode: 'pipe',
      slots: {
        content: article.body,
        outline,
      },
    });
    const shell = appShellBlock.render({
      mode: 'pipe',
      slots: {
        navigation: 'Blocks',
        content: reader.output,
        status: update.frame.status('reader.article'),
      },
    });

    expect(update.issues).toEqual([]);
    expect(update.resolutions.map((resolution) => resolution.providerId)).toEqual([
      'docs.articleProvider',
      'docs.outlineProvider',
    ]);
    expect(Object.isFrozen(article)).toBe(true);
    expect(Object.keys(update.frame as object)).not.toContain('provider');
    expect(Object.keys(update.frame as object)).not.toContain('refresh');
    expect(Object.keys(update.frame as object)).not.toContain('subscribe');
    expect(Object.keys(update.frame as object)).not.toContain('dispatch');
    expect(update.records).toHaveLength(2);
    expect(update.records.every((record) => record.state === 'active')).toBe(true);
    expect(update.records.every((record) => record.invalidations.some(
      (invalidation) => invalidation.reason === 'provider-update',
    ))).toBe(true);
    expect(shell.output).toContain('AppShell');
    expect(shell.output).toContain('navigation: Blocks');
    expect(shell.output).toContain('content:');
    expect(shell.output).toContain('ReaderSurface');
    expect(shell.output).toContain('AppShell consumes frame data instead of provider handles.');
    expect(shell.output).toContain('status: ready');

    const nextUpdate = bindingFrameUpdateFromSnapshots({
      collection,
      scope,
      records: update.records,
      snapshots: [
        bindingSnapshot({
          providerId: 'docs.articleProvider',
          requirementId: 'reader.article',
          version: 2,
          status: 'ready',
          data: {
            title: 'Updated Blocks',
            body: 'Provider updates create a new frame.',
          },
        }),
        bindingSnapshot({
          providerId: 'docs.outlineProvider',
          requirementId: 'reader.outline',
          version: 1,
          status: 'ready',
          data: ['Frame', 'Render', 'Intent'],
        }),
      ],
    });

    expect(article.title).toBe('Provider-bound Blocks');
    expect(nextUpdate.frame.require<{ readonly title: string }>('reader.article').title).toBe('Updated Blocks');
    expect(nextUpdate.records.find(
      (record) => record.requirementId === 'reader.article',
    )?.invalidations.map((invalidation) => invalidation.snapshotVersion)).toEqual([1, 2]);
  });
});
