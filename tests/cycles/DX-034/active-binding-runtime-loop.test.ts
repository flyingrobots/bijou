import { describe, expect, it } from 'vitest';
import {
  activeBindingCollection,
  activeBindingEntry,
  bindingFrame,
  bindingFrameUpdateFromSnapshots,
  bindingSnapshot,
  commandIntent,
  defineBindingLifecycleOwner,
  defineDataProvider,
  defineDataRequirement,
  defineViewData,
  provide,
  providerScope,
} from '../../../packages/bijou/src/index.js';
import {
  applyRuntimeCommandBuffer,
  createRuntimeCommandBuffer,
  createRuntimeViewStack,
  pushRuntimeView,
} from '../../../packages/bijou-tui/src/runtime-engine.js';
import {
  collectRuntimeViewBindings,
  dispatchRuntimeCommandIntent,
  runtimeActiveBindingLayers,
  runtimeCommandIntentEmission,
  runtimeCommandIntentRoute,
  runtimeViewBindingSource,
} from '../../../packages/bijou-tui/src/runtime-binding.js';
import { readRepoFile } from '../repo.js';

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

  it('routes command intent emissions into the runtime command buffer for later business logic', () => {
    interface Command { readonly type: 'reader.selectHeading'; readonly headingId: string }
    const owner = defineBindingLifecycleOwner({ id: 'reader.view', kind: 'view' });
    const selectHeading = commandIntent<{ readonly headingId: string }>('reader.selectHeading');
    const emission = runtimeCommandIntentEmission(
      selectHeading,
      { headingId: 'intro' },
      { owner },
    );
    const route = runtimeCommandIntentRoute<{ readonly headingId: string }, Command>({
      intent: selectHeading,
      toCommand: (intentEmission) => ({
        type: 'reader.selectHeading',
        headingId: intentEmission.payload.headingId,
      }),
    });

    const dispatched = dispatchRuntimeCommandIntent({
      emission,
      routes: [route],
      buffer: createRuntimeCommandBuffer<Command>(),
    });
    const applied = applyRuntimeCommandBuffer(
      { selectedHeadingId: '' },
      dispatched.buffer,
      (state, command) => ({
        selectedHeadingId: command.headingId,
      }),
    );

    expect(dispatched.buffer.items).toEqual([{
      type: 'reader.selectHeading',
      headingId: 'intro',
    }]);
    expect(applied.state.selectedHeadingId).toBe('intro');
    expect(applied.buffer.items).toEqual([]);
    expect('provider' in emission).toBe(false);
    expect('refresh' in emission).toBe(false);
    expect('subscribe' in emission).toBe(false);
    expect('dispatch' in emission).toBe(false);
  });
  it('documents DX-034G through DX-034I without claiming subscriptions or rendering', () => {
    const cycle = readRepoFile('docs/design/DX-034-declarative-view-data-binding.md');
    const changelog = readRepoFile('docs/CHANGELOG.md');
    expect(cycle).toContain('### DX-034G Active View Binding Collection');
    expect(cycle).toContain('### DX-034H Provider Update Invalidation Flow');
    expect(cycle).toContain('### DX-034I Command Intent Dispatch Proof');
    expect(cycle).toContain('`blocksBelow: false`');
    expect(cycle).toContain('`blocksBelow: true` blocks lower layers');
    expect(cycle).toContain('do not create duplicate invalidations');
    expect(cycle).toContain('DX-034G does not subscribe, refresh, dispatch, render, cache');
    expect(cycle).toContain('DX-034H does not fetch data, subscribe, refresh providers');
    expect(cycle).toContain('Command intents and emissions expose no provider handles');
    expect(changelog).toContain('Runtime binding loop proofs for DX-034');
  });
});
