import type { ModeLoweringFact } from './mode-lowering.js';

const DATA_REQUIREMENT_BRAND: unique symbol = Symbol('DataRequirement');
const DATA_PROVIDER_BRAND: unique symbol = Symbol('DataProvider');
const VIEW_DATA_CONTRACT_BRAND: unique symbol = Symbol('ViewDataContract');
const BINDING_SNAPSHOT_BRAND: unique symbol = Symbol('BindingSnapshot');
const PROVIDER_SCOPE_ENTRY_BRAND: unique symbol = Symbol('ProviderScopeEntry');
const PROVIDER_SCOPE_BRAND: unique symbol = Symbol('ProviderScope');
const PROVIDER_RESOLUTION_BRAND: unique symbol = Symbol('ProviderResolution');
const COMMAND_INTENT_BRAND: unique symbol = Symbol('CommandIntent');
const COMMAND_INTENT_PAYLOAD: unique symbol = Symbol('CommandIntentPayload');

export type ProviderId = string;
export type RequirementId = string;
export type CommandIntentId = string;

export type BindingStatus = 'ready' | 'loading' | 'empty' | 'stale' | 'error';

export type BindingIssueSeverity = 'info' | 'warning' | 'error';

export type ProviderResolutionStatus = 'resolved' | 'missing-optional' | 'missing-required';

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

export interface DataProviderInput {
  readonly id: string;
  readonly resource: string;
  readonly label?: string;
  readonly description?: string;
  readonly facts?: readonly BindingFact[];
}

export interface DataProvider {
  readonly [DATA_PROVIDER_BRAND]: true;
  readonly id: ProviderId;
  readonly resource: string;
  readonly label?: string;
  readonly description?: string;
  readonly facts: readonly BindingFact[];
}

export interface ViewDataRequirementEntry {
  readonly name: string;
  readonly requirement: DataRequirement;
}

export interface ViewDataInput {
  readonly id?: string;
  readonly label?: string;
  readonly description?: string;
  readonly requirements: readonly ViewDataRequirementEntry[];
  readonly facts?: readonly BindingFact[];
}

export interface ProviderScopeEntry {
  readonly [PROVIDER_SCOPE_ENTRY_BRAND]: true;
  readonly resource: string;
  readonly provider: DataProvider;
}

export interface ProviderScopeOptions {
  readonly id?: string;
  readonly label?: string;
  readonly description?: string;
  readonly facts?: readonly BindingFact[];
}

export interface ProviderResolution {
  readonly [PROVIDER_RESOLUTION_BRAND]: true;
  readonly requirementId: RequirementId;
  readonly resource: string;
  readonly optional: boolean;
  readonly status: ProviderResolutionStatus;
  readonly scopeId?: string;
  readonly providerId?: ProviderId;
  readonly issues: readonly BindingIssue[];
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

export interface BindingFrameFromSnapshotsInput {
  readonly resolutions: readonly ProviderResolution[];
  readonly snapshots: readonly BindingSnapshot[];
}

export interface BindingFrameAssembly {
  readonly frame: BindingFrame;
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

export class ViewDataContract {
  readonly [VIEW_DATA_CONTRACT_BRAND] = true;
  readonly #entriesByName: ReadonlyMap<string, ViewDataRequirementEntry>;
  readonly #entriesByRequirementId: ReadonlyMap<RequirementId, ViewDataRequirementEntry>;
  readonly id?: string;
  readonly label?: string;
  readonly description?: string;
  readonly facts: readonly BindingFact[];

