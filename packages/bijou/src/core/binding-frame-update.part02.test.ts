import { describe, expect, it } from 'vitest';
import { activeBindingCollection, activeBindingEntry } from './active-binding-collection.js';
import { bindingSnapshot, defineDataProvider, defineDataRequirement, provide, providerScope } from './binding.js';
import { defineBindingLifecycleOwner } from './binding-lifecycle.js';
import { bindingFrameUpdateFromSnapshots } from './binding-frame-update.js';

describe('binding frame updates from provider snapshots', () => {
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
      expect(() => {
        Reflect.apply(bindingFrameUpdateFromSnapshots, undefined, [null]);
      }).toThrow('binding frame update: input must be an object');
      expect(() => {
        Reflect.apply(bindingFrameUpdateFromSnapshots, undefined, [[]]);
      }).toThrow('binding frame update: input must be an object');
    });
});
