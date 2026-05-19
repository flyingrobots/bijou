import { describe, expect, it } from 'vitest';
import { commandIntent } from './binding.js';
import {
  activateBinding,
  bindingLifecycleRecord,
  defineBindingLifecycleOwner,
  disposeBinding,
  invalidateBinding,
  isBindingLifecycleOwner,
  isBindingLifecycleRecord,
  suspendBinding,
  type BindingInvalidation,
  type BindingLifecycleState,
} from './binding-lifecycle.js';

describe('binding lifecycle primitives', () => {
  it('creates active immutable lifecycle records for owned requirements', () => {
    const owner = defineBindingLifecycleOwner({
      id: ' reader.view ',
      kind: ' view ',
      label: ' Reader View ',
    });
    const record = bindingLifecycleRecord({
      owner,
      requirementId: ' article ',
      providerId: ' docs.articleProvider ',
      facts: [{ kind: 'entity', key: 'binding', value: 'article' }],
    });

    expect(isBindingLifecycleOwner(owner)).toBe(true);
    expect(isBindingLifecycleRecord(record)).toBe(true);
    expect(owner.id).toBe('reader.view');
    expect(owner.kind).toBe('view');
    expect(owner.label).toBe('Reader View');
    expect(record.owner).toBe(owner);
    expect(record.requirementId).toBe('article');
    expect(record.providerId).toBe('docs.articleProvider');
    expect(record.state).toBe('active');
    expect(record.version).toBe(1);
    expect(record.invalidations).toEqual([]);
    expect(record.transitions).toEqual([]);
    expect(record.facts).toEqual([{ kind: 'entity', key: 'binding', value: 'article' }]);
    expect(Object.isFrozen(owner)).toBe(true);
    expect(Object.isFrozen(record)).toBe(true);
    expect(Object.isFrozen(record.invalidations)).toBe(true);
    expect(Object.isFrozen(record.transitions)).toBe(true);
    expect(Object.isFrozen(record.facts)).toBe(true);
    expect(Object.isFrozen(record.facts[0])).toBe(true);
  });

  it('suspends active bindings by returning a new frozen record', () => {
    const active = activeRecord();
    const suspended = suspendBinding(active);

    expect(active.state).toBe('active');
    expect(active.version).toBe(1);
    expect(active.transitions).toEqual([]);
    expect(suspended.state).toBe('suspended');
    expect(suspended.version).toBe(2);
    expect(suspended.transitions).toEqual([
      { from: 'active', to: 'suspended', reason: 'suspend' },
    ]);
    expect(Object.isFrozen(suspended)).toBe(true);
    expect(Object.isFrozen(suspended.transitions)).toBe(true);
    expect(Object.isFrozen(suspended.transitions[0])).toBe(true);
  });

  it('reactivates suspended bindings by returning a new frozen record', () => {
    const active = activeRecord();
    const suspended = suspendBinding(active);
    const reactivated = activateBinding(suspended);

    expect(suspended.state).toBe('suspended');
    expect(suspended.version).toBe(2);
    expect(reactivated.state).toBe('active');
    expect(reactivated.version).toBe(3);
    expect(reactivated.transitions).toEqual([
      { from: 'active', to: 'suspended', reason: 'suspend' },
      { from: 'suspended', to: 'active', reason: 'activate' },
    ]);
  });

  it('disposes bindings and rejects later activation, suspension, or invalidation', () => {
    const active = activeRecord();
    const disposed = disposeBinding(active);

    expect(active.state).toBe('active');
    expect(disposed.state).toBe('disposed');
    expect(disposed.version).toBe(2);
    expect(disposed.transitions).toEqual([
      { from: 'active', to: 'disposed', reason: 'dispose' },
    ]);
    expect(() => activateBinding(disposed)).toThrow(
      'binding lifecycle: disposed binding article cannot activate',
    );
    expect(() => suspendBinding(disposed)).toThrow(
      'binding lifecycle: disposed binding article cannot suspend',
    );
    expect(() => invalidateBinding(disposed, { reason: 'provider-update' })).toThrow(
      'binding lifecycle: disposed binding article cannot invalidate',
    );
  });

  it('records provider invalidation as a new frozen lifecycle value', () => {
    const active = activeRecord();
    const invalidated = invalidateBinding(active, {
      reason: 'provider-update',
      snapshotVersion: 2,
    });

    expect(active.invalidations).toEqual([]);
    expect(active.transitions).toEqual([]);
    expect(invalidated.state).toBe('active');
    expect(invalidated.version).toBe(2);
    expect(invalidated.invalidations).toEqual([
      {
        requirementId: 'article',
        providerId: 'docs.articleProvider',
        reason: 'provider-update',
        snapshotVersion: 2,
      },
    ]);
    expect(invalidated.transitions).toEqual([
      { from: 'active', to: 'active', reason: 'invalidate' },
    ]);
    expect(Object.isFrozen(invalidated.invalidations)).toBe(true);
    expect(Object.isFrozen(invalidated.invalidations[0])).toBe(true);
    expect(() => {
      (invalidated.invalidations as BindingInvalidation[]).push({
        requirementId: 'article',
        reason: 'manual',
      });
    }).toThrow(TypeError);
  });

  it('rejects empty ids, invalid states, and loose lifecycle-shaped objects', () => {
    const owner = defineBindingLifecycleOwner({ id: 'reader.view', kind: 'view' });
    const inheritedOwner = Object.create(owner);

    expect(() => defineBindingLifecycleOwner({ id: '', kind: 'view' })).toThrow(
      'binding lifecycle owner: id is required',
    );
    expect(() => defineBindingLifecycleOwner({
      id: 'reader.view',
      kind: 'page' as never,
    })).toThrow('binding lifecycle owner: unsupported kind page');
    expect(() => bindingLifecycleRecord({
      owner: { id: 'reader.view', kind: 'view' } as never,
      requirementId: 'article',
    })).toThrow(
      'binding lifecycle: owner was not created by defineBindingLifecycleOwner()',
    );
    expect(isBindingLifecycleOwner(inheritedOwner)).toBe(false);
    expect(() => bindingLifecycleRecord({
      owner: inheritedOwner,
      requirementId: 'article',
    })).toThrow(
      'binding lifecycle: owner was not created by defineBindingLifecycleOwner()',
    );
    expect(() => bindingLifecycleRecord({ owner, requirementId: '   ' })).toThrow(
      'binding lifecycle: requirementId is required',
    );
    expect(() => bindingLifecycleRecord({
      owner,
      requirementId: 'article',
      providerId: '   ',
    })).toThrow('binding lifecycle: providerId is required');
    expect(() => bindingLifecycleRecord({
      owner,
      requirementId: 'article',
      state: 'loading' as BindingLifecycleState,
    })).toThrow('binding lifecycle: unsupported state loading');
    expect(() => bindingLifecycleRecord({
      owner,
      requirementId: 'article',
      version: 0,
    })).toThrow('binding lifecycle: version must be a positive integer');
    expect(() => invalidateBinding(activeRecord(), {
      reason: 'refresh' as never,
    })).toThrow('binding invalidation: unsupported reason refresh');
    expect(() => bindingLifecycleRecord({
      owner,
      requirementId: 'article',
      invalidations: [{ requirementId: 'comments', reason: 'manual' }],
    })).toThrow(
      'binding lifecycle: invalidation requirement comments does not match record requirement article',
    );
    expect(() => bindingLifecycleRecord({
      owner,
      requirementId: 'article',
      state: 'active',
      transitions: [{ from: 'active', to: 'disposed', reason: 'dispose' }],
    })).toThrow(
      'binding lifecycle: final transition state disposed does not match record state active',
    );
    expect(() => bindingLifecycleRecord({
      owner,
      requirementId: 'article',
      state: 'active',
      transitions: [{ from: 'disposed', to: 'active', reason: 'activate' }],
    })).toThrow('binding transition: disposed bindings cannot transition to active');
    expect(() => bindingLifecycleRecord({
      owner,
      requirementId: 'article',
      state: 'disposed',
      transitions: [
        { from: 'active', to: 'suspended', reason: 'suspend' },
        { from: 'active', to: 'disposed', reason: 'dispose' },
      ],
    })).toThrow('binding lifecycle: transition chain is discontinuous at index 1');

    const record = activeRecord();
    const inheritedRecord = Object.create(record);
    expect(isBindingLifecycleRecord(inheritedRecord)).toBe(false);
    expect(() => suspendBinding(inheritedRecord)).toThrow(
      'binding lifecycle: record was not created by bindingLifecycleRecord()',
    );
  });

  it('exposes no provider handles, subscription handles, refresh methods, or dispatch callbacks', () => {
    const record = invalidateBinding(activeRecord(), {
      reason: 'provider-update',
      snapshotVersion: 2,
    });
    const invalidation = record.invalidations[0];

    expect('provider' in record).toBe(false);
    expect('subscription' in record).toBe(false);
    expect('refresh' in record).toBe(false);
    expect('subscribe' in record).toBe(false);
    expect('unsubscribe' in record).toBe(false);
    expect('dispatch' in record).toBe(false);
    expect('command' in record).toBe(false);
    expect('handle' in record).toBe(false);
    expect('callback' in record).toBe(false);
    expect('provider' in invalidation).toBe(false);
    expect('refresh' in invalidation).toBe(false);
    expect('subscribe' in invalidation).toBe(false);
    expect('dispatch' in invalidation).toBe(false);
  });

  it('keeps command intents as metadata and out of lifecycle execution', () => {
    const intent = commandIntent<{ headingId: string }>('reader.selectHeading');
    const record = activeRecord();

    expect(intent.id).toBe('reader.selectHeading');
    expect('execute' in intent).toBe(false);
    expect('dispatch' in intent).toBe(false);
    expect('commands' in record).toBe(false);
    expect('execute' in record).toBe(false);
    expect('dispatch' in record).toBe(false);
  });
});

function activeRecord() {
  return bindingLifecycleRecord({
    owner: defineBindingLifecycleOwner({ id: 'reader.view', kind: 'view' }),
    requirementId: 'article',
    providerId: 'docs.articleProvider',
  });
}
