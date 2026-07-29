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
    hasAsciiControl(value)
  ) {
    failPackedCells(code, path, 'expected a canonical non-empty id');
  }
  return value;
}

function hasAsciiControl(value: string): boolean {
  return Array.from(value).some((character) => {
    const codePoint = character.codePointAt(0);
    return codePoint !== undefined && (codePoint <= 0x1f || codePoint === 0x7f);
  });
}
