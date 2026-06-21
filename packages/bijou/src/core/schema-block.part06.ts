import type { BindingFact, BindingIssueSeverity } from './binding.js';

import { BINDING_ISSUE_SEVERITY_VALUES } from './schema-block.part01.js';

import type { TextFieldOptions } from './schema-block.part03.js';
export function optionalTrimmedText(
  value: unknown,
  options: TextFieldOptions,
): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw new Error(`${options.scope}: ${options.field} must be a string`);
  }

  const normalized = value.trim();
  return normalized === '' ? undefined : normalized;
}
export function isObjectLike(value: unknown): value is object {
  return value !== null && typeof value === 'object';
}
export function assertObjectRecord(
  value: unknown,
  scope: string,
  label = 'input',
): asserts value is Record<string, unknown> {
  if (!isObjectLike(value) || Array.isArray(value)) {
    throw new Error(`${scope}: ${label} must be an object`);
  }
}
export interface AllowedKeyOptions {
  readonly scope: string;
  readonly label: string;
}
export function assertOnlyKeys(
  value: object,
  allowedKeys: readonly string[],
  options: AllowedKeyOptions,
): void {
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== 'string' || !allowedKeys.includes(key)) {
      throw new Error(`${options.scope}: unsupported ${options.label} key ${keyText(key)}`);
    }
  }
}
export function keyText(key: string | symbol): string {
  return typeof key === 'string' ? key : key.toString();
}
export function isPlainObject(value: object): boolean {
  const prototype = Reflect.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
export function isBindingIssueSeverity(value: unknown): value is BindingIssueSeverity {
  return typeof value === 'string' && BINDING_ISSUE_SEVERITY_VALUES.has(value);
}
export function isBindingFactArray(
  value: readonly BindingFact[] | undefined,
): value is readonly BindingFact[] {
  return Array.isArray(value);
}
export function unknownText(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value === 'object') return Object.prototype.toString.call(value);
  if (typeof value === 'function') return 'function';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'symbol') return value.description ?? 'symbol';
  return 'undefined';
}
