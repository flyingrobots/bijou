import {
  PackedBijouCellsValidationError,
  type PackedBijouCellsValidationCode,
} from './packed-bijou-cells-contract.js';

export function failPackedCells(
  code: PackedBijouCellsValidationCode,
  path: string,
  detail: string,
): never {
  throw new PackedBijouCellsValidationError(code, path, detail);
}

export function literalAt(
  value: unknown,
  expected: string,
  path: string,
): void {
  if (value !== expected) {
    failPackedCells('wrong-literal', path, `expected "${expected}"`);
  }
}

export function positiveSafeIntegerAt(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) {
    failPackedCells(
      'invalid-dimension',
      path,
      'expected a positive safe integer',
    );
  }
  return value;
}

export function canonicalIdAt(
  value: unknown,
  path: string,
  code: 'invalid-scene' | 'invalid-focus' = 'invalid-scene',
): string {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value !== value.trim() ||
    hasIdentifierControl(value)
  ) {
    failPackedCells(code, path, 'expected a canonical non-empty id');
  }
  return value;
}

export function jsonPropertyPath(path: string, key: string): string {
  if (/^[A-Za-z_$][A-Za-z0-9_$]*$/u.test(key)) {
    return `${path}.${key}`;
  }
  return `${path}[${escapeJsonString(key)}]`;
}

function escapeJsonString(value: string): string {
  let result = '';
  for (const character of JSON.stringify(value)) {
    const codePoint = character.codePointAt(0);
    if (
      codePoint !== undefined &&
      ((codePoint >= 0x7f && codePoint <= 0x9f) ||
        codePoint === 0x2028 ||
        codePoint === 0x2029)
    ) {
      result += `\\u${codePoint.toString(16).padStart(4, '0')}`;
    } else {
      result += character;
    }
  }
  return result;
}

function hasIdentifierControl(value: string): boolean {
  return Array.from(value).some((character) => {
    const codePoint = character.codePointAt(0);
    return (
      codePoint !== undefined &&
      (codePoint <= 0x1f ||
        (codePoint >= 0x7f && codePoint <= 0x9f) ||
        codePoint === 0x2028 ||
        codePoint === 0x2029)
    );
  });
}
