import { DATA_PROVIDER_BRAND, DATA_REQUIREMENT_BRAND, PROVIDER_SCOPE_ENTRY_BRAND, VIEW_DATA_CONTRACT_BRAND } from './binding.part01.js';

import type { DataProvider, DataProviderInput, DataRequirement, ProviderScopeEntry, ProviderScopeOptions, ViewDataInput } from './binding.part01.js';

import { ViewDataContract } from './binding.part03.js';

import { ProviderScope } from './binding.part04.js';

import { brand, hasBrand, isDataProvider, normalizeRequiredText, optionalTrimmedText } from './binding.part09.js';

import { freezeFacts } from './binding.part10.js';
export function isDataRequirement(value: unknown): value is DataRequirement {
  return hasBrand(value, DATA_REQUIREMENT_BRAND);
}
export function defineViewData(input: ViewDataInput): ViewDataContract {
  return new ViewDataContract(input);
}
export function isViewDataContract(value: unknown): value is ViewDataContract {
  return hasBrand(value, VIEW_DATA_CONTRACT_BRAND);
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
  };

  brand(provider, DATA_PROVIDER_BRAND);
  return Object.freeze(provider);
}
export function provide(provider: DataProvider): ProviderScopeEntry {
  if (!isDataProvider(provider)) {
    throw new Error('provider scope: provider was not created by defineDataProvider()');
  }

  const entry = {
    resource: provider.resource,
    provider,
  };

  brand(entry, PROVIDER_SCOPE_ENTRY_BRAND);
  return Object.freeze(entry);
}
export function providerScope(
  entries: readonly ProviderScopeEntry[],
  options: ProviderScopeOptions = {},
): ProviderScope {
  return new ProviderScope(entries, options);
}
