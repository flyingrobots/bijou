import type { DataRequirement, ProviderId, ViewDataContract } from './binding.js';
import type { BindingLifecycleOwner } from './binding-lifecycle.js';

export const ACTIVE_BINDING_ENTRY_BRAND: unique symbol = Symbol('ActiveBindingEntry');
export const ACTIVE_BINDING_COLLECTION_BRAND: unique symbol = Symbol('ActiveBindingCollection');
export const SCOPE = 'active binding collection';

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

export function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

export function isArray(value: unknown): value is readonly unknown[] {
  return Array.isArray(value);
}

interface RequiredTextOptions {
  readonly scope: string;
  readonly field: string;
  readonly value: string;
}

export function normalizeRequiredText(options: RequiredTextOptions): string {
  const normalized = options.value.trim();
  if (normalized === '') {
    throw new Error(`${options.scope}: ${options.field} is required`);
  }

  return normalized;
}

export function optionalRequiredText(
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

/** Read only an own brand after narrowing its carrier to an object. */
export function hasActiveBindingBrand(value: unknown, brand: symbol): boolean {
  return isBrandCarrier(value)
    && Object.prototype.hasOwnProperty.call(value, brand)
    && value[brand] === true;
}

function isBrandCarrier(value: unknown): value is Record<PropertyKey, unknown> {
  return value !== null && typeof value === 'object';
}
