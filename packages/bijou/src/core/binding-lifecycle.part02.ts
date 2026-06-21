import { BINDING_LIFECYCLE_OWNER_BRAND, BINDING_LIFECYCLE_RECORD_BRAND } from './binding-lifecycle.part01.js';

import type { BindingLifecycleOwner, BindingLifecycleOwnerInput, BindingLifecycleRecord, BindingLifecycleRecordInput } from './binding-lifecycle.part01.js';

import { freezeInvalidations } from './binding-lifecycle.part04.js';

import { freezeTransitions } from './binding-lifecycle.part05.js';

import { freezeFacts, isBindingLifecycleOwnerKind, isBindingLifecycleState, normalizeRequiredText, optionalRequiredText, optionalTrimmedText } from './binding-lifecycle.part06.js';
export function defineBindingLifecycleOwner(
  input: BindingLifecycleOwnerInput,
): BindingLifecycleOwner {
  const kind = normalizeRequiredText({
    scope: 'binding lifecycle owner',
    field: 'kind',
    value: input.kind,
  });
  if (!isBindingLifecycleOwnerKind(kind)) {
    throw new Error(`binding lifecycle owner: unsupported kind ${kind}`);
  }

  const owner = {
    [BINDING_LIFECYCLE_OWNER_BRAND]: true,
    id: normalizeRequiredText({
      scope: 'binding lifecycle owner',
      field: 'id',
      value: input.id,
    }),
    kind,
    label: optionalTrimmedText(input.label),
  } satisfies BindingLifecycleOwner;

  Object.defineProperty(owner, BINDING_LIFECYCLE_OWNER_BRAND, { enumerable: false, value: true });
  return Object.freeze(owner);
}
export function isBindingLifecycleOwner(value: unknown): value is BindingLifecycleOwner {
  return Boolean(
    value
      && typeof value === 'object'
      && Object.prototype.hasOwnProperty.call(value, BINDING_LIFECYCLE_OWNER_BRAND)
      && Reflect.get(value, BINDING_LIFECYCLE_OWNER_BRAND) === true,
  );
}
export function bindingLifecycleRecord(
  input: BindingLifecycleRecordInput,
): BindingLifecycleRecord {
  if (!isBindingLifecycleOwner(input.owner)) {
    throw new Error(
      'binding lifecycle: owner was not created by defineBindingLifecycleOwner()',
    );
  }

  const state = input.state ?? 'active';
  if (!isBindingLifecycleState(state)) {
    throw new Error(`binding lifecycle: unsupported state ${String(state)}`);
  }

  const version = input.version ?? 1;
  if (!Number.isInteger(version) || version < 1) {
    throw new Error('binding lifecycle: version must be a positive integer');
  }

  const requirementId = normalizeRequiredText({
    scope: 'binding lifecycle',
    field: 'requirementId',
    value: input.requirementId,
  });
  const providerId = optionalRequiredText({
    scope: 'binding lifecycle',
    field: 'providerId',
    value: input.providerId,
  });
  const invalidations = freezeInvalidations(input.invalidations, requirementId);
  const transitions = freezeTransitions(input.transitions, state);

  const record = {
    [BINDING_LIFECYCLE_RECORD_BRAND]: true,
    owner: input.owner,
    requirementId,
    providerId,
    state,
    version,
    invalidations,
    transitions,
    facts: freezeFacts(input.facts),
  } satisfies BindingLifecycleRecord;

  Object.defineProperty(record, BINDING_LIFECYCLE_RECORD_BRAND, { enumerable: false, value: true });
  return Object.freeze(record);
}
export function isBindingLifecycleRecord(value: unknown): value is BindingLifecycleRecord {
  return Boolean(
    value
      && typeof value === 'object'
      && Object.prototype.hasOwnProperty.call(value, BINDING_LIFECYCLE_RECORD_BRAND)
      && Reflect.get(value, BINDING_LIFECYCLE_RECORD_BRAND) === true,
  );
}
