import { MAX_PACKED_BIJOU_CELLS } from './packed-bijou-cells-contract.js';
import { failPackedCells } from './packed-bijou-cells-schema-values.js';

export type JsonRecord = Record<string, unknown>;

export function recordAt(
  value: unknown,
  path: string,
  fields: readonly string[],
): JsonRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    failPackedCells('invalid-shape', path, 'expected an object');
  }
  if (
    Object.getPrototypeOf(value) !== Object.prototype &&
    Object.getPrototypeOf(value) !== null
  ) {
    failPackedCells('invalid-shape', path, 'expected a plain object');
  }
  if (Object.getOwnPropertySymbols(value).length > 0) {
    failPackedCells('invalid-shape', path, 'symbol fields are not JSON-shaped');
  }

  const record: JsonRecord = {};
  for (const key of Object.getOwnPropertyNames(value).sort()) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (
      !descriptor ||
      !Object.hasOwn(descriptor, 'value') ||
      !descriptor.enumerable
    ) {
      failPackedCells(
        'invalid-shape',
        propertyPath(path, key),
        'accessors and non-enumerable fields are not allowed',
      );
    }
    Object.defineProperty(record, key, {
      configurable: true,
      enumerable: true,
      value: descriptor.value,
      writable: true,
    });
  }
  assertExactFields(record, path, fields);
  return record;
}

export function arrayAt(
  value: unknown,
  path: string,
  maxLength = MAX_PACKED_BIJOU_CELLS,
): unknown[] {
  if (!Array.isArray(value)) {
    failPackedCells('invalid-shape', path, 'expected an array');
  }
  if (Object.getPrototypeOf(value) !== Array.prototype) {
    failPackedCells('invalid-shape', path, 'expected a plain array');
  }
  if (value.length > maxLength) {
    failPackedCells(
      'invalid-shape',
      path,
      `array length exceeds ${String(maxLength)}`,
    );
  }
  if (Object.getOwnPropertySymbols(value).length > 0) {
    failPackedCells('invalid-shape', path, 'symbol fields are not JSON-shaped');
  }
  const extra = Object.getOwnPropertyNames(value)
    .filter((key) => key !== 'length')
    .filter((key) => {
      const index = Number(key);
      return (
        !Number.isSafeInteger(index) ||
        index < 0 ||
        index >= value.length ||
        String(index) !== key
      );
    })
    .sort()[0];
  if (extra !== undefined) {
    failPackedCells(
      'unknown-field',
      propertyPath(path, extra),
      'field is not allowed',
    );
  }

  const result: unknown[] = [];
  for (let index = 0; index < value.length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    if (!descriptor || !Object.hasOwn(descriptor, 'value')) {
      failPackedCells(
        'invalid-shape',
        `${path}[${String(index)}]`,
        'sparse entries and accessors are not allowed',
      );
    }
    result.push(descriptor.value);
  }
  return result;
}

function assertExactFields(
  record: JsonRecord,
  path: string,
  fields: readonly string[],
): void {
  const allowed = new Set(fields);
  const unknown = Object.keys(record)
    .filter((key) => !allowed.has(key))
    .sort()[0];
  if (unknown !== undefined) {
    failPackedCells(
      'unknown-field',
      propertyPath(path, unknown),
      'field is not allowed',
    );
  }
  for (const field of fields) {
    if (!Object.hasOwn(record, field)) {
      failPackedCells(
        'invalid-shape',
        `${path}.${field}`,
        'required field is missing',
      );
    }
  }
}

function propertyPath(path: string, key: string): string {
  if (/^[A-Za-z_$][A-Za-z0-9_$]*$/u.test(key)) {
    return `${path}.${key}`;
  }
  const encoded = JSON.stringify(key);
  return `${path}[${encoded}]`;
}
