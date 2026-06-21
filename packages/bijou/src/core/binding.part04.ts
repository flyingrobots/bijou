import { PROVIDER_SCOPE_BRAND } from './binding.part01.js';

import type { BindingFact, DataProvider, ProviderId, ProviderScopeEntry, ProviderScopeOptions } from './binding.part01.js';

import { isProviderScopeEntry, normalizeRequiredText, optionalTrimmedText } from './binding.part09.js';

import { freezeFacts } from './binding.part10.js';
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
          `provider scope: entry at index ${String(index)} was not created by provide()`,
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
