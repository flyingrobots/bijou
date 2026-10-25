import { ActiveBindingCollection } from './active-binding-collection-model.js';
import { ACTIVE_BINDING_COLLECTION_BRAND, hasActiveBindingBrand, type ActiveBindingEntry } from './active-binding-contracts.js';

export type {
  ActiveBindingEntryInput, ActiveBindingEntry, ActiveBindingProviderAssignment,
  ActiveBindingContractInput, CollectActiveBindingsInput,
} from './active-binding-contracts.js';
export { ActiveBindingCollection };
export { activeBindingEntry, isActiveBindingEntry } from './active-binding-entry.js';
export { collectActiveBindings } from './active-binding-collector.js';

export function activeBindingCollection(
  entries: readonly ActiveBindingEntry[],
): ActiveBindingCollection {
  return new ActiveBindingCollection(entries);
}

export function isActiveBindingCollection(value: unknown): value is ActiveBindingCollection {
  return hasActiveBindingBrand(value, ACTIVE_BINDING_COLLECTION_BRAND);
}
