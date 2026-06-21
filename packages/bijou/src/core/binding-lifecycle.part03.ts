import type { BindingInvalidationInput, BindingLifecycleRecord } from './binding-lifecycle.part01.js';

import { bindingLifecycleRecord } from './binding-lifecycle.part02.js';

import { assertLifecycleRecord, assertNotDisposed, freezeInvalidation, transitionRecord } from './binding-lifecycle.part04.js';

import { freezeTransition } from './binding-lifecycle.part05.js';

import { isBindingInvalidationReason, optionalRequiredText } from './binding-lifecycle.part06.js';
export function activateBinding(record: BindingLifecycleRecord): BindingLifecycleRecord {
  assertLifecycleRecord(record);
  assertNotDisposed(record, 'activate');
  if (record.state === 'active') {
    throw new Error(`binding lifecycle: binding ${record.requirementId} is already active`);
  }

  return transitionRecord(record, 'active', 'activate');
}
export function suspendBinding(record: BindingLifecycleRecord): BindingLifecycleRecord {
  assertLifecycleRecord(record);
  assertNotDisposed(record, 'suspend');
  if (record.state === 'suspended') {
    throw new Error(`binding lifecycle: binding ${record.requirementId} is already suspended`);
  }

  return transitionRecord(record, 'suspended', 'suspend');
}
export function disposeBinding(record: BindingLifecycleRecord): BindingLifecycleRecord {
  assertLifecycleRecord(record);
  if (record.state === 'disposed') {
    throw new Error(`binding lifecycle: binding ${record.requirementId} is already disposed`);
  }

  return transitionRecord(record, 'disposed', 'dispose');
}
export function invalidateBinding(
  record: BindingLifecycleRecord,
  input: BindingInvalidationInput,
): BindingLifecycleRecord {
  assertLifecycleRecord(record);
  assertNotDisposed(record, 'invalidate');

  if (!isBindingInvalidationReason(input.reason)) {
    throw new Error(`binding invalidation: unsupported reason ${String(input.reason)}`);
  }
  if (
    input.snapshotVersion !== undefined
    && (!Number.isInteger(input.snapshotVersion) || input.snapshotVersion < 1)
  ) {
    throw new Error('binding invalidation: snapshotVersion must be a positive integer');
  }

  const providerId = optionalRequiredText({
    scope: 'binding invalidation',
    field: 'providerId',
    value: input.providerId,
  }) ?? record.providerId;
  const invalidation = freezeInvalidation({
    requirementId: record.requirementId,
    providerId,
    reason: input.reason,
    snapshotVersion: input.snapshotVersion,
  });

  return bindingLifecycleRecord({
    owner: record.owner,
    requirementId: record.requirementId,
    providerId: record.providerId,
    state: record.state,
    version: record.version + 1,
    invalidations: [...record.invalidations, invalidation],
    transitions: [
      ...record.transitions,
      freezeTransition({
        from: record.state,
        to: record.state,
        reason: 'invalidate',
      }),
    ],
    facts: record.facts,
  });
}
