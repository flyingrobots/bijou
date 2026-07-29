import { failPageTarget } from './profunctor-page-error.js';
import type { JsonRecord } from './profunctor-page-json-record.js';
import { stableJsonStringify } from './stable-json.js';

export type { JsonRecord } from './profunctor-page-json-record.js';

export function parseCanonicalRecord(source: string, filename: string): JsonRecord {
  let value: unknown;
  try {
    value = JSON.parse(source);
  } catch (error) {
    failPageTarget(
      'BIJOU_PAGE_INPUT_JSON_INVALID',
      filename,
      'input is not valid JSON',
      error,
    );
  }
  const record = expectRecord(value, filename);
  const canonical = stableJsonStringify(record, 'profunctor-page/0');
  if (source !== canonical && source !== `${canonical}\n`) {
    failPageTarget(
      'BIJOU_PAGE_INPUT_JSON_INVALID',
      filename,
      'input must use canonical JSON with at most one trailing newline',
    );
  }
  return record;
}

export function expectRecord(value: unknown, path: string): JsonRecord {
  if (!isJsonRecord(value)) {
    failPageTarget('BIJOU_PAGE_INPUT_REFERENCE_INVALID', path, 'expected object');
  }
  return value;
}

export function expectRecords(value: unknown, path: string): JsonRecord[] {
  return expectArray(value, path).map((item, index) => (
    expectRecord(item, `${path}[${String(index)}]`)
  ));
}

export function expectArray(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) {
    failPageTarget('BIJOU_PAGE_INPUT_REFERENCE_INVALID', path, 'expected array');
  }
  return value;
}

export function expectString(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    failPageTarget('BIJOU_PAGE_INPUT_REFERENCE_INVALID', path, 'expected non-empty string');
  }
  return value;
}

export function expectStrings(value: unknown, path: string): string[] {
  return expectArray(value, path).map((item, index) => (
    expectString(item, `${path}[${String(index)}]`)
  ));
}

export function expectBoolean(value: unknown, path: string): boolean {
  if (typeof value !== 'boolean') {
    failPageTarget('BIJOU_PAGE_INPUT_REFERENCE_INVALID', path, 'expected boolean');
  }
  return value;
}

export function expectNumber(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    failPageTarget('BIJOU_PAGE_INPUT_REFERENCE_INVALID', path, 'expected finite number');
  }
  return value;
}

export function expectNullableString(value: unknown, path: string): string | null {
  return value === null ? null : expectString(value, path);
}

export function expectStringRecord(
  value: unknown,
  path: string,
): Record<string, string> {
  const input = expectRecord(value, path);
  return Object.fromEntries(Object.entries(input).map(([key, item]) => [
    key,
    expectString(item, `${path}.${key}`),
  ]));
}

export function expectVersion(
  record: JsonRecord,
  version: string,
  filename: string,
): void {
  if (record.artifactVersion !== version) {
    failPageTarget(
      'BIJOU_PAGE_INPUT_VERSION_UNSUPPORTED',
      `${filename}.artifactVersion`,
      `expected ${version}; got ${String(record.artifactVersion)}`,
    );
  }
}

function isJsonRecord(value: unknown): value is JsonRecord {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}
