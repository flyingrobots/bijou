import { isDataRequirement, isViewDataContract, type ProviderId, type RequirementId } from './binding.js';
import { isBindingLifecycleOwner } from './binding-lifecycle.js';
import {
  SCOPE, isObjectRecord, isArray, normalizeRequiredText,
  type ActiveBindingEntry, type CollectActiveBindingsInput,
} from './active-binding-contracts.js';
import { activeBindingEntry, isActiveBindingEntry } from './active-binding-entry.js';
import { ActiveBindingCollection } from './active-binding-collection-model.js';

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
