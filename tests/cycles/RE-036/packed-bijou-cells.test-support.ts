import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect } from 'vitest';
import {
  PackedBijouCellsValidationError,
  parsePackedBijouCellsReceipt,
  type PackedBijouCellsValidationCode,
} from '@flyingrobots/bijou';

const FIXTURE_PATH = resolve(
  process.cwd(),
  'tests/fixtures/RE-036/packed-bijou-cells.v1.json',
);

export function validPackedCellsInput(): Record<string, unknown> {
  return requireRecord(JSON.parse(readFileSync(FIXTURE_PATH, 'utf8')));
}

export function recordField(
  value: Record<string, unknown>,
  key: string,
): Record<string, unknown> {
  return requireRecord(value[key]);
}

export function arrayField(
  value: Record<string, unknown>,
  key: string,
): unknown[] {
  const field = value[key];
  if (!Array.isArray(field)) {
    throw new Error(`Expected ${key} to be an array.`);
  }
  return field;
}

export function setCharCode(
  input: Record<string, unknown>,
  cellIndex: number,
  code: number,
): void {
  const bytes = arrayField(input, 'bytes');
  const offset = cellIndex * 10;
  bytes[offset] = code & 0xff;
  bytes[offset + 1] = (code >> 8) & 0xff;
}

export function expectReceiptError(
  input: unknown,
  code: PackedBijouCellsValidationCode,
  path: string,
): void {
  try {
    parsePackedBijouCellsReceipt(input);
    throw new Error('Expected packed-cell validation to fail.');
  } catch (error: unknown) {
    expect(error).toBeInstanceOf(PackedBijouCellsValidationError);
    if (!(error instanceof PackedBijouCellsValidationError)) throw error;
    expect(error.code).toBe(code);
    expect(error.path).toBe(path);
    expect(error.message).toBe(
      `packed-bijou-cells/1 ${code} at ${path}: ${error.detail}`,
    );
  }
}

function requireRecord(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error('Expected a JSON object.');
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
