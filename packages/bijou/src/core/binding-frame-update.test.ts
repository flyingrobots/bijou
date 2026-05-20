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
});
