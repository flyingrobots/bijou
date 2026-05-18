import type { ModeLoweringFact } from './mode-lowering.js';

const DATA_REQUIREMENT_BRAND: unique symbol = Symbol('DataRequirement');
const BINDING_SNAPSHOT_BRAND: unique symbol = Symbol('BindingSnapshot');
const COMMAND_INTENT_BRAND: unique symbol = Symbol('CommandIntent');
const COMMAND_INTENT_PAYLOAD: unique symbol = Symbol('CommandIntentPayload');

export type ProviderId = string;
export type RequirementId = string;
export type CommandIntentId = string;

export type BindingStatus = 'ready' | 'loading' | 'empty' | 'stale' | 'error';

export type BindingIssueSeverity = 'info' | 'warning' | 'error';

export type BindingFact = ModeLoweringFact;

export type DeepReadonly<T> = T extends readonly (infer Item)[]
  ? readonly DeepReadonly<Item>[]
  : T extends object
    ? { readonly [Key in keyof T]: DeepReadonly<T[Key]> }
    : T;

export interface BindingIssue {
  readonly severity: BindingIssueSeverity;
  readonly code: string;
  readonly message: string;
  readonly path?: string;
}

export interface DataRequirementInput {
  readonly id: string;
  readonly resource: string;
  readonly label?: string;
  readonly description?: string;
  readonly optional?: boolean;
  readonly facts?: readonly BindingFact[];
}

export interface DataRequirement {
  readonly [DATA_REQUIREMENT_BRAND]: true;
  readonly id: RequirementId;
  readonly resource: string;
  readonly label?: string;
  readonly description?: string;
  readonly optional?: boolean;
  readonly facts: readonly BindingFact[];
}

export interface BindingSnapshotInput<Data = unknown> {
  readonly providerId: string;
  readonly requirementId: string;
  readonly version: number;
  readonly status: BindingStatus;
  readonly data?: Data;
  readonly issues?: readonly BindingIssue[];
  readonly facts?: readonly BindingFact[];
}

export interface BindingSnapshot<Data = unknown> {
  readonly [BINDING_SNAPSHOT_BRAND]: true;
  readonly providerId: ProviderId;
  readonly requirementId: RequirementId;
  readonly version: number;
  readonly status: BindingStatus;
  readonly data?: DeepReadonly<Data>;
  readonly issues: readonly BindingIssue[];
  readonly facts: readonly BindingFact[];
}

export interface CommandIntentOptions {
  readonly label?: string;
  readonly description?: string;
  readonly facts?: readonly BindingFact[];
}

export interface CommandIntent<Payload = unknown> {
  readonly [COMMAND_INTENT_BRAND]: true;
  readonly [COMMAND_INTENT_PAYLOAD]?: Payload;
  readonly id: CommandIntentId;
  readonly label?: string;
  readonly description?: string;
  readonly facts: readonly BindingFact[];
}

const BINDING_STATUSES: readonly BindingStatus[] = [
  'ready',
  'loading',
  'empty',
  'stale',
  'error',
];
const BINDING_ISSUE_SEVERITIES: readonly BindingIssueSeverity[] = [
  'info',
  'warning',
  'error',
];
const EMPTY_BINDING_ISSUES = Object.freeze([]) as readonly BindingIssue[];
const EMPTY_BINDING_FACTS = Object.freeze([]) as readonly BindingFact[];

export class BindingFrame {
  readonly #snapshotsByRequirementId: ReadonlyMap<RequirementId, BindingSnapshot>;

  constructor(snapshots: readonly BindingSnapshot[]) {
    const snapshotsByRequirementId = new Map<RequirementId, BindingSnapshot>();

    snapshots.forEach((snapshot, index) => {
      if (!isBindingSnapshot(snapshot)) {
        throw new Error(
          `binding frame: snapshot at index ${index} was not created by bindingSnapshot()`,
        );
      }

      if (snapshotsByRequirementId.has(snapshot.requirementId)) {
        throw new Error(`binding frame: duplicate requirement id ${snapshot.requirementId}`);
      }

      snapshotsByRequirementId.set(snapshot.requirementId, snapshot);
    });

    this.#snapshotsByRequirementId = snapshotsByRequirementId;
    Object.freeze(this);
  }

