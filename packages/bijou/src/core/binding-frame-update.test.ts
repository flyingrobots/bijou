import { describe, expect, it } from 'vitest';
import {
  activeBindingCollection,
  activeBindingEntry,
} from './active-binding-collection.js';
import {
  bindingFrame,
  bindingSnapshot,
  defineDataProvider,
  defineDataRequirement,
  provide,
  providerScope,
} from './binding.js';
import {
  defineBindingLifecycleOwner,
} from './binding-lifecycle.js';
import {
  bindingFrameUpdateFromSnapshots,
} from './binding-frame-update.js';

describe('binding frame updates from provider snapshots', () => {
  it('creates a new frame and invalidated lifecycle records without mutating the previous frame', () => {
    const owner = defineBindingLifecycleOwner({ id: 'reader.view', kind: 'view' });
    const article = defineDataRequirement({
      id: 'article',
      resource: 'docs.article',
      facts: [{ kind: 'entity', key: 'resource', value: 'article' }],
    });
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
    expect(update.records).toEqual([
      {
        owner,
        requirementId: 'article',
        providerId: 'docs.articleProvider',
        state: 'active',
        version: 2,
        invalidations: [{
          requirementId: 'article',
          providerId: 'docs.articleProvider',
          reason: 'provider-update',
          snapshotVersion: 2,
        }],
        transitions: [{
          from: 'active',
          to: 'active',
          reason: 'invalidate',
        }],
        facts: [{ kind: 'entity', key: 'resource', value: 'article' }],
      },
    ]);
    expect(update.issues).toEqual([]);
    expect(Object.isFrozen(update)).toBe(true);
    expect(Object.isFrozen(update.records)).toBe(true);
    expect(Object.isFrozen(update.frame)).toBe(true);
  });

  it('does not re-invalidate lifecycle records for already-applied snapshot versions', () => {
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
    const snapshot = bindingSnapshot({
      providerId: 'docs.articleProvider',
      requirementId: 'article',
      version: 2,
      status: 'ready',
      data: { title: 'After' },
    });
    const firstUpdate = bindingFrameUpdateFromSnapshots({
      collection,
      scope,
      snapshots: [snapshot],
    });

    const secondUpdate = bindingFrameUpdateFromSnapshots({
      collection,
      scope,
      snapshots: [snapshot],
      records: firstUpdate.records,
    });

    expect(firstUpdate.records[0]?.invalidations).toEqual([{
      requirementId: 'article',
      providerId: 'docs.articleProvider',
      reason: 'provider-update',
      snapshotVersion: 2,
    }]);
    expect(secondUpdate.records[0]).toBe(firstUpdate.records[0]);
    expect(secondUpdate.records[0]?.invalidations).toHaveLength(1);
    expect(secondUpdate.records[0]?.version).toBe(firstUpdate.records[0]?.version);
  });

  it('reports missing or provider-mismatched snapshots without exposing provider handles', () => {
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
    const update = bindingFrameUpdateFromSnapshots({
      collection,
      scope,
      snapshots: [
        bindingSnapshot({
          providerId: 'docs.otherProvider',
          requirementId: 'article',
          version: 1,
          status: 'ready',
          data: { title: 'Wrong source' },
        }),
      ],
    });

    expect(update.frame.get('article')).toBeUndefined();
    expect(update.records[0]?.version).toBe(1);
    expect(update.issues.map((issue) => issue.code)).toEqual(['snapshot.provider-mismatch']);
    expect('provider' in update).toBe(false);
    expect('refresh' in update).toBe(false);
    expect('subscribe' in update).toBe(false);
    expect('dispatch' in update).toBe(false);
  });

  it('treats explicit active binding provider assignments as authoritative', () => {
    const owner = defineBindingLifecycleOwner({ id: 'reader.view', kind: 'view' });
    const article = defineDataRequirement({ id: 'article', resource: 'docs.article' });
    const collection = activeBindingCollection([
      activeBindingEntry({
        owner,
        requirement: article,
        providerId: 'docs.expectedProvider',
      }),
    ]);
    const scope = providerScope([
      provide(defineDataProvider({
        id: 'docs.actualProvider',
        resource: 'docs.article',
      })),
    ]);
    const update = bindingFrameUpdateFromSnapshots({
      collection,
      scope,
      snapshots: [
        bindingSnapshot({
          providerId: 'docs.actualProvider',
          requirementId: 'article',
          version: 1,
          status: 'ready',
          data: { title: 'Wrong provider' },
        }),
      ],
    });

    expect(update.frame.get('article')).toBeUndefined();
    expect(update.records).toEqual([
      {
        owner,
        requirementId: 'article',
        providerId: 'docs.expectedProvider',
        state: 'active',
        version: 1,
        invalidations: [],
        transitions: [],
        facts: [],
      },
    ]);
    expect(update.issues.map((issue) => issue.code)).toEqual([
      'provider.assignment-mismatch',
    ]);
  });

  it('throws deterministic errors for non-object frame update inputs', () => {
    expect(() => bindingFrameUpdateFromSnapshots(null as never)).toThrow(
      'binding frame update: input must be an object',
    );
    expect(() => bindingFrameUpdateFromSnapshots([] as never)).toThrow(
      'binding frame update: input must be an object',
    );
  });
});
