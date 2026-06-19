import type { DeepReadonly } from './binding.js';

export function freezeInertData<T>(value: DeepReadonly<T> | T, path: string): DeepReadonly<T> {
  return deepFreeze(cloneInertData<T>(value, path));
}

export function deepFreeze<T>(value: T, seen?: WeakSet<object>): DeepReadonly<T>;
export function deepFreeze(value: unknown, seen = new WeakSet()): unknown {
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

function cloneInertData<T>(value: DeepReadonly<T> | T, path: string, seen?: WeakSet<object>): T;
function cloneInertData(value: unknown, path: string, seen = new WeakSet()): unknown {
  if (
    value === null
    || typeof value === 'string'
    || typeof value === 'number'
    || typeof value === 'boolean'
  ) {
    return value;
  }

  if (typeof value === 'bigint' || typeof value === 'symbol' || typeof value === 'function') {
    throw new Error(`block schema data: unsupported ${typeof value} at ${path}`);
  }

  if (value === undefined) {
    throw new Error(`block schema data: unsupported undefined at ${path}`);
  }

  if (typeof value !== 'object') {
    throw new Error(`block schema data: unsupported ${typeof value} at ${path}`);
  }

  if (seen.has(value)) {
    throw new Error(`block schema data: circular reference at ${path}`);
  }
  seen.add(value);

  try {
    if (isInertArray(value)) {
      return value.map((item, index) => cloneInertData(item, `${path}[${String(index)}]`, seen));
    }

    if (!isPlainObject(value)) {
      throw new Error(`block schema data: unsupported ${objectKind(value)} at ${path}`);
    }

    const clone: Record<string, unknown> = {};
    if (Reflect.getPrototypeOf(value) === null) {
      Object.setPrototypeOf(clone, null);
    }

    const descriptors = Object.getOwnPropertyDescriptors(value);
    for (const key of Reflect.ownKeys(descriptors)) {
      if (typeof key === 'symbol') {
        throw new Error(`block schema data: unsupported symbol property at ${path}`);
      }

      const propertyPath = `${path}.${key}`;
      const descriptor = descriptors[key];
      if (descriptor === undefined) {
        continue;
      }
      if (!descriptor.enumerable) {
        throw new Error(`block schema data: unsupported non-enumerable property at ${propertyPath}`);
      }
      if ('get' in descriptor || 'set' in descriptor) {
        throw new Error(`block schema data: unsupported accessor at ${propertyPath}`);
      }

      clone[key] = cloneInertData(descriptor.value as unknown, propertyPath, seen);
    }

    return clone;
  } finally {
    seen.delete(value);
  }
}

function isPlainObject(value: object): boolean {
  const prototype = Reflect.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isInertArray(value: unknown): value is readonly unknown[] {
  return Array.isArray(value);
}

function objectKind(value: object): string {
  return Object.prototype.toString.call(value).slice(8, -1);
}
