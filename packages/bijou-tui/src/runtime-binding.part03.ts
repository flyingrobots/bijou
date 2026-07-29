import type { DeepReadonly } from '@flyingrobots/bijou';
import { deepFreeze, isPlainObject, isRuntimePayloadArray, objectKind } from './runtime-binding.part02.js';

function cloneRuntimePayload<Payload>(
  value: Payload,
  path: string,
  seen?: WeakSet<object>,
): Payload;

function cloneRuntimePayload(value: unknown, path: string, seen = new WeakSet()): unknown {
  if (
    value === null
    || typeof value === 'string'
    || typeof value === 'number'
    || typeof value === 'boolean'
  ) {
    return value;
  }

  if (typeof value === 'bigint' || typeof value === 'symbol' || typeof value === 'function') {
    throw new Error(`runtime command intent payload: unsupported ${typeof value} at ${path}`);
  }
  if (value === undefined) {
    throw new Error(`runtime command intent payload: unsupported undefined at ${path}`);
  }
  if (typeof value !== 'object') {
    throw new Error(`runtime command intent payload: unsupported ${typeof value} at ${path}`);
  }

  const objectValue = value;
  if (seen.has(objectValue)) {
    throw new Error(`runtime command intent payload: circular reference at ${path}`);
  }
  seen.add(objectValue);

  try {
    if (isRuntimePayloadArray(value)) {
      return value.map((item, index) => cloneRuntimePayload(
        item,
        `${path}[${String(index)}]`,
        seen,
      ));
    }
    if (!isPlainObject(value)) {
      throw new Error(
        `runtime command intent payload: unsupported ${objectKind(value)} at ${path}`,
      );
    }

    const clone: Record<string, unknown> = {};
    if (Reflect.getPrototypeOf(value) === null) {
      Object.setPrototypeOf(clone, null);
    }
    const descriptors = Object.getOwnPropertyDescriptors(value);
    for (const key of Reflect.ownKeys(descriptors)) {
      if (typeof key === 'symbol') {
        throw new Error(`runtime command intent payload: unsupported symbol property at ${path}`);
      }

      const descriptor = descriptors[key];
      const propertyPath = `${path}.${key}`;
      if (descriptor === undefined) {
        continue;
      }
      if (!descriptor.enumerable) {
        throw new Error(
          `runtime command intent payload: unsupported non-enumerable property at ${propertyPath}`,
        );
      }
      if ('get' in descriptor || 'set' in descriptor) {
        throw new Error(
          `runtime command intent payload: unsupported accessor at ${propertyPath}`,
        );
      }

      clone[key] = cloneRuntimePayload(descriptor.value as unknown, propertyPath, seen);
    }

    return clone;
  } finally {
    seen.delete(objectValue);
  }
}

function freezeRuntimePayload<Payload>(
  payload: Payload | undefined,
): DeepReadonly<Payload | undefined> {
  if (payload === undefined) {
    return undefined as DeepReadonly<Payload | undefined>;
  }

  return deepFreeze(cloneRuntimePayload(payload, 'payload'));
}

export { freezeRuntimePayload };
