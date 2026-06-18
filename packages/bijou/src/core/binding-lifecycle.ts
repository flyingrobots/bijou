import type {
  BindingFact,
  ProviderId,
  RequirementId,
} from './binding.js';

const BINDING_LIFECYCLE_OWNER_BRAND: unique symbol = Symbol('BindingLifecycleOwner');
const BINDING_LIFECYCLE_RECORD_BRAND: unique symbol = Symbol('BindingLifecycleRecord');

export type BindingLifecycleState = 'active' | 'suspended' | 'disposed';

export type BindingLifecycleOwnerKind = 'view' | 'block' | 'app-shell' | 'runtime';

export type BindingInvalidationReason =
  | 'provider-update'
  | 'owner-suspended'
  | 'owner-disposed'
  | 'scope-changed'
  | 'manual';

export type BindingLifecycleTransitionReason =
  | 'activate'
  | 'suspend'
  | 'dispose'
  | 'invalidate';

export interface BindingLifecycleOwnerInput {
  readonly id: string;
  readonly kind: string;
  readonly label?: string;
}

export interface BindingLifecycleOwner {
  readonly [BINDING_LIFECYCLE_OWNER_BRAND]: true;
  readonly id: string;
  readonly kind: BindingLifecycleOwnerKind;
  readonly label?: string;
}

export interface BindingInvalidationInput {
  readonly reason: BindingInvalidationReason;
  readonly providerId?: string;
  readonly snapshotVersion?: number;
}

export interface BindingInvalidation {
  readonly requirementId: RequirementId;
  readonly providerId?: ProviderId;
  readonly reason: BindingInvalidationReason;
  readonly snapshotVersion?: number;
}

export interface BindingLifecycleTransition {
  readonly from: BindingLifecycleState;
  readonly to: BindingLifecycleState;
  readonly reason: BindingLifecycleTransitionReason;
}

export interface BindingLifecycleRecordInput {
  readonly owner: BindingLifecycleOwner;
  readonly requirementId: string;
  readonly providerId?: string;
  readonly state?: BindingLifecycleState;
  readonly version?: number;
  readonly invalidations?: readonly BindingInvalidation[];
  readonly transitions?: readonly BindingLifecycleTransition[];
  readonly facts?: readonly BindingFact[];
}

export interface BindingLifecycleRecord {
  readonly [BINDING_LIFECYCLE_RECORD_BRAND]: true;
  readonly owner: BindingLifecycleOwner;
  readonly requirementId: RequirementId;
  readonly providerId?: ProviderId;
  readonly state: BindingLifecycleState;
  readonly version: number;
  readonly invalidations: readonly BindingInvalidation[];
  readonly transitions: readonly BindingLifecycleTransition[];
  readonly facts: readonly BindingFact[];
}

const BINDING_LIFECYCLE_STATES: readonly BindingLifecycleState[] = [
  'active',
  'suspended',
  'disposed',
];
const BINDING_LIFECYCLE_OWNER_KINDS: readonly BindingLifecycleOwnerKind[] = [
  'view',
  'block',
  'app-shell',
  'runtime',
];
const BINDING_INVALIDATION_REASONS: readonly BindingInvalidationReason[] = [
  'provider-update',
  'owner-suspended',
  'owner-disposed',
  'scope-changed',
  'manual',
];
const BINDING_TRANSITION_REASONS: readonly BindingLifecycleTransitionReason[] = [
  'activate',
  'suspend',
  'dispose',
  'invalidate',
];
const EMPTY_BINDING_INVALIDATIONS = Object.freeze([]) as readonly BindingInvalidation[];
const EMPTY_BINDING_TRANSITIONS = Object.freeze([]) as readonly BindingLifecycleTransition[];
const EMPTY_BINDING_FACTS = Object.freeze([]) as readonly BindingFact[];

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
    id: normalizeRequiredText({
      scope: 'binding lifecycle owner',
      field: 'id',
      value: input.id,
    }),
    kind,
    label: optionalTrimmedText(input.label),
  } as BindingLifecycleOwner;

  Object.defineProperty(owner, BINDING_LIFECYCLE_OWNER_BRAND, { value: true });
  return Object.freeze(owner);
}

export function isBindingLifecycleOwner(value: unknown): value is BindingLifecycleOwner {
  return Boolean(
    value
      && typeof value === 'object'
      && Object.prototype.hasOwnProperty.call(value, BINDING_LIFECYCLE_OWNER_BRAND)
      && (value as BindingLifecycleOwnerBrandCarrier)[BINDING_LIFECYCLE_OWNER_BRAND] === true,
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
    owner: input.owner,
    requirementId,
    providerId,
    state,
    version,
    invalidations,
    transitions,
    facts: freezeFacts(input.facts),
  } as BindingLifecycleRecord;

  Object.defineProperty(record, BINDING_LIFECYCLE_RECORD_BRAND, { value: true });
  return Object.freeze(record);
}

export function isBindingLifecycleRecord(value: unknown): value is BindingLifecycleRecord {
  return Boolean(
    value
      && typeof value === 'object'
      && Object.prototype.hasOwnProperty.call(value, BINDING_LIFECYCLE_RECORD_BRAND)
      && (value as BindingLifecycleRecordBrandCarrier)[BINDING_LIFECYCLE_RECORD_BRAND] === true,
  );
}

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

