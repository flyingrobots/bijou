import {
  isDataRequirement,
  isViewDataContract,
  type DataRequirement,
  type ProviderId,
  type RequirementId,
  type ViewDataContract,
} from './binding.js';
import {
  bindingLifecycleRecord,
  isBindingLifecycleOwner,
  type BindingLifecycleOwner,
  type BindingLifecycleRecord,
} from './binding-lifecycle.js';

const ACTIVE_BINDING_ENTRY_BRAND: unique symbol = Symbol('ActiveBindingEntry');
const ACTIVE_BINDING_COLLECTION_BRAND: unique symbol = Symbol('ActiveBindingCollection');
const SCOPE = 'active binding collection';

export interface ActiveBindingEntryInput {
  readonly owner: BindingLifecycleOwner;
  readonly requirement: DataRequirement;
  readonly providerId?: string;
}

export interface ActiveBindingEntry {
  readonly [ACTIVE_BINDING_ENTRY_BRAND]: true;
  readonly owner: BindingLifecycleOwner;
  readonly requirement: DataRequirement;
  readonly providerId?: ProviderId;
}

export interface ActiveBindingProviderAssignment {
  readonly requirementId: string;
  readonly providerId: string;
}

export interface ActiveBindingContractInput {
  readonly owner: BindingLifecycleOwner;
  readonly contract: ViewDataContract;
  readonly providerIds?: readonly ActiveBindingProviderAssignment[];
}

export interface CollectActiveBindingsInput {
  readonly entries?: readonly ActiveBindingEntry[];
  readonly contracts?: readonly ActiveBindingContractInput[];
}

export class ActiveBindingCollection {
  readonly [ACTIVE_BINDING_COLLECTION_BRAND]!: true;
  readonly #entries: readonly ActiveBindingEntry[];
  readonly #entriesByKey: ReadonlyMap<string, ActiveBindingEntry>;

  constructor(entries: readonly ActiveBindingEntry[]) {
    if (!Array.isArray(entries)) {
      throw new Error(`${SCOPE}: entries must be an array`);
    }

    Object.defineProperty(this, ACTIVE_BINDING_COLLECTION_BRAND, { value: true });

    const entriesByKey = new Map<string, ActiveBindingEntry>();
    const entryIndexesByKey = new Map<string, number>();
    const normalizedEntries: ActiveBindingEntry[] = [];

    entries.forEach((entry, index) => {
      if (!isActiveBindingEntry(entry)) {
        throw new Error(
          `${SCOPE}: entry at index ${String(index)} was not created by activeBindingEntry()`,
        );
      }

      const key = activeBindingKey(entry.owner.id, entry.requirement.id);
      const existingEntry = entriesByKey.get(key);
      if (existingEntry !== undefined) {
        const mergedEntry = mergeDuplicateEntry(existingEntry, entry);
        const existingIndex = entryIndexesByKey.get(key);
        if (existingIndex === undefined) {
          throw new Error(
            `${SCOPE}: missing index for owner ${entry.owner.id} requirement ${entry.requirement.id}`,
          );
        }

        entriesByKey.set(key, mergedEntry);
        normalizedEntries[existingIndex] = mergedEntry;
        return;
      }

      entriesByKey.set(key, entry);
      entryIndexesByKey.set(key, normalizedEntries.length);
      normalizedEntries.push(entry);
    });

    this.#entries = Object.freeze(normalizedEntries);
    this.#entriesByKey = entriesByKey;
    Object.freeze(this);
  }

  entries(): readonly ActiveBindingEntry[] {
    return Object.freeze([...this.#entries]);
  }

  requirements(): readonly DataRequirement[] {
    const requirementsById = new Map<RequirementId, DataRequirement>();
    this.#entries.forEach((entry) => {
      if (!requirementsById.has(entry.requirement.id)) {
        requirementsById.set(entry.requirement.id, entry.requirement);
      }
    });

    return Object.freeze([...requirementsById.values()]);
  }

