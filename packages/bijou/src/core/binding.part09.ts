import { BINDING_SNAPSHOT_BRAND, COMMAND_INTENT_BRAND, DATA_PROVIDER_BRAND, PROVIDER_RESOLUTION_BRAND, PROVIDER_SCOPE_BRAND, PROVIDER_SCOPE_ENTRY_BRAND } from './binding.part01.js';

import type { BindingIssue, BindingIssueSeverity, BindingStatus, DataProvider, ProviderResolution, ProviderScopeEntry } from './binding.part01.js';

import { BINDING_ISSUE_SEVERITY_VALUES, BINDING_STATUS_VALUES, EMPTY_BINDING_ISSUES } from './binding.part02.js';

import type { BindingSnapshot, CommandIntent } from './binding.part02.js';

import type { ProviderScope } from './binding.part04.js';

import { deepFreeze } from './binding.part11.js';
export function isBindingSnapshot(value: unknown): value is BindingSnapshot {
  return hasBrand(value, BINDING_SNAPSHOT_BRAND);
}
export function isDataProvider(value: unknown): value is DataProvider {
  return hasBrand(value, DATA_PROVIDER_BRAND);
}
export function isProviderScope(value: unknown): value is ProviderScope {
  return hasBrand(value, PROVIDER_SCOPE_BRAND);
}
export function isCommandIntent(value: unknown): value is CommandIntent {
  return hasBrand(value, COMMAND_INTENT_BRAND);
}
export function isProviderResolution(value: unknown): value is ProviderResolution {
  return hasBrand(value, PROVIDER_RESOLUTION_BRAND);
}
export function isProviderScopeEntry(value: unknown): value is ProviderScopeEntry {
  return hasBrand(value, PROVIDER_SCOPE_ENTRY_BRAND);
}
export function brand<Brand extends symbol, Value extends object>(
  value: Value,
  brandSymbol: Brand,
): asserts value is Value & Readonly<Record<Brand, true>> {
  Object.defineProperty(value, brandSymbol, { value: true });
}
export function hasBrand(value: unknown, brand: symbol): boolean {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  return brand in value && Reflect.get(value, brand) === true;
}
export interface RequiredTextOptions {
  readonly scope: string;
  readonly field: string;
  readonly value: string;
}
export function normalizeRequiredText(options: RequiredTextOptions): string {
  const normalized = options.value.trim();
  if (normalized === '') {
    throw new Error(`${options.scope}: ${options.field} is required`);
  }

  return normalized;
}
export function optionalTrimmedText(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const normalized = value.trim();
  return normalized === '' ? undefined : normalized;
}
export function isBindingStatus(value: string): value is BindingStatus {
  return BINDING_STATUS_VALUES.has(value);
}
export function isBindingIssueSeverity(value: string): value is BindingIssueSeverity {
  return BINDING_ISSUE_SEVERITY_VALUES.has(value);
}
export function freezeIssues(issues: readonly BindingIssue[] | undefined): readonly BindingIssue[] {
  if (issues === undefined || issues.length === 0) {
    return EMPTY_BINDING_ISSUES;
  }

  return deepFreeze(issues.map((issue, index) => normalizeIssue(issue, index)));
}
export function normalizeIssue(issue: BindingIssue, index: number): BindingIssue {
  if (!isBindingIssueSeverity(issue.severity)) {
    throw new Error(`binding issue: unsupported severity ${String(issue.severity)} at index ${String(index)}`);
  }

  return {
    severity: issue.severity,
    code: normalizeRequiredText({
      scope: 'binding issue',
      field: `issues[${String(index)}].code`,
      value: issue.code,
    }),
    message: normalizeRequiredText({
      scope: 'binding issue',
      field: `issues[${String(index)}].message`,
      value: issue.message,
    }),
    path: optionalTrimmedText(issue.path),
  };
}
