import { describe, expect, it } from 'vitest';
import { defineDataRequirement, defineViewData } from './binding.js';
import { defineBindingLifecycleOwner } from './binding-lifecycle.js';
import { activeBindingCollection, activeBindingEntry, collectActiveBindings } from './active-binding-collection.js';

function loose(fn: unknown, ...args: readonly unknown[]): unknown { if (typeof fn !== 'function') throw new TypeError('Expected function'); const result: unknown = Reflect.apply(fn, undefined, args); return result; }

describe('active binding collection primitives', () => {
  it('rejects duplicate active entries and loose owner, requirement, or entry objects', () => {
      const owner = defineBindingLifecycleOwner({ id: 'reader.view', kind: 'view' });
      const article = defineDataRequirement({ id: 'article', resource: 'docs.article' });
      expect(() => loose(activeBindingEntry, {
        owner: { id: 'reader.view', kind: 'view' },
        requirement: article,
      })).toThrow(
        'active binding entry: owner was not created by defineBindingLifecycleOwner()',
      );
      expect(() => loose(activeBindingEntry, {
        owner,
        requirement: { id: 'article', resource: 'docs.article' },
      })).toThrow(
        'active binding entry: requirement was not created by defineDataRequirement()',
      );
      expect(() => activeBindingEntry({
        owner,
        requirement: article,
        providerId: '   ',
      })).toThrow('active binding entry: providerId is required');
      expect(() => loose(activeBindingCollection, [{
        owner,
        requirement: article,
      }])).toThrow(
        'active binding collection: entry at index 0 was not created by activeBindingEntry()',
      );
    });

  it('rejects malformed contract inputs and provider assignments with domain errors', () => {
      const owner = defineBindingLifecycleOwner({ id: 'reader.view', kind: 'view' });
      const article = defineDataRequirement({ id: 'article', resource: 'docs.article' });
      const data = defineViewData({
        requirements: [{ name: 'article', requirement: article }],
      });
      const badContract = { requirementIds: () => ['article'], requirements: () => [null] };
      Object.setPrototypeOf(badContract, data);
      expect(() => loose(collectActiveBindings, {
        entries: {},
      })).toThrow('active binding collection: entries must be an array');
      expect(() => loose(collectActiveBindings, {
        contracts: {},
      })).toThrow('active binding collection: contracts must be an array');
      expect(() => loose(collectActiveBindings, {
        contracts: [null],
      })).toThrow('active binding collection: contract 0 must be an object');
      expect(() => loose(collectActiveBindings, {
        contracts: [{
          owner,
          contract: data,
          providerIds: {},
        }],
      })).toThrow('active binding collection: providerIds must be an array');
      expect(() => loose(collectActiveBindings, {
        contracts: [{
          owner,
          contract: data,
          providerIds: { length: 0 },
        }],
      })).toThrow('active binding collection: providerIds must be an array');
      expect(() => loose(collectActiveBindings, {
        contracts: [{
          owner,
          contract: data,
          providerIds: [null],
        }],
      })).toThrow('active binding collection: provider assignment 0 must be an object');
      expect(() => loose(collectActiveBindings, {
        contracts: [{
          owner,
          contract: data,
          providerIds: [{ requirementId: 42, providerId: 'docs.articleProvider' }],
        }],
      })).toThrow(
        'active binding collection: provider assignment 0 requirementId must be a string',
      );
      expect(() => loose(collectActiveBindings, {
        contracts: [{
          owner,
          contract: data,
          providerIds: [{ requirementId: 'article', providerId: 42 }],
        }],
      })).toThrow(
        'active binding collection: provider assignment 0 providerId must be a string',
      );
      expect(() => loose(collectActiveBindings, {
        contracts: [{
          owner,
          contract: badContract,
        }],
      })).toThrow(
        'active binding collection: contract 0 requirement 0 was not created by defineDataRequirement()',
      );
    });

  it('does not mutate previous collections when with() creates a new collection', () => {
      const owner = defineBindingLifecycleOwner({ id: 'reader.view', kind: 'view' });
      const article = defineDataRequirement({ id: 'article', resource: 'docs.article' });
      const outline = defineDataRequirement({ id: 'outline', resource: 'docs.outline' });
      const collectionA = activeBindingCollection([
        activeBindingEntry({ owner, requirement: article }),
      ]);
      const collectionB = collectionA.with(
        activeBindingEntry({ owner, requirement: outline }),
      );
      expect(collectionA.entries()).toHaveLength(1);
      expect(collectionA.has('reader.view', 'outline')).toBe(false);
      expect(collectionB.entries()).toHaveLength(2);
      expect(() => {
        Object.defineProperty(collectionA.entries(), '1', { value: activeBindingEntry({ owner, requirement: outline }) });
      }).toThrow(TypeError);
    });

  it('exposes no provider handles, subscription handles, render callbacks, or dispatch callbacks', () => {
      const owner = defineBindingLifecycleOwner({ id: 'reader.view', kind: 'view' });
      const article = defineDataRequirement({ id: 'article', resource: 'docs.article' });
      const entry = activeBindingEntry({
        owner,
        requirement: article,
        providerId: 'docs.articleProvider',
      });
      const collection = activeBindingCollection([entry]);
      expect('provider' in entry).toBe(false);
      expect('providerHandle' in entry).toBe(false);
      expect('subscription' in entry).toBe(false);
      expect('refresh' in entry).toBe(false);
      expect('subscribe' in entry).toBe(false);
      expect('unsubscribe' in entry).toBe(false);
      expect('dispatch' in entry).toBe(false);
      expect('render' in entry).toBe(false);
      expect('provider' in collection).toBe(false);
      expect('subscription' in collection).toBe(false);
      expect('refresh' in collection).toBe(false);
      expect('subscribe' in collection).toBe(false);
      expect('dispatch' in collection).toBe(false);
      expect('render' in collection).toBe(false);
    });
});
