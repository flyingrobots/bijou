import type { BlockSchemaResult } from '@flyingrobots/bijou';
import { s } from './dogfood-block-common.js';

export function schemaError<Data = never>(code: string, message: string): BlockSchemaResult<Data> {
  return {
    ok: false,
    issues: [{
      severity: 'error',
      code,
      message,
    }],
  };
}

export function isPlainRecord(input: unknown): input is Record<string, unknown> {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    return false;
  }

  const prototype: unknown = Object.getPrototypeOf(input);
  return prototype === Object.prototype || prototype === null;
}

export function ownDataProperty(input: Record<string, unknown>, key: string): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(input, key);
  return descriptor !== undefined && 'value' in descriptor ? descriptor.value : undefined;
}

export function textProperty(input: Record<string, unknown>, key: string): string | undefined {
  const value = ownDataProperty(input, key);
  return typeof value === 'string' ? value : undefined;
}

export function requiredNonEmptyTextProperty(input: Record<string, unknown>, key: string): string | undefined {
  return nonEmptyTextValue(ownDataProperty(input, key));
}

export function nonEmptyTextValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

export function numberProperty(input: Record<string, unknown>, key: string): number | undefined {
  const value = ownDataProperty(input, key);
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

export function booleanProperty(input: Record<string, unknown>, key: string): boolean | undefined {
  const value = ownDataProperty(input, key);
  return typeof value === 'boolean' ? value : undefined;
}

export function textArrayProperty(input: Record<string, unknown>, key: string): readonly string[] | undefined {
  const value = ownDataProperty(input, key);
  const values = dataArrayValues(value);
  return values?.every((item) => typeof item === 'string') === true
    ? values
    : undefined;
}

export function dataArrayValues(input: unknown): readonly unknown[] | undefined {
  if (!Array.isArray(input)) {
    return undefined;
  }

  const values: unknown[] = [];
  for (let index = 0; index < input.length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(input, s(index));
    if (descriptor === undefined || !('value' in descriptor)) {
      return undefined;
    }
    values.push(descriptor.value);
  }
  return values;
}
