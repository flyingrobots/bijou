export function validateLocalizedArray(
  value: readonly unknown[],
  path: string,
): void {
  const descriptors = Object.getOwnPropertyDescriptors(value);
  let indexedPropertyCount = 0;
  for (const key of Reflect.ownKeys(descriptors)) {
    if (typeof key === 'symbol') {
      throw new Error(
        `Localized value contains unsupported symbol property at ${path}`,
      );
    }

    if (key === 'length') {
      continue;
    }

    const descriptor = descriptors[key];
    if (descriptor === undefined) {
      continue;
    }

    const propertyPath = arrayPropertyPath(path, key);
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
    if (!isArrayIndexKey(key)) {
      throw new Error(
        `Localized value contains unsupported array property: ${propertyPath}`,
      );
    }
    indexedPropertyCount += 1;
  }

  if (indexedPropertyCount !== value.length) {
    throw new Error(
      `Localized value contains unsupported sparse array at ${path}`,
    );
  }
}
export function arrayPropertyPath(path: string, key: string): string {
  return isArrayIndexKey(key) ? `${path}[${key}]` : `${path}.${key}`;
}
export function isArrayIndexKey(key: string): boolean {
  if (key === '') {
    return false;
  }
  const index = Number(key);
  return (
    Number.isInteger(index) &&
    index >= 0 &&
    index < 2 ** 32 - 1 &&
    String(index) === key
  );
}
export function objectKind(value: object): string {
  return Object.prototype.toString.call(value).slice(8, -1);
}
export function freezeLocalizedClone(
  value: unknown,
  seen: WeakSet<object>,
): void {
  if (value == null || typeof value !== 'object') {
    return;
  }

  if (seen.has(value)) {
    return;
  }
  seen.add(value);

  const descriptors = Object.getOwnPropertyDescriptors(value);
  for (const descriptor of Object.values(descriptors)) {
    if ('value' in descriptor) {
      const descriptorValue: unknown = descriptor.value;
      freezeLocalizedClone(descriptorValue, seen);
    }
  }

  Object.freeze(value);
}