  constructor(input: ViewDataInput) {
    const entriesByName = new Map<string, ViewDataRequirementEntry>();
    const entriesByRequirementId = new Map<RequirementId, ViewDataRequirementEntry>();

    input.requirements.forEach((entry) => {
      const name = normalizeRequiredText({
        scope: 'view data',
        field: 'requirement name',
        value: entry.name,
      });
      if (!isDataRequirement(entry.requirement)) {
        throw new Error(`view data: requirement ${name} was not created by defineDataRequirement()`);
      }
      if (entriesByName.has(name)) {
        throw new Error(`view data: duplicate requirement name ${name}`);
      }
      if (entriesByRequirementId.has(entry.requirement.id)) {
        throw new Error(`view data: duplicate requirement id ${entry.requirement.id}`);
      }

      const normalizedEntry = Object.freeze({
        name,
        requirement: entry.requirement,
      });
      entriesByName.set(name, normalizedEntry);
      entriesByRequirementId.set(entry.requirement.id, normalizedEntry);
    });

    this.#entriesByName = entriesByName;
    this.#entriesByRequirementId = entriesByRequirementId;
    this.id = optionalTrimmedText(input.id);
    this.label = optionalTrimmedText(input.label);
    this.description = optionalTrimmedText(input.description);
    this.facts = freezeFacts(input.facts);
    Object.freeze(this);
  }

