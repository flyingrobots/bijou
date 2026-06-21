import { describe, expect, it } from 'vitest';
import { commandIntent } from './binding.js';
import { bindingLifecycleRecord, defineBindingLifecycleOwner, invalidateBinding, isBindingLifecycleOwner, isBindingLifecycleRecord, suspendBinding } from './binding-lifecycle.js';

function activeRecord() {
  return bindingLifecycleRecord({
    owner: defineBindingLifecycleOwner({ id: 'reader.view', kind: 'view' }),
    requirementId: 'article',
    providerId: 'docs.articleProvider',
  });
}

function bad(fn: unknown, args: unknown[]): unknown { if (typeof fn !== 'function') throw new TypeError(); return Reflect.apply(fn, null, args); }

describe('binding lifecycle primitives', () => {
  it('rejects empty ids, invalid states, and loose lifecycle-shaped objects', () => {
      const owner = defineBindingLifecycleOwner({ id: 'reader.view', kind: 'view' });
      const inherited: unknown = Object.create(owner);

      expect(() => defineBindingLifecycleOwner({ id: '', kind: 'view' })).toThrow(
        'binding lifecycle owner: id is required',
      );
      expect(() => defineBindingLifecycleOwner({
        id: 'reader.view',
        kind: 'page',
      })).toThrow('binding lifecycle owner: unsupported kind page');
      expect(() => bad(bindingLifecycleRecord, [{
        owner: { id: 'reader.view', kind: 'view' },
        requirementId: 'article',
      }])).toThrow(
        'binding lifecycle: owner was not created by defineBindingLifecycleOwner()',
      );
      expect(isBindingLifecycleOwner(inherited)).toBe(false);
      expect(() => bad(bindingLifecycleRecord, [{
        owner: inherited,
        requirementId: 'article',
      }])).toThrow(
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
      expect(() => bad(bindingLifecycleRecord, [{
        owner,
        requirementId: 'article',
        state: 'loading',
      }])).toThrow('binding lifecycle: unsupported state loading');
      expect(() => bindingLifecycleRecord({
        owner,
        requirementId: 'article',
        version: 0,
      })).toThrow('binding lifecycle: version must be a positive integer');
      expect(() => bad(invalidateBinding, [activeRecord(), {
        reason: 'refresh',
      }])).toThrow('binding invalidation: unsupported reason refresh');
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
      const inheritedRecord: unknown = Object.create(record);
      expect(isBindingLifecycleRecord(inheritedRecord)).toBe(false);
      expect(() => bad(suspendBinding, [inheritedRecord])).toThrow(
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