function transitionRecord(
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

function assertLifecycleRecord(record: BindingLifecycleRecord): void {
  if (!isBindingLifecycleRecord(record)) {
    throw new Error(
      'binding lifecycle: record was not created by bindingLifecycleRecord()',
    );
  }
}

function assertNotDisposed(record: BindingLifecycleRecord, action: string): void {
  if (record.state === 'disposed') {
    throw new Error(
      `binding lifecycle: disposed binding ${record.requirementId} cannot ${action}`,
    );
  }
}

function freezeInvalidations(
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

function freezeInvalidation(invalidation: BindingInvalidation): BindingInvalidation {
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

function freezeTransitions(
  transitions: readonly BindingLifecycleTransition[] | undefined,
  expectedState: BindingLifecycleState,
): readonly BindingLifecycleTransition[] {
  if (transitions === undefined || transitions.length === 0) {
    return EMPTY_BINDING_TRANSITIONS;
  }

  const frozenTransitions = transitions.map(freezeTransition);
  for (let index = 1; index < frozenTransitions.length; index += 1) {
    const previous = frozenTransitions[index - 1];
    const current = frozenTransitions[index];
    if (previous === undefined || current === undefined) {
      throw new Error(`binding lifecycle: missing transition at index ${index}`);
    }
    if (previous.to !== current.from) {
      throw new Error(
        `binding lifecycle: transition chain is discontinuous at index ${index}`,
      );
    }
  }

  const finalTransition = frozenTransitions.at(-1);
  if (finalTransition !== undefined && finalTransition.to !== expectedState) {
    throw new Error(
      `binding lifecycle: final transition state ${finalTransition.to} `
      + `does not match record state ${expectedState}`,
    );
  }

  return Object.freeze(frozenTransitions);
}

function freezeTransition(
  transition: BindingLifecycleTransition,
): BindingLifecycleTransition {
  if (!isBindingLifecycleState(transition.from)) {
    throw new Error(`binding transition: unsupported from state ${String(transition.from)}`);
  }
  if (!isBindingLifecycleState(transition.to)) {
    throw new Error(`binding transition: unsupported to state ${String(transition.to)}`);
  }
  if (!isBindingTransitionReason(transition.reason)) {
    throw new Error(`binding transition: unsupported reason ${String(transition.reason)}`);
  }
  assertAllowedTransition(transition);

  return Object.freeze({
    from: transition.from,
    to: transition.to,
    reason: transition.reason,
  });
}

function assertAllowedTransition(transition: BindingLifecycleTransition): void {
  if (transition.from === 'disposed') {
    throw new Error(`binding transition: disposed bindings cannot transition to ${transition.to}`);
  }

  const expectedReason = expectedTransitionReason(transition.from, transition.to);
  if (expectedReason === undefined) {
    throw new Error(`binding transition: unsupported ${transition.from} -> ${transition.to}`);
  }
  if (transition.reason !== expectedReason) {
    throw new Error(
      `binding transition: reason ${transition.reason} does not match `
      + `${transition.from} -> ${transition.to}`,
    );
  }
}

function expectedTransitionReason(
  from: BindingLifecycleState,
  to: BindingLifecycleState,
): BindingLifecycleTransitionReason | undefined {
  if (from === 'active' && to === 'suspended') {
    return 'suspend';
  }
  if (from === 'active' && to === 'disposed') {
    return 'dispose';
  }
  if (from === 'suspended' && to === 'active') {
    return 'activate';
  }
  if (from === 'suspended' && to === 'disposed') {
    return 'dispose';
  }
  if ((from === 'active' || from === 'suspended') && from === to) {
    return 'invalidate';
  }

  return undefined;
}

function freezeFacts(facts: readonly BindingFact[] | undefined): readonly BindingFact[] {
  if (facts === undefined || facts.length === 0) {
    return EMPTY_BINDING_FACTS;
  }

  return deepFreeze([...facts]);
}

interface BindingLifecycleOwnerBrandCarrier {
  readonly [BINDING_LIFECYCLE_OWNER_BRAND]?: true;
}

interface BindingLifecycleRecordBrandCarrier {
  readonly [BINDING_LIFECYCLE_RECORD_BRAND]?: true;
}

interface RequiredTextOptions {
  readonly scope: string;
  readonly field: string;
  readonly value: string;
}

function normalizeRequiredText(options: RequiredTextOptions): string {
  const normalized = options.value.trim();
  if (normalized === '') {
    throw new Error(`${options.scope}: ${options.field} is required`);
  }

  return normalized;
}

function optionalRequiredText(
  options: Omit<RequiredTextOptions, 'value'> & { readonly value?: string },
): string | undefined {
  if (options.value === undefined) {
    return undefined;
  }

  return normalizeRequiredText({
    scope: options.scope,
    field: options.field,
    value: options.value,
  });
}

function optionalTrimmedText(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const normalized = value.trim();
  return normalized === '' ? undefined : normalized;
}

function isBindingLifecycleState(value: string): value is BindingLifecycleState {
  return BINDING_LIFECYCLE_STATES.includes(value as BindingLifecycleState);
}

function isBindingLifecycleOwnerKind(value: string): value is BindingLifecycleOwnerKind {
  return BINDING_LIFECYCLE_OWNER_KINDS.includes(value as BindingLifecycleOwnerKind);
}

function isBindingInvalidationReason(value: string): value is BindingInvalidationReason {
  return BINDING_INVALIDATION_REASONS.includes(value as BindingInvalidationReason);
}

function isBindingTransitionReason(value: string): value is BindingLifecycleTransitionReason {
  return BINDING_TRANSITION_REASONS.includes(value as BindingLifecycleTransitionReason);
}

function deepFreeze<T>(value: T, seen = new WeakSet()): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  const objectValue = value as object;
  if (seen.has(objectValue)) {
    return value;
  }

  seen.add(objectValue);

  for (const key of Reflect.ownKeys(objectValue)) {
    const descriptor = Object.getOwnPropertyDescriptor(objectValue, key);
    if (descriptor !== undefined && 'value' in descriptor) {
      deepFreeze(descriptor.value, seen);
    }
  }

  return Object.freeze(value);
}
