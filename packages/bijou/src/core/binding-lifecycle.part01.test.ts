import { describe, expect, it } from 'vitest';
import { activateBinding, bindingLifecycleRecord, defineBindingLifecycleOwner, disposeBinding, invalidateBinding, isBindingLifecycleOwner, isBindingLifecycleRecord, suspendBinding } from './binding-lifecycle.js';

function activeRecord() {
  return bindingLifecycleRecord({
    owner: defineBindingLifecycleOwner({ id: 'reader.view', kind: 'view' }),
    requirementId: 'article',
    providerId: 'docs.articleProvider',
  });
}

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
      expect(() => Object.assign(invalidated.invalidations, { 0: undefined })).toThrow(TypeError);
    });
});
