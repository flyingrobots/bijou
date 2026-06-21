import type { RequirementId } from './binding.js';

import { EMPTY_BINDING_INVALIDATIONS } from './binding-lifecycle.part01.js';

import type { BindingInvalidation, BindingLifecycleRecord, BindingLifecycleState, BindingLifecycleTransitionReason } from './binding-lifecycle.part01.js';

import { bindingLifecycleRecord, isBindingLifecycleRecord } from './binding-lifecycle.part02.js';

import { freezeTransition } from './binding-lifecycle.part05.js';

import { isBindingInvalidationReason, normalizeRequiredText, optionalRequiredText } from './binding-lifecycle.part06.js';
export function transitionRecord(
  record: BindingLifecycleRecord,
  to: BindingLifecycleState,
  reason: BindingLifecycleTransitionReason,
): BindingLifecycleRecord {
  return bindingLifecycleRecord({
    owner: record.owner,
    requirementId: record.requirementId,
    providerId: record.providerId,
    state: to,
    version: record.version + 1,
    invalidations: record.invalidations,
    transitions: [
      ...record.transitions,
      freezeTransition({
        from: record.state,
        to,
        reason,
      }),
    ],
    facts: record.facts,
  });
}
export function assertLifecycleRecord(record: BindingLifecycleRecord): void {
  if (!isBindingLifecycleRecord(record)) {
    throw new Error(
      'binding lifecycle: record was not created by bindingLifecycleRecord()',
    );
  }
}
export function assertNotDisposed(record: BindingLifecycleRecord, action: string): void {
  if (record.state === 'disposed') {
    throw new Error(
      `binding lifecycle: disposed binding ${record.requirementId} cannot ${action}`,
    );
  }
}
export function freezeInvalidations(
  invalidations: readonly BindingInvalidation[] | undefined,
  expectedRequirementId: RequirementId,
): readonly BindingInvalidation[] {
  if (invalidations === undefined || invalidations.length === 0) {
    return EMPTY_BINDING_INVALIDATIONS;
  }

  return Object.freeze(
    invalidations.map((invalidation) => {
      const frozen = freezeInvalidation(invalidation);
      if (frozen.requirementId !== expectedRequirementId) {
        throw new Error(
          `binding lifecycle: invalidation requirement ${frozen.requirementId} `
          + `does not match record requirement ${expectedRequirementId}`,
        );
      }

      return frozen;
    }),
  );
}
export function freezeInvalidation(invalidation: BindingInvalidation): BindingInvalidation {
  const reason = invalidation.reason;
  if (!isBindingInvalidationReason(reason)) {
    throw new Error(`binding invalidation: unsupported reason ${String(reason)}`);
  }
  if (
    invalidation.snapshotVersion !== undefined
    && (!Number.isInteger(invalidation.snapshotVersion) || invalidation.snapshotVersion < 1)
  ) {
    throw new Error('binding invalidation: snapshotVersion must be a positive integer');
  }

  return Object.freeze({
    requirementId: normalizeRequiredText({
      scope: 'binding invalidation',
      field: 'requirementId',
      value: invalidation.requirementId,
    }),
    providerId: optionalRequiredText({
      scope: 'binding invalidation',
      field: 'providerId',
      value: invalidation.providerId,
    }),
    reason,
    snapshotVersion: invalidation.snapshotVersion,
  });
}
