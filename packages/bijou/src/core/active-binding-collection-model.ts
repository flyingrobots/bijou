import type { DataRequirement, RequirementId } from './binding.js';
import { bindingLifecycleRecord, type BindingLifecycleOwner, type BindingLifecycleRecord } from './binding-lifecycle.js';
import { ACTIVE_BINDING_COLLECTION_BRAND, SCOPE, normalizeRequiredText, type ActiveBindingEntry } from './active-binding-contracts.js';
import { isActiveBindingEntry, mergeDuplicateEntry } from './active-binding-entry.js';

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

function activeBindingKey(ownerId: string, requirementId: string): string {
  return `${ownerId}\u0000${requirementId}`;
}