  owners(): readonly BindingLifecycleOwner[] {
    const ownersById = new Map<string, BindingLifecycleOwner>();
    this.#entries.forEach((entry) => {
      if (!ownersById.has(entry.owner.id)) {
        ownersById.set(entry.owner.id, entry.owner);
      }
    });

    return Object.freeze([...ownersById.values()]);
  }

  lifecycleRecords(): readonly BindingLifecycleRecord[] {
    return Object.freeze(
      this.#entries.map((entry) => bindingLifecycleRecord({
        owner: entry.owner,
        requirementId: entry.requirement.id,
        providerId: entry.providerId,
        facts: entry.requirement.facts,
      })),
    );
  }

  get(ownerId: string, requirementId: string): ActiveBindingEntry | undefined {
    return this.#entriesByKey.get(activeBindingKey(
      normalizeRequiredText({
        scope: SCOPE,
        field: 'ownerId',
        value: ownerId,
      }),
      normalizeRequiredText({
        scope: SCOPE,
        field: 'requirementId',
        value: requirementId,
      }),
    ));
  }

  has(ownerId: string, requirementId: string): boolean {
    return this.get(ownerId, requirementId) !== undefined;
  }

  byOwner(ownerId: string): readonly ActiveBindingEntry[] {
    const normalizedOwnerId = normalizeRequiredText({
      scope: SCOPE,
      field: 'ownerId',
      value: ownerId,
    });

    return Object.freeze(
      this.#entries.filter((entry) => entry.owner.id === normalizedOwnerId),
    );
  }

  byRequirement(requirementId: string): readonly ActiveBindingEntry[] {
    const normalizedRequirementId = normalizeRequiredText({
      scope: SCOPE,
      field: 'requirementId',
      value: requirementId,
    });

    return Object.freeze(
      this.#entries.filter((entry) => entry.requirement.id === normalizedRequirementId),
    );
  }

  with(entry: ActiveBindingEntry): ActiveBindingCollection {
    return new ActiveBindingCollection([...this.#entries, entry]);
  }
}

export function activeBindingEntry(input: ActiveBindingEntryInput): ActiveBindingEntry {
  if (!isBindingLifecycleOwner(input.owner)) {
    throw new Error(
      'active binding entry: owner was not created by defineBindingLifecycleOwner()',
    );
  }
  if (!isDataRequirement(input.requirement)) {
    throw new Error(
      'active binding entry: requirement was not created by defineDataRequirement()',
    );
  }

  const providerId = optionalRequiredText({
    scope: 'active binding entry',
    field: 'providerId',
    value: input.providerId,
  });
  const entry: ActiveBindingEntry = {
    [ACTIVE_BINDING_ENTRY_BRAND]: true,
    owner: input.owner,
    requirement: input.requirement,
    ...(providerId === undefined ? {} : { providerId }),
  };

  Object.defineProperty(entry, ACTIVE_BINDING_ENTRY_BRAND, { value: true });
  return Object.freeze(entry);
}

export function isActiveBindingEntry(value: unknown): value is ActiveBindingEntry {
  return Boolean(
    value
      && typeof value === 'object'
      && Object.prototype.hasOwnProperty.call(value, ACTIVE_BINDING_ENTRY_BRAND)
      && (value as ActiveBindingEntryBrandCarrier)[ACTIVE_BINDING_ENTRY_BRAND] === true,
  );
}

export function activeBindingCollection(
  entries: readonly ActiveBindingEntry[],
): ActiveBindingCollection {
  return new ActiveBindingCollection(entries);
}

export function isActiveBindingCollection(value: unknown): value is ActiveBindingCollection {
  return Boolean(
    value
      && typeof value === 'object'
      && Object.prototype.hasOwnProperty.call(value, ACTIVE_BINDING_COLLECTION_BRAND)
      && (value as ActiveBindingCollectionBrandCarrier)[ACTIVE_BINDING_COLLECTION_BRAND] === true,
  );
}

export function collectActiveBindings(
  input: CollectActiveBindingsInput,
): ActiveBindingCollection {
  const source: unknown = input;
  if (!isObjectRecord(source)) {
    throw new Error(`${SCOPE}: input must be an object`);
  }
  const entriesInput = source['entries'];
  const contractsInput = source['contracts'];
  if (entriesInput !== undefined && !isArray(entriesInput)) {
    throw new Error(`${SCOPE}: entries must be an array`);
  }
  if (contractsInput !== undefined && !isArray(contractsInput)) {
    throw new Error(`${SCOPE}: contracts must be an array`);
  }
  const entries: ActiveBindingEntry[] = [];
  for (const entry of entriesInput ?? []) {
    if (!isActiveBindingEntry(entry)) {
      throw new Error(`${SCOPE}: entries must contain active binding entries`);
    }
    entries.push(entry);
  }
  for (const [index, contractInput] of (contractsInput ?? []).entries()) {
    entries.push(...activeBindingEntriesFromContract(contractInput, index));
  }

  return new ActiveBindingCollection(entries);
}

function activeBindingEntriesFromContract(source: unknown, index: number): readonly ActiveBindingEntry[] {
  const i = String(index);
  if (!isObjectRecord(source)) {
    throw new Error(`${SCOPE}: contract ${i} must be an object`);
  }
  const { owner, contract } = source;
  if (!isBindingLifecycleOwner(owner)) {
    throw new Error(`${SCOPE}: contract ${i} owner was not created by defineBindingLifecycleOwner()`);
  }
  if (!isViewDataContract(contract)) {
    throw new Error(`${SCOPE}: contract ${i} was not created by defineViewData()`);
  }
  const providerIds = providerAssignmentsByRequirementId(source['providerIds']);
  const requirementIds = new Set(contract.requirementIds());
  providerIds.forEach((_, requirementId) => {
    if (!requirementIds.has(requirementId)) {
      throw new Error(
        `${SCOPE}: provider assignment ${requirementId} does not match contract ${i}`,
      );
    }
  });
  const requirements = contract.requirements().map((requirement, requirementIndex) => {
    const n = String(requirementIndex);
    if (!isDataRequirement(requirement)) {
      throw new Error(
        `${SCOPE}: contract ${i} requirement ${n} `
        + 'was not created by defineDataRequirement()',
      );
    }

    return requirement;
  });

  return Object.freeze(
    requirements.map((requirement) => activeBindingEntry({
      owner,
      requirement,
      providerId: providerIds.get(requirement.id),
    })),
  );
}

function providerAssignmentsByRequirementId(assignments: unknown): ReadonlyMap<RequirementId, ProviderId> {
  if (assignments === undefined) {
    return new Map();
  }
  if (!isArray(assignments)) {
    throw new Error(`${SCOPE}: providerIds must be an array`);
  }
  if (assignments.length === 0) {
    return new Map();
  }

  const providerIds = new Map<RequirementId, ProviderId>();
  assignments.forEach((assignment, index) => {
    const i = String(index);
    if (!isObjectRecord(assignment)) {
      throw new Error(`${SCOPE}: provider assignment ${i} must be an object`);
    }
    if (typeof assignment['requirementId'] !== 'string') {
      throw new Error(`${SCOPE}: provider assignment ${i} requirementId must be a string`);
    }
    if (typeof assignment['providerId'] !== 'string') {
      throw new Error(`${SCOPE}: provider assignment ${i} providerId must be a string`);
    }

    const requirementId = normalizeRequiredText({
      scope: SCOPE,
      field: 'requirementId',
      value: assignment['requirementId'],
    });
    if (providerIds.has(requirementId)) {
      throw new Error(
        `${SCOPE}: duplicate provider assignment ${requirementId}`,
      );
    }

    providerIds.set(requirementId, normalizeRequiredText({
      scope: SCOPE,
      field: 'providerId',
      value: assignment['providerId'],
    }));
  });

  return providerIds;
}

function activeBindingKey(ownerId: string, requirementId: string): string {
  return `${ownerId}\u0000${requirementId}`;
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function isArray(value: unknown): value is readonly unknown[] {
  return Array.isArray(value);
}

function mergeDuplicateEntry(
  existingEntry: ActiveBindingEntry,
  incomingEntry: ActiveBindingEntry,
): ActiveBindingEntry {
  if (
    existingEntry.providerId !== undefined
    && incomingEntry.providerId !== undefined
    && existingEntry.providerId !== incomingEntry.providerId
  ) {
    throw new Error(
      `${SCOPE}: conflicting providers for owner ${incomingEntry.owner.id} `
      + `requirement ${incomingEntry.requirement.id}`,
    );
  }

  const providerId = existingEntry.providerId ?? incomingEntry.providerId;
  if (providerId === existingEntry.providerId) {
    return existingEntry;
  }

  return activeBindingEntry({
    owner: existingEntry.owner,
    requirement: existingEntry.requirement,
    providerId,
  });
}

interface ActiveBindingEntryBrandCarrier {
  readonly [ACTIVE_BINDING_ENTRY_BRAND]?: true;
}

interface ActiveBindingCollectionBrandCarrier {
  readonly [ACTIVE_BINDING_COLLECTION_BRAND]?: true;
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
