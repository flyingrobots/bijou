import { describe, expect, it } from 'vitest';
import {
  commandIntent,
  defineDataRequirement,
  defineViewData,
} from './binding.js';
import {
  defineBindingLifecycleOwner,
} from './binding-lifecycle.js';
import { defineBlock, type BlockMetadata } from './block-metadata.js';
import {
  ActiveBindingCollection,
  activeBindingCollection,
  activeBindingEntry,
  collectActiveBindings,
  isActiveBindingCollection,
  isActiveBindingEntry,
} from './active-binding-collection.js';
const readerMetadata: BlockMetadata = {
  packageName: '@flyingrobots/bijou',
  blockName: 'ReaderSurface',
  family: 'reader',
  scale: 'section',
  modes: ['interactive', 'static', 'pipe', 'accessible'],
  docs: { summary: 'Reader content surface.' },
  slots: [{ id: 'content', required: true }],
};
describe('active binding collection primitives', () => {
  it('creates frozen active binding collections from explicit owner and requirement entries', () => {
    const owner = defineBindingLifecycleOwner({
      id: ' docs.shell ',
      kind: ' app-shell ',
      label: ' Docs Shell ',
    });
    const article = defineDataRequirement({
      id: ' article ',
      resource: ' docs.article ',
      facts: [{ kind: 'entity', key: 'resource', value: 'article' }],
    });
    const entry = activeBindingEntry({
      owner,
      requirement: article,
      providerId: ' docs.articleProvider ',
    });
    const collection = activeBindingCollection([entry]);
    expect(isActiveBindingEntry(entry)).toBe(true);
    expect(isActiveBindingCollection(collection)).toBe(true);
    expect(collection).toBeInstanceOf(ActiveBindingCollection);
    expect(entry.owner).toBe(owner);
    expect(entry.requirement).toBe(article);
    expect(entry.providerId).toBe('docs.articleProvider');
    expect(collection.entries()).toEqual([entry]);
    expect(collection.requirements()).toEqual([article]);
    expect(collection.owners()).toEqual([owner]);
    expect(collection.get('docs.shell', 'article')).toBe(entry);
    expect(collection.has('docs.shell', 'article')).toBe(true);
    expect(collection.byOwner('docs.shell')).toEqual([entry]);
    expect(collection.byRequirement('article')).toEqual([entry]);
    expect(Object.isFrozen(entry)).toBe(true);
    expect(Object.isFrozen(collection)).toBe(true);
    expect(Object.isFrozen(collection.entries())).toBe(true);
  });
  it('produces one active lifecycle record per owner and requirement pair', () => {
    const owner = defineBindingLifecycleOwner({ id: 'reader.view', kind: 'view' });
    const article = defineDataRequirement({
      id: 'article',
      resource: 'docs.article',
      facts: [{ kind: 'entity', key: 'resource', value: 'article' }],
    });
    const outline = defineDataRequirement({
      id: 'outline',
      resource: 'docs.outline',
    });
    const collection = activeBindingCollection([
      activeBindingEntry({
        owner,
        requirement: article,
        providerId: 'docs.articleProvider',
      }),
      activeBindingEntry({
        owner,
        requirement: outline,
      }),
    ]);
    expect(collection.lifecycleRecords()).toEqual([
      {
        owner,
        requirementId: 'article',
        providerId: 'docs.articleProvider',
        state: 'active',
        version: 1,
        invalidations: [],
        transitions: [],
        facts: [{ kind: 'entity', key: 'resource', value: 'article' }],
      },
      {
        owner,
        requirementId: 'outline',
        state: 'active',
        version: 1,
        invalidations: [],
        transitions: [],
        facts: [],
      },
    ]);
    expect(Object.isFrozen(collection.lifecycleRecords())).toBe(true);
    expect(Object.isFrozen(collection.lifecycleRecords()[0])).toBe(true);
  });
  it('treats repeated owner and requirement pairs as one logical active binding', () => {
    const owner = defineBindingLifecycleOwner({ id: 'reader.view', kind: 'view' });
    const article = defineDataRequirement({ id: 'article', resource: 'docs.article' });
    const outline = defineDataRequirement({ id: 'outline', resource: 'docs.outline' });
    const collection = activeBindingCollection([
      activeBindingEntry({ owner, requirement: article }),
      activeBindingEntry({
        owner,
        requirement: article,
        providerId: 'docs.articleProvider',
      }),
      activeBindingEntry({ owner, requirement: outline }),
    ]);
    expect(collection.entries().map((entry) => ({
      ownerId: entry.owner.id,
      requirementId: entry.requirement.id,
      providerId: entry.providerId,
    }))).toEqual([
      {
        ownerId: 'reader.view',
        requirementId: 'article',
        providerId: 'docs.articleProvider',
      },
      {
        ownerId: 'reader.view',
        requirementId: 'outline',
        providerId: undefined,
      },
    ]);
    expect(collection.lifecycleRecords()).toHaveLength(2);
  });
  it('rejects repeated owner and requirement pairs with conflicting provider ids', () => {
    const owner = defineBindingLifecycleOwner({ id: 'reader.view', kind: 'view' });
    const article = defineDataRequirement({ id: 'article', resource: 'docs.article' });
    expect(() => activeBindingCollection([
      activeBindingEntry({
        owner,
        requirement: article,
        providerId: 'docs.articleProvider',
      }),
      activeBindingEntry({
        owner,
        requirement: article,
        providerId: 'docs.otherArticleProvider',
      }),
    ])).toThrow(
      'active binding collection: conflicting providers for owner reader.view requirement article',
    );
  });
  it('rejects duplicate active entries and loose owner, requirement, or entry objects', () => {
    const owner = defineBindingLifecycleOwner({ id: 'reader.view', kind: 'view' });
    const article = defineDataRequirement({ id: 'article', resource: 'docs.article' });
    expect(() => activeBindingEntry({
      owner: { id: 'reader.view', kind: 'view' } as never,
      requirement: article,
    })).toThrow(
      'active binding entry: owner was not created by defineBindingLifecycleOwner()',
    );
    expect(() => activeBindingEntry({
      owner,
      requirement: { id: 'article', resource: 'docs.article' } as never,
    })).toThrow(
      'active binding entry: requirement was not created by defineDataRequirement()',
    );
    expect(() => activeBindingEntry({
      owner,
      requirement: article,
      providerId: '   ',
    })).toThrow('active binding entry: providerId is required');
    expect(() => activeBindingCollection([{
      owner,
      requirement: article,
    } as never])).toThrow(
      'active binding collection: entry at index 0 was not created by activeBindingEntry()',
    );
  });
  it('rejects malformed contract inputs and provider assignments with domain errors', () => {
    const owner = defineBindingLifecycleOwner({ id: 'reader.view', kind: 'view' });
    const article = defineDataRequirement({ id: 'article', resource: 'docs.article' });
    const data = defineViewData({
      requirements: [{ name: 'article', requirement: article }],
    });
    const malformedContract = Object.create(data, {
      requirementIds: { value: () => ['article'] },
      requirements: { value: () => [null] },
    });
    expect(() => collectActiveBindings({
      entries: {} as never,
    })).toThrow('active binding collection: entries must be an array');
    expect(() => collectActiveBindings({
      contracts: {} as never,
    })).toThrow('active binding collection: contracts must be an array');
    expect(() => collectActiveBindings({
      contracts: [null as never],
    })).toThrow('active binding collection: contract 0 must be an object');
    expect(() => collectActiveBindings({
      contracts: [{
        owner,
        contract: data,
        providerIds: {} as never,
      }],
    })).toThrow('active binding collection: providerIds must be an array');
    expect(() => collectActiveBindings({
      contracts: [{
        owner,
        contract: data,
        providerIds: { length: 0 } as never,
      }],
    })).toThrow('active binding collection: providerIds must be an array');
    expect(() => collectActiveBindings({
      contracts: [{
        owner,
        contract: data,
        providerIds: [null as never],
      }],
    })).toThrow('active binding collection: provider assignment 0 must be an object');
    expect(() => collectActiveBindings({
      contracts: [{
        owner,
        contract: data,
        providerIds: [{ requirementId: 42, providerId: 'docs.articleProvider' } as never],
      }],
    })).toThrow(
      'active binding collection: provider assignment 0 requirementId must be a string',
    );
    expect(() => collectActiveBindings({
      contracts: [{
        owner,
        contract: data,
        providerIds: [{ requirementId: 'article', providerId: 42 } as never],
      }],
    })).toThrow(
      'active binding collection: provider assignment 0 providerId must be a string',
    );
    expect(() => collectActiveBindings({
      contracts: [{
        owner,
        contract: malformedContract,
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
    expect(collectionB.has('reader.view', 'outline')).toBe(true);
    expect(() => {
      (collectionA.entries() as unknown[]).push(collectionB.entries()[1]);
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
  it('collects declared view data contracts without executing block render functions', () => {
    const owner = defineBindingLifecycleOwner({ id: 'reader.view', kind: 'view' });
    const article = defineDataRequirement({ id: 'article', resource: 'docs.article' });
    const outline = defineDataRequirement({ id: 'outline', resource: 'docs.outline' });
    const data = defineViewData({
      requirements: [
        { name: 'article', requirement: article },
        { name: 'outline', requirement: outline },
      ],
    });
    let renderCalls = 0;
    const block = defineBlock({
      metadata: readerMetadata,
      data,
      commands: [commandIntent('reader.selectHeading')],
      render: () => {
        renderCalls += 1;
        return { output: 'rendered' };
      },
    });
    const collection = collectActiveBindings({
      contracts: [{
        owner,
        contract: block.data!,
        providerIds: [
          { requirementId: 'article', providerId: 'docs.articleProvider' },
        ],
      }],
    });
    expect(renderCalls).toBe(0);
    expect(collection.entries().map((entry) => entry.requirement.id)).toEqual([
      'article',
      'outline',
    ]);
    expect(collection.get('reader.view', 'article')?.providerId).toBe(
      'docs.articleProvider',
    );
    expect(collection.get('reader.view', 'outline')?.providerId).toBeUndefined();
    expect('commands' in collection).toBe(false);
    expect('dispatch' in collection).toBe(false);
  });
});