  names(): readonly string[] {
    return Object.freeze([...this.#entriesByName.keys()]);
  }

  requirementIds(): readonly RequirementId[] {
    return Object.freeze([...this.#entriesByRequirementId.keys()]);
  }

  entries(): readonly ViewDataRequirementEntry[] {
    return Object.freeze([...this.#entriesByName.values()]);
  }

  requirements(): readonly DataRequirement[] {
    return Object.freeze(this.entries().map((entry) => entry.requirement));
  }

  entry(name: string): ViewDataRequirementEntry | undefined {
    const normalizedName = normalizeRequiredText({
      scope: 'view data',
      field: 'requirement name',
      value: name,
    });

    return this.#entriesByName.get(normalizedName);
  }

  requirement(name: string): DataRequirement | undefined {
    return this.entry(name)?.requirement;
  }
}

export class ProviderScope {
  readonly [PROVIDER_SCOPE_BRAND] = true;
  readonly #providersByResource: ReadonlyMap<string, DataProvider>;
  readonly #providersById: ReadonlyMap<ProviderId, DataProvider>;
  readonly id?: string;
  readonly label?: string;
  readonly description?: string;
  readonly facts: readonly BindingFact[];

  constructor(entries: readonly ProviderScopeEntry[], options: ProviderScopeOptions = {}) {
    const providersByResource = new Map<string, DataProvider>();
    const providersById = new Map<ProviderId, DataProvider>();

    entries.forEach((entry, index) => {
      if (!isProviderScopeEntry(entry)) {
        throw new Error(
          `provider scope: entry at index ${index} was not created by provide()`,
        );
      }

      if (providersByResource.has(entry.resource)) {
        throw new Error(`provider scope: duplicate resource ${entry.resource}`);
      }
      if (providersById.has(entry.provider.id)) {
        throw new Error(`provider scope: duplicate provider id ${entry.provider.id}`);
      }

      providersByResource.set(entry.resource, entry.provider);
      providersById.set(entry.provider.id, entry.provider);
    });

    this.#providersByResource = providersByResource;
    this.#providersById = providersById;
    this.id = optionalTrimmedText(options.id);
    this.label = optionalTrimmedText(options.label);
    this.description = optionalTrimmedText(options.description);
    this.facts = freezeFacts(options.facts);
    Object.freeze(this);
  }

  resources(): readonly string[] {
    return Object.freeze([...this.#providersByResource.keys()]);
  }

  providers(): readonly DataProvider[] {
    return Object.freeze([...this.#providersByResource.values()]);
  }

  providerIds(): readonly ProviderId[] {
    return Object.freeze([...this.#providersById.keys()]);
  }

  has(resource: string): boolean {
    return this.get(resource) !== undefined;
  }

  get(resource: string): DataProvider | undefined {
    const normalizedResource = normalizeRequiredText({
      scope: 'provider scope',
      field: 'resource',
      value: resource,
    });

    return this.#providersByResource.get(normalizedResource);
  }
}

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

export function isDataRequirement(value: unknown): value is DataRequirement {
  return Boolean(
    value
      && typeof value === 'object'
      && (value as DataRequirementBrandCarrier)[DATA_REQUIREMENT_BRAND] === true,
  );
}

export function defineViewData(input: ViewDataInput): ViewDataContract {
  return new ViewDataContract(input);
}

export function isViewDataContract(value: unknown): value is ViewDataContract {
  return Boolean(
    value
      && typeof value === 'object'
      && (value as ViewDataContractBrandCarrier)[VIEW_DATA_CONTRACT_BRAND] === true,
  );
}

export function defineDataProvider(input: DataProviderInput): DataProvider {
  const provider = {
    id: normalizeRequiredText({
      scope: 'data provider',
      field: 'id',
      value: input.id,
    }),
    resource: normalizeRequiredText({
      scope: 'data provider',
      field: 'resource',
      value: input.resource,
    }),
    label: optionalTrimmedText(input.label),
    description: optionalTrimmedText(input.description),
    facts: freezeFacts(input.facts),
  } as DataProvider;

  Object.defineProperty(provider, DATA_PROVIDER_BRAND, { value: true });
  return Object.freeze(provider);
}

export function provide(provider: DataProvider): ProviderScopeEntry {
  if (!isDataProvider(provider)) {
    throw new Error('provider scope: provider was not created by defineDataProvider()');
  }

  const entry = {
    resource: provider.resource,
    provider,
  } as ProviderScopeEntry;

  Object.defineProperty(entry, PROVIDER_SCOPE_ENTRY_BRAND, { value: true });
  return Object.freeze(entry);
}

export function providerScope(
  entries: readonly ProviderScopeEntry[],
  options: ProviderScopeOptions = {},
): ProviderScope {
  return new ProviderScope(entries, options);
}

export function resolveProviderRequirement(
  requirement: DataRequirement,
  scope: ProviderScope,
): ProviderResolution {
  if (!isDataRequirement(requirement)) {
    throw new Error('provider resolution: requirement was not created by defineDataRequirement()');
  }

  const provider = scope.get(requirement.resource);
  const base = {
    requirementId: requirement.id,
    resource: requirement.resource,
    optional: requirement.optional === true,
    scopeId: scope.id,
    facts: freezeFacts([
      ...requirement.facts,
      ...(provider?.facts ?? []),
    ]),
  };

  if (provider !== undefined) {
    return providerResolution({
      ...base,
      status: 'resolved',
      providerId: provider.id,
      issues: EMPTY_BINDING_ISSUES,
    });
  }

  if (requirement.optional === true) {
    return providerResolution({
      ...base,
      status: 'missing-optional',
      issues: EMPTY_BINDING_ISSUES,
    });
  }

  return providerResolution({
    ...base,
    status: 'missing-required',
    issues: freezeIssues([{
      severity: 'error',
      code: 'provider.missing',
      message: `No provider in scope ${scope.id ?? '<anonymous>'} satisfies resource ${requirement.resource}`,
      path: requirement.id,
    }]),
  });
}

export function resolveProviderRequirements(
  requirements: readonly DataRequirement[],
  scope: ProviderScope,
): readonly ProviderResolution[] {
  return Object.freeze(
    requirements.map((requirement) => resolveProviderRequirement(requirement, scope)),
  );
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
    ...(input.data === undefined ? {} : { data: freezeSnapshotData(input.data) }),
    issues: freezeIssues(input.issues),
    facts: freezeFacts(input.facts),
  } as BindingSnapshot<Data>;

  Object.defineProperty(snapshot, BINDING_SNAPSHOT_BRAND, { value: true });
  return Object.freeze(snapshot);
}

export function bindingFrame(snapshots: readonly BindingSnapshot[]): BindingFrame {
  return new BindingFrame(snapshots);
}

export function bindingFrameFromSnapshots(input: BindingFrameFromSnapshotsInput): BindingFrameAssembly {
  const resolutionsByRequirementId = new Map<RequirementId, ProviderResolution>();
  const snapshotsByRequirementId = new Map<RequirementId, BindingSnapshot>();

  input.resolutions.forEach((resolution, index) => {
    if (!isProviderResolution(resolution)) {
      throw new Error(
        `binding frame assembly: resolution at index ${index} was not created by resolveProviderRequirement()`,
      );
    }
    if (resolutionsByRequirementId.has(resolution.requirementId)) {
      throw new Error(`binding frame assembly: duplicate resolution ${resolution.requirementId}`);
    }

    resolutionsByRequirementId.set(resolution.requirementId, resolution);
  });

  input.snapshots.forEach((snapshot, index) => {
    if (!isBindingSnapshot(snapshot)) {
      throw new Error(
        `binding frame assembly: snapshot at index ${index} was not created by bindingSnapshot()`,
      );
    }
    if (!resolutionsByRequirementId.has(snapshot.requirementId)) {
      throw new Error(`binding frame assembly: snapshot requirement ${snapshot.requirementId} was not resolved`);
    }
    if (snapshotsByRequirementId.has(snapshot.requirementId)) {
      throw new Error(`binding frame assembly: duplicate snapshot ${snapshot.requirementId}`);
    }

    snapshotsByRequirementId.set(snapshot.requirementId, snapshot);
  });

  const frameSnapshots: BindingSnapshot[] = [];
  const issues: BindingIssue[] = [];
  const facts: BindingFact[] = [];

  for (const resolution of resolutionsByRequirementId.values()) {
    facts.push(...resolution.facts);

    if (resolution.status !== 'resolved') {
      issues.push(...resolution.issues);
      continue;
    }

    const snapshot = snapshotsByRequirementId.get(resolution.requirementId);
    if (snapshot === undefined) {
      issues.push({
        severity: 'error',
        code: 'snapshot.missing',
        message: `No snapshot supplied for resolved requirement ${resolution.requirementId}`,
        path: resolution.requirementId,
      });
      continue;
    }

    if (snapshot.providerId !== resolution.providerId) {
      issues.push({
        severity: 'error',
        code: 'snapshot.provider-mismatch',
        message: `Snapshot for requirement ${resolution.requirementId} came from provider ${snapshot.providerId}; expected ${resolution.providerId}`,
        path: resolution.requirementId,
      });
      continue;
    }

    frameSnapshots.push(snapshot);
    facts.push(...snapshot.facts);
  }

  return Object.freeze({
    frame: bindingFrame(frameSnapshots),
    issues: freezeIssues(issues),
    facts: freezeFacts(facts),
  });
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

export function isDataProvider(value: unknown): value is DataProvider {
  return Boolean(
    value
      && typeof value === 'object'
      && (value as DataProviderBrandCarrier)[DATA_PROVIDER_BRAND] === true,
  );
}

export function isProviderScope(value: unknown): value is ProviderScope {
  return Boolean(
    value
      && typeof value === 'object'
      && (value as ProviderScopeBrandCarrier)[PROVIDER_SCOPE_BRAND] === true,
  );
}

export function isCommandIntent(value: unknown): value is CommandIntent {
  return Boolean(
    value
      && typeof value === 'object'
      && (value as CommandIntentBrandCarrier)[COMMAND_INTENT_BRAND] === true,
  );
}

export function isProviderResolution(value: unknown): value is ProviderResolution {
  return Boolean(
    value
      && typeof value === 'object'
      && (value as ProviderResolutionBrandCarrier)[PROVIDER_RESOLUTION_BRAND] === true,
  );
}

function isProviderScopeEntry(value: unknown): value is ProviderScopeEntry {
  return Boolean(
    value
      && typeof value === 'object'
      && (value as ProviderScopeEntryBrandCarrier)[PROVIDER_SCOPE_ENTRY_BRAND] === true,
  );
}

interface BindingSnapshotBrandCarrier {
  readonly [BINDING_SNAPSHOT_BRAND]?: true;
}

interface DataRequirementBrandCarrier {
  readonly [DATA_REQUIREMENT_BRAND]?: true;
}

interface ViewDataContractBrandCarrier {
  readonly [VIEW_DATA_CONTRACT_BRAND]?: true;
}

interface DataProviderBrandCarrier {
  readonly [DATA_PROVIDER_BRAND]?: true;
}

interface ProviderScopeEntryBrandCarrier {
  readonly [PROVIDER_SCOPE_ENTRY_BRAND]?: true;
}

interface ProviderScopeBrandCarrier {
  readonly [PROVIDER_SCOPE_BRAND]?: true;
}

interface ProviderResolutionBrandCarrier {
  readonly [PROVIDER_RESOLUTION_BRAND]?: true;
}

interface CommandIntentBrandCarrier {
  readonly [COMMAND_INTENT_BRAND]?: true;
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

function providerResolution(input: Omit<ProviderResolution, typeof PROVIDER_RESOLUTION_BRAND>): ProviderResolution {
  const resolution = {
    requirementId: input.requirementId,
    resource: input.resource,
    optional: input.optional,
    status: input.status,
    scopeId: input.scopeId,
    providerId: input.providerId,
    issues: input.issues,
    facts: input.facts,
  } as ProviderResolution;

  Object.defineProperty(resolution, PROVIDER_RESOLUTION_BRAND, { value: true });
  return Object.freeze(resolution);
}

function freezeFacts(facts: readonly BindingFact[] | undefined): readonly BindingFact[] {
  if (facts === undefined || facts.length === 0) {
    return EMPTY_BINDING_FACTS;
  }

  return deepFreeze([...facts]);
}

function freezeSnapshotData<T>(value: T): DeepReadonly<T> {
  return deepFreeze(cloneSnapshotData(value, 'data'));
}

function cloneSnapshotData<T>(value: T, path: string, seen = new WeakSet()): T {
  if (
    value === null
    || typeof value === 'string'
    || typeof value === 'number'
    || typeof value === 'boolean'
  ) {
    return value;
  }

  if (typeof value === 'bigint' || typeof value === 'symbol' || typeof value === 'function') {
    throw new Error(`binding data: unsupported ${typeof value} at ${path}`);
  }

  if (value === undefined) {
    throw new Error(`binding data: unsupported undefined at ${path}`);
  }

  if (typeof value !== 'object') {
    throw new Error(`binding data: unsupported ${typeof value} at ${path}`);
  }

  const objectValue = value as object;
  if (seen.has(objectValue)) {
    throw new Error(`binding data: circular reference at ${path}`);
  }
  seen.add(objectValue);

  try {
    if (Array.isArray(value)) {
      return value.map((item, index) => cloneSnapshotData(item, `${path}[${index}]`, seen)) as T;
    }

    if (!isPlainObject(value)) {
      throw new Error(`binding data: unsupported ${objectKind(value)} at ${path}`);
    }

    const clone = Object.create(Object.getPrototypeOf(value)) as SnapshotDataObject;
    const descriptors = Object.getOwnPropertyDescriptors(value);
    for (const key of Reflect.ownKeys(descriptors)) {
      if (typeof key === 'symbol') {
        throw new Error(`binding data: unsupported symbol property at ${path}`);
      }

      const propertyPath = `${path}.${key}`;
      const descriptor = descriptors[key];
      if (descriptor === undefined) {
        continue;
      }
      if (!descriptor.enumerable) {
        throw new Error(`binding data: unsupported non-enumerable property at ${propertyPath}`);
      }
      if ('get' in descriptor || 'set' in descriptor) {
        throw new Error(`binding data: unsupported accessor at ${propertyPath}`);
      }

      clone[key] = cloneSnapshotData(descriptor.value, propertyPath, seen);
    }

    return clone as T;
  } finally {
    seen.delete(objectValue);
  }
}

type SnapshotDataObject = Record<string, unknown>;

function isPlainObject(value: object): boolean {
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function objectKind(value: object): string {
  return Object.prototype.toString.call(value).slice(8, -1);
}

function deepFreeze<T>(value: T, seen = new WeakSet()): DeepReadonly<T> {
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
