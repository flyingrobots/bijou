import { isDataRequirement } from './binding.js';
import { isBindingLifecycleOwner } from './binding-lifecycle.js';
import {
  ACTIVE_BINDING_ENTRY_BRAND, SCOPE, optionalRequiredText, hasActiveBindingBrand,
  type ActiveBindingEntry, type ActiveBindingEntryInput,
} from './active-binding-contracts.js';

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
  return hasActiveBindingBrand(value, ACTIVE_BINDING_ENTRY_BRAND);
}

export function mergeDuplicateEntry(
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
