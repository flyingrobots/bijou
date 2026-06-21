import type { OutputMode } from './detect/tty.js';

import type { BindingFact } from './binding.js';

import { deepFreeze } from './schema-inert-data.js';

import { EMPTY_BINDING_FACTS } from './schema-block.part01.js';

import type { BlockSchemaIssue } from './schema-block.part01.js';

import type { RequiredTextOptions } from './schema-block.part03.js';

import { assertObjectRecord, isBindingFactArray, isBindingIssueSeverity, optionalTrimmedText, unknownText } from './schema-block.part06.js';
export function normalizeIssue(issue: unknown, index: number): BlockSchemaIssue {
  assertObjectRecord(issue, 'block schema issue', `issue at index ${String(index)}`);
  if (!isBindingIssueSeverity(issue['severity'])) {
    throw new Error(`block schema issue: unsupported severity ${String(issue['severity'])} at index ${String(index)}`);
  }

  return {
    severity: issue['severity'],
    code: normalizeRequiredText({
      scope: 'block schema issue',
      field: `issues[${String(index)}].code`,
      value: issue['code'],
    }),
    message: normalizeRequiredText({
      scope: 'block schema issue',
      field: `issues[${String(index)}].message`,
      value: issue['message'],
    }),
    path: optionalTrimmedText(issue['path'], {
      scope: 'block schema issue',
      field: `issues[${String(index)}].path`,
    }),
  };
}
export function freezeFacts(
  facts: readonly BindingFact[] | undefined,
  scope = 'block schema facts',
): readonly BindingFact[] {
  if (facts === undefined) {
    return EMPTY_BINDING_FACTS;
  }
  if (!isBindingFactArray(facts)) {
    throw new Error(`${scope}: facts must be an array`);
  }
  if (facts.length === 0) {
    return EMPTY_BINDING_FACTS;
  }

  return deepFreeze([...facts]);
}
export function freezeStringList(
  values: readonly string[] | undefined,
  field: string,
): readonly string[] | undefined {
  if (values === undefined) {
    return undefined;
  }
  if (!Array.isArray(values)) {
    throw new Error(`block schema description: ${field} must be an array`);
  }

  return Object.freeze(values.map((value, index) => normalizeRequiredText({
    scope: 'block schema description',
    field: `${field}[${String(index)}]`,
    value,
  })));
}
export function normalizeOutputMode(value: unknown): OutputMode | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (
    value === 'interactive'
    || value === 'static'
    || value === 'pipe'
    || value === 'accessible'
  ) {
    return value;
  }

  throw new Error(`schema block bind: unsupported mode ${unknownText(value)}`);
}
export function normalizeRequiredText(options: RequiredTextOptions): string {
  if (typeof options.value !== 'string') {
    throw new Error(`${options.scope}: ${options.field} must be a string`);
  }

  const normalized = options.value.trim();
  if (normalized === '') {
    throw new Error(`${options.scope}: ${options.field} is required`);
  }

  return normalized;
}
