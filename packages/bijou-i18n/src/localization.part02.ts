import { type LocalizedObject } from './localization.part01.js';
import {
  freezeLocalizedClone,
  objectKind,
  validateLocalizedArray,
} from './localization.part03.js';

export function freezeLocalizedObject<Value>(
  object: LocalizedObject<Value>,
): LocalizedObject<Value> {
  return Object.freeze({
    ...object,
    key: Object.freeze({ ...object.key }),
    value: freezeLocalizedValue(object.value),
    issues: Object.freeze(
      object.issues.map((issue) =>
        Object.freeze({
          ...issue,
          key: Object.freeze({ ...issue.key }),
        }),
      ),
    ),
    facts: Object.freeze(
      object.facts.map((fact) => Object.freeze({ ...fact })),
    ),
  });
}
/**
 * Deep-freeze a JSON-shaped localized value.
 *
 * This helper intentionally preserves the portable catalog contract rather
 * than arbitrary JavaScript object identity. Plain objects must expose data
 * properties only; accessor-backed plain objects are rejected.
 */
export function freezeLocalizedValue<Value>(value: Value): Value {
  validateLocalizedValue(value, 'value', new WeakSet());
  const clone = structuredClone(value);
  freezeLocalizedClone(clone, new WeakSet());
  return clone;
}
/**
 * Check whether a value can cross the localization resource/data boundary.
 *
 * This performs the same validation as {@link freezeLocalizedValue} without
 * exposing the frozen clone. Adapter code can use it to reject non-portable
 * payloads before constructing catalogs.
 */
export function isJsonShapedLocalizedValue(value: unknown): boolean {
  try {
    freezeLocalizedValue(value);
    return true;
  } catch {
    return false;
  }
}
export function validateLocalizedValue(
  value: unknown,
  path: string,
  seen: WeakSet<object>,
): void {
  if (value == null || typeof value !== 'object') {
    if (
      typeof value === 'bigint' ||
      typeof value === 'symbol' ||
      typeof value === 'function'
    ) {
      throw new Error(
        `Localized value contains unsupported ${typeof value} at ${path}`,
      );
    }
    return;
  }

  const objectValue = value;
  if (seen.has(objectValue)) {
    throw new Error(`Localized value contains circular reference at ${path}`);
  }
  seen.add(objectValue);

  try {
    validateLocalizedObjectValue(value, path, seen);
  } finally {
    seen.delete(objectValue);
  }
}
export function validateLocalizedObjectValue(
  value: object,
  path: string,
  seen: WeakSet<object>,
): void {
  if (Array.isArray(value)) {
    validateLocalizedArray(value, path);
    for (const [index, item] of value.entries()) {
      validateLocalizedValue(item, `${path}[${String(index)}]`, seen);
    }
    return;
  }

  const prototype: unknown = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new Error(
      `Localized value contains unsupported ${objectKind(value)} at ${path}`,
    );
  }

  const descriptors = Object.getOwnPropertyDescriptors(value);
  for (const key of Reflect.ownKeys(descriptors)) {
    if (typeof key === 'symbol') {
      throw new Error(
        `Localized value contains unsupported symbol property at ${path}`,
      );
    }

    const descriptor = descriptors[key];
    if (descriptor === undefined) {
      continue;
    }
    const propertyPath = `${path}.${key}`;
    if (!descriptor.enumerable) {
      throw new Error(
        `Localized value contains unsupported non-enumerable property: ${propertyPath}`,
      );
    }
    if (!('value' in descriptor)) {
      throw new Error(
        `Localized value contains unsupported accessor property: ${propertyPath}`,
      );
    }
    const descriptorValue: unknown = descriptor.value;
    validateLocalizedValue(descriptorValue, propertyPath, seen);
  }
}