  ids(): readonly RequirementId[] {
    return Object.freeze([...this.#snapshotsByRequirementId.keys()]);
  }

  snapshot<Data = unknown>(requirementId: RequirementId): BindingSnapshot<Data> | undefined {
    const normalizedRequirementId = normalizeRequiredText({
      scope: 'binding frame',
      field: 'requirementId',
      value: requirementId,
    });

    return this.#snapshotsByRequirementId.get(normalizedRequirementId) as
      | BindingSnapshot<Data>
      | undefined;
  }

  get<Data = unknown>(requirementId: RequirementId): DeepReadonly<Data> | undefined {
    return this.snapshot<Data>(requirementId)?.data;
  }

  require<Data = unknown>(requirementId: RequirementId): DeepReadonly<Data> {
    const snapshot = this.snapshot<Data>(requirementId);
    if (snapshot === undefined) {
      throw new Error(`binding frame: missing requirement ${requirementId}`);
    }

    if (snapshot.status !== 'ready') {
      throw new Error(`binding frame: requirement ${snapshot.requirementId} is ${snapshot.status}`);
    }

    if (snapshot.data === undefined) {
      throw new Error(`binding frame: requirement ${snapshot.requirementId} has no data`);
    }

    return snapshot.data;
  }

  status(requirementId: RequirementId): BindingStatus | undefined {
    return this.snapshot(requirementId)?.status;
  }

  issues(requirementId: RequirementId): readonly BindingIssue[] {
    return this.snapshot(requirementId)?.issues ?? EMPTY_BINDING_ISSUES;
  }

  facts(requirementId: RequirementId): readonly BindingFact[] {
    return this.snapshot(requirementId)?.facts ?? EMPTY_BINDING_FACTS;
  }
}

export function defineDataRequirement(input: DataRequirementInput): DataRequirement {
  const requirement = {
    id: normalizeRequiredText({
      scope: 'data requirement',
      field: 'id',
      value: input.id,
    }),
    resource: normalizeRequiredText({
      scope: 'data requirement',
      field: 'resource',
      value: input.resource,
    }),
    label: optionalTrimmedText(input.label),
    description: optionalTrimmedText(input.description),
    optional: input.optional,
    facts: freezeFacts(input.facts),
  } as DataRequirement;

  Object.defineProperty(requirement, DATA_REQUIREMENT_BRAND, { value: true });
  return Object.freeze(requirement);
}

export function bindingSnapshot<Data = unknown>(
  input: BindingSnapshotInput<Data>,
): BindingSnapshot<Data> {
  const providerId = normalizeRequiredText({
    scope: 'binding snapshot',
    field: 'providerId',
    value: input.providerId,
  });
  const requirementId = normalizeRequiredText({
    scope: 'binding snapshot',
    field: 'requirementId',
    value: input.requirementId,
  });
  if (!Number.isInteger(input.version) || input.version < 1) {
    throw new Error('binding snapshot: version must be a positive integer');
  }
  if (!isBindingStatus(input.status)) {
    throw new Error(`binding snapshot: unsupported status ${String(input.status)}`);
  }

  const snapshot = {
    providerId,
    requirementId,
    version: input.version,
    status: input.status,
    ...(input.data === undefined ? {} : { data: deepFreeze(input.data) }),
    issues: freezeIssues(input.issues),
    facts: freezeFacts(input.facts),
  } as BindingSnapshot<Data>;

  Object.defineProperty(snapshot, BINDING_SNAPSHOT_BRAND, { value: true });
  return Object.freeze(snapshot);
}

export function bindingFrame(snapshots: readonly BindingSnapshot[]): BindingFrame {
  return new BindingFrame(snapshots);
}

export function commandIntent<Payload = unknown>(
  id: string,
  options: CommandIntentOptions = {},
): CommandIntent<Payload> {
  const intent = {
    id: normalizeRequiredText({
      scope: 'command intent',
      field: 'id',
      value: id,
    }),
    label: optionalTrimmedText(options.label),
    description: optionalTrimmedText(options.description),
    facts: freezeFacts(options.facts),
  } as CommandIntent<Payload>;

  Object.defineProperty(intent, COMMAND_INTENT_BRAND, { value: true });
  return Object.freeze(intent);
}

export function isBindingSnapshot(value: unknown): value is BindingSnapshot {
  return Boolean(
    value
      && typeof value === 'object'
      && (value as BindingSnapshotBrandCarrier)[BINDING_SNAPSHOT_BRAND] === true,
  );
}

interface BindingSnapshotBrandCarrier {
  readonly [BINDING_SNAPSHOT_BRAND]?: true;
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

function optionalTrimmedText(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const normalized = value.trim();
  return normalized === '' ? undefined : normalized;
}

function isBindingStatus(value: string): value is BindingStatus {
  return BINDING_STATUSES.includes(value as BindingStatus);
}

function isBindingIssueSeverity(value: string): value is BindingIssueSeverity {
  return BINDING_ISSUE_SEVERITIES.includes(value as BindingIssueSeverity);
}

function freezeIssues(issues: readonly BindingIssue[] | undefined): readonly BindingIssue[] {
  if (issues === undefined || issues.length === 0) {
    return EMPTY_BINDING_ISSUES;
  }

  return deepFreeze(issues.map((issue, index) => normalizeIssue(issue, index)));
}

function normalizeIssue(issue: BindingIssue, index: number): BindingIssue {
  if (!isBindingIssueSeverity(issue.severity)) {
    throw new Error(`binding issue: unsupported severity ${String(issue.severity)} at index ${index}`);
  }

  return {
    severity: issue.severity,
    code: normalizeRequiredText({
      scope: 'binding issue',
      field: `issues[${index}].code`,
      value: issue.code,
    }),
    message: normalizeRequiredText({
      scope: 'binding issue',
      field: `issues[${index}].message`,
      value: issue.message,
    }),
    path: optionalTrimmedText(issue.path),
  };
}

function freezeFacts(facts: readonly BindingFact[] | undefined): readonly BindingFact[] {
  if (facts === undefined || facts.length === 0) {
    return EMPTY_BINDING_FACTS;
  }

  return deepFreeze([...facts]);
}

function deepFreeze<T>(value: T, seen: WeakSet<object> = new WeakSet<object>()): DeepReadonly<T> {
  if (value === null || typeof value !== 'object') {
    return value as DeepReadonly<T>;
  }

  const objectValue = value as object;
  if (seen.has(objectValue)) {
    return value as DeepReadonly<T>;
  }

  seen.add(objectValue);

  for (const key of Reflect.ownKeys(objectValue)) {
    const descriptor = Object.getOwnPropertyDescriptor(objectValue, key);
    if (descriptor !== undefined && 'value' in descriptor) {
      deepFreeze(descriptor.value, seen);
    }
  }

  return Object.freeze(value) as DeepReadonly<T>;
}
