import type { BindingFact } from './binding.js';

import { BINDING_INVALIDATION_REASONS, BINDING_LIFECYCLE_OWNER_KINDS, BINDING_LIFECYCLE_STATES, BINDING_TRANSITION_REASONS, EMPTY_BINDING_FACTS } from './binding-lifecycle.part01.js';

import type { BindingInvalidationReason, BindingLifecycleOwnerKind, BindingLifecycleState, BindingLifecycleTransitionReason } from './binding-lifecycle.part01.js';
export function freezeFacts(facts: readonly BindingFact[] | undefined): readonly BindingFact[] {
  if (facts === undefined || facts.length === 0) {
    return EMPTY_BINDING_FACTS;
  }

  return deepFreeze([...facts]);
}
export interface RequiredTextOptions {
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
export function optionalTrimmedText(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const normalized = value.trim();
  return normalized === '' ? undefined : normalized;
}
export function isBindingLifecycleState(value: string): value is BindingLifecycleState {
  return isOneOf(BINDING_LIFECYCLE_STATES, value);
}
export function isBindingLifecycleOwnerKind(value: string): value is BindingLifecycleOwnerKind {
  return isOneOf(BINDING_LIFECYCLE_OWNER_KINDS, value);
}
export function isBindingInvalidationReason(value: string): value is BindingInvalidationReason {
  return isOneOf(BINDING_INVALIDATION_REASONS, value);
}
export function isBindingTransitionReason(value: string): value is BindingLifecycleTransitionReason {
  return isOneOf(BINDING_TRANSITION_REASONS, value);
}
export function isOneOf<T extends string>(values: readonly T[], value: string): value is T {
  return values.some((item) => item === value);
}
export function deepFreeze<T>(value: T, seen = new WeakSet()): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  const objectValue = value as object;
  if (seen.has(objectValue)) {
    return value;
  }

  seen.add(objectValue);

  for (const key of Reflect.ownKeys(objectValue)) {
    const descriptor = Object.getOwnPropertyDescriptor(objectValue, key);
    if (descriptor !== undefined && 'value' in descriptor) {
      deepFreeze(descriptor.value, seen);
    }
  }

  return Object.freeze(value);
}
