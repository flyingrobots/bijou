import type { DeepReadonly } from './binding.part01.js';
export function isPlainObject(value: object): boolean {
  const prototype = Reflect.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
export function isSnapshotDataArray(value: unknown): value is readonly unknown[] {
  return Array.isArray(value);
}
export function objectKind(value: object): string {
  return Object.prototype.toString.call(value).slice(8, -1);
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
