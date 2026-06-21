import { describe, expect, it } from 'vitest';
import { activeBindingCollection, activeBindingEntry, bindingFrame, bindingFrameUpdateFromSnapshots, bindingSnapshot, defineBindingLifecycleOwner, defineDataProvider, defineDataRequirement, defineViewData, provide, providerScope } from '../../../packages/bijou/src/index.js';
import { createRuntimeViewStack, pushRuntimeView } from '../../../packages/bijou-tui/src/runtime-engine.js';
import { collectRuntimeViewBindings, runtimeActiveBindingLayers, runtimeViewBindingSource } from '../../../packages/bijou-tui/src/runtime-binding.js';

describe('DX-034G/H/I active binding runtime loop', () => {
  it('collects active runtime view binding sources without rendering or subscribing', () => {
      const shellOwner = defineBindingLifecycleOwner({ id: 'docs.shell', kind: 'app-shell' });
      const overlayOwner = defineBindingLifecycleOwner({ id: 'docs.overlay', kind: 'view' });
      const modalOwner = defineBindingLifecycleOwner({ id: 'docs.modal', kind: 'view' });
      const article = defineDataRequirement({ id: 'article', resource: 'docs.article' });
      const overlayHelp = defineDataRequirement({ id: 'overlayHelp', resource: 'docs.help' });
      const modalChoice = defineDataRequirement({ id: 'modalChoice', resource: 'docs.choice' });
      const shellSource = runtimeViewBindingSource({
        owner: shellOwner,
        contract: defineViewData({
          requirements: [{ name: 'article', requirement: article }],
        }),
        providerIds: [{ requirementId: 'article', providerId: 'docs.articleProvider' }],
      });
      const overlaySource = runtimeViewBindingSource({
        owner: overlayOwner,
        contract: defineViewData({
          requirements: [{ name: 'overlayHelp', requirement: overlayHelp }],
        }),
      });
      const modalSource = runtimeViewBindingSource({
        owner: modalOwner,
        contract: defineViewData({
          requirements: [{ name: 'modalChoice', requirement: modalChoice }],
        }),
      });
      const shellStack = createRuntimeViewStack({
        id: 'docs-shell',
        kind: 'app-shell',
        dismissible: false,
        blocksBelow: false,
        model: { bindingSources: [shellSource] },
      });
      const overlayStack = pushRuntimeView(shellStack, {
        id: 'help-overlay',
        kind: 'overlay',
        dismissible: true,
        blocksBelow: false,
        model: { bindingSources: [overlaySource] },
      });
      const modalStack = pushRuntimeView(overlayStack, {
        id: 'choice-modal',
        kind: 'modal',
        dismissible: true,
        blocksBelow: true,
        model: { bindingSources: [modalSource] },
      });

      expect(runtimeActiveBindingLayers(overlayStack).map((layer) => layer.id)).toEqual([
        'docs-shell',
        'help-overlay',
      ]);
      expect(collectRuntimeViewBindings(overlayStack).entries().map((entry) => entry.requirement.id)).toEqual([
        'article',
        'overlayHelp',
      ]);
      expect(runtimeActiveBindingLayers(modalStack).map((layer) => layer.id)).toEqual([
        'choice-modal',
      ]);
      expect(collectRuntimeViewBindings(modalStack).entries().map((entry) => entry.requirement.id)).toEqual([
        'modalChoice',
      ]);
    });

  it('turns provider snapshots into a new frame and lifecycle invalidation facts', () => {
      const owner = defineBindingLifecycleOwner({ id: 'reader.view', kind: 'view' });
      const article = defineDataRequirement({ id: 'article', resource: 'docs.article' });
      const collection = activeBindingCollection([
        activeBindingEntry({ owner, requirement: article }),
      ]);
      const scope = providerScope([
        provide(defineDataProvider({
          id: 'docs.articleProvider',
          resource: 'docs.article',
        })),
      ]);
      const oldFrame = bindingFrame([
        bindingSnapshot({
          providerId: 'docs.articleProvider',
          requirementId: 'article',
          version: 1,
          status: 'ready',
          data: { title: 'Before' },
        }),
      ]);

      const update = bindingFrameUpdateFromSnapshots({
        collection,
        scope,
        snapshots: [
          bindingSnapshot({
            providerId: 'docs.articleProvider',
            requirementId: 'article',
            version: 2,
            status: 'ready',
            data: { title: 'After' },
          }),
        ],
      });

      expect(oldFrame.require<{ title: string }>('article').title).toBe('Before');
      expect(update.frame.require<{ title: string }>('article').title).toBe('After');
      expect(update.records[0]?.invalidations).toEqual([
        {
          requirementId: 'article',
          providerId: 'docs.articleProvider',
          reason: 'provider-update',
          snapshotVersion: 2,
        },
      ]);
      expect('provider' in update).toBe(false);
      expect('refresh' in update).toBe(false);
      expect('subscribe' in update).toBe(false);
    });
});
