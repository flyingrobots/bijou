import { isBindingLifecycleOwner, isViewDataContract, type DeepReadonly } from '@flyingrobots/bijou';
import { RUNTIME_VIEW_BINDING_SOURCE_BRAND, assertObjectRecord, brand, freezeProviderAssignments } from './runtime-binding.part01.js';
import type { RuntimeViewBindingSource, RuntimeViewBindingSourceInput } from './runtime-binding.part01.js';

export function runtimeViewBindingSource(
  input: RuntimeViewBindingSourceInput,
): RuntimeViewBindingSource {
  assertObjectRecord(input, 'runtime binding source');

  if (!isBindingLifecycleOwner(input.owner)) {
    throw new Error(
      'runtime binding source: owner was not created by defineBindingLifecycleOwner()',
    );
  }
  if (!isViewDataContract(input.contract)) {
    throw new Error(
      'runtime binding source: contract was not created by defineViewData()',
    );
  }
  const providerIds = freezeProviderAssignments(input.providerIds);

  const source = {
    owner: input.owner,
    contract: input.contract,
    ...(providerIds === undefined ? {} : { providerIds }),
  };

  brand(source, RUNTIME_VIEW_BINDING_SOURCE_BRAND);
  return Object.freeze(source);
}

function deepFreeze<Payload>(value: Payload, seen?: WeakSet<object>): DeepReadonly<Payload>;

function deepFreeze(value: unknown, seen = new WeakSet()): unknown {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (seen.has(value)) {
    return value;
  }

  seen.add(value);
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor !== undefined && 'value' in descriptor) {
      deepFreeze(descriptor.value, seen);
    }
  }

  return Object.freeze(value);
}

function isRuntimePayloadArray(value: unknown): value is readonly unknown[] {
  return Array.isArray(value);
}

function isPlainObject(value: object): boolean {
  const prototype = Reflect.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function objectKind(value: object): string {
  return Object.prototype.toString.call(value).slice(8, -1);
}

export { deepFreeze, isPlainObject, isRuntimePayloadArray, objectKind };
