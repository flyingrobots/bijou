import { PROVIDER_RESOLUTION_BRAND } from './binding.part01.js';

import type { BindingFact, DeepReadonly, ProviderResolution } from './binding.part01.js';

import { EMPTY_BINDING_FACTS } from './binding.part02.js';

import { brand } from './binding.part09.js';

import { deepFreeze, isPlainObject, isSnapshotDataArray, objectKind } from './binding.part11.js';
export function providerResolution(input: Omit<ProviderResolution, typeof PROVIDER_RESOLUTION_BRAND>): ProviderResolution {
  const resolution = {
    requirementId: input.requirementId,
    resource: input.resource,
    optional: input.optional,
    status: input.status,
    scopeId: input.scopeId,
    providerId: input.providerId,
    issues: input.issues,
    facts: input.facts,
  };

  brand(resolution, PROVIDER_RESOLUTION_BRAND);
  return Object.freeze(resolution);
}
export function freezeFacts(facts: readonly BindingFact[] | undefined): readonly BindingFact[] {
  if (facts === undefined || facts.length === 0) {
    return EMPTY_BINDING_FACTS;
  }

  return deepFreeze([...facts]);
}
export function freezeSnapshotData<T>(value: T): DeepReadonly<T> {
  return deepFreeze(cloneSnapshotData(value, 'data'));
}
export function cloneSnapshotData<T>(value: T, path: string, seen?: WeakSet<object>): T;
export function cloneSnapshotData(value: unknown, path: string, seen = new WeakSet()): unknown {
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

  const objectValue = value;
  if (seen.has(objectValue)) {
    throw new Error(`binding data: circular reference at ${path}`);
  }
  seen.add(objectValue);

  try {
    if (isSnapshotDataArray(value)) {
      return value.map((item, index) => cloneSnapshotData(item, `${path}[${String(index)}]`, seen));
    }

    if (!isPlainObject(value)) {
      throw new Error(`binding data: unsupported ${objectKind(value)} at ${path}`);
    }

    const clone: SnapshotDataObject = {};
    if (Reflect.getPrototypeOf(value) === null) {
      Object.setPrototypeOf(clone, null);
    }
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

      clone[key] = cloneSnapshotData(descriptor.value as unknown, propertyPath, seen);
    }

    return clone;
  } finally {
    seen.delete(objectValue);
  }
}
export type SnapshotDataObject = Record<string, unknown>;
