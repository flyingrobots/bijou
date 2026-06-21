import type { BlockRenderInput } from './block-metadata.js';

import type { BindingFact, DeepReadonly } from './binding.js';

import { deepFreeze, freezeInertData } from './schema-inert-data.js';

import { EMPTY_BINDING_FACTS, SCHEMA_BOUND_BLOCK_BRAND } from './schema-block.part01.js';

import type { BlockSchemaDescription, BlockSchemaResult, SchemaBlockBindResult, SchemaBoundBlockDefinition } from './schema-block.part01.js';

import { parseBlockSchema } from './schema-block.part02.js';

import { freezeSchemaIssues, normalizeBindOutput } from './schema-block.part04.js';

import { freezeFacts, freezeStringList } from './schema-block.part05.js';

import { isObjectLike } from './schema-block.part06.js';
export function bindSchemaBlockInput<
  Data = unknown,
  Config = unknown,
  Output = unknown,
>(
  block: SchemaBoundBlockDefinition<Data, Config, Output>,
  input: unknown,
): SchemaBlockBindResult<Config> {
  if (!hasOwnBrand(block, SCHEMA_BOUND_BLOCK_BRAND)) {
    throw new Error('schema block bind: block must be created by defineSchemaBlock()');
  }

  const parsed = parseBlockSchema(block.schema, input);
  if (!parsed.ok) {
    return Object.freeze({
      ok: false,
      issues: parsed.issues,
      facts: EMPTY_BINDING_FACTS,
    });
  }

  const output = normalizeBindOutput<Config>(block.bind(parsed.data));
  return Object.freeze({
    ok: true,
    input: output.input,
    facts: output.facts,
  });
}
export interface RequiredTextOptions {
  readonly scope: string;
  readonly field: string;
  readonly value: unknown;
}
export interface TextFieldOptions {
  readonly scope: string;
  readonly field: string;
}
export interface NormalizedBindOutput<Config> {
  readonly input: DeepReadonly<BlockRenderInput<Config>>;
  readonly facts: readonly BindingFact[];
}
export function brand<Brand extends symbol, Value extends object>(
  value: Value,
  brandSymbol: Brand,
): asserts value is Value & Readonly<Record<Brand, true>> {
  Object.defineProperty(value, brandSymbol, { value: true });
}
export function hasOwnBrand(value: unknown, brandSymbol: symbol): boolean {
  return (
    value !== null
    && typeof value === 'object'
    && Object.prototype.hasOwnProperty.call(value, brandSymbol)
    && Reflect.get(value, brandSymbol) === true
  );
}
export function normalizeSchemaResult<Data>(result: BlockSchemaResult<Data>): BlockSchemaResult<Data> {
  if (!isObjectLike(result)) {
    throw new Error('block schema result: result must be an object');
  }

  switch (result.ok) {
    case true: {
      if (!Object.prototype.hasOwnProperty.call(result, 'data')) {
        throw new Error('block schema result: data is required for ok result');
      }
      const data: DeepReadonly<Data> = freezeInertData(result.data, 'data');
      return Object.freeze({
        ok: true,
        data,
      });
    }
    case false:
      return Object.freeze({
        ok: false,
        issues: freezeSchemaIssues(result.issues),
      });
    default:
      throw new Error('block schema result: ok must be true or false');
  }
}
export function normalizeSchemaDescription(
  description: BlockSchemaDescription,
): BlockSchemaDescription {
  if (!isObjectLike(description)) {
    throw new Error('block schema description: description must be an object');
  }

  return deepFreeze({
    requiredFields: freezeStringList(description.requiredFields, 'requiredFields'),
    optionalFields: freezeStringList(description.optionalFields, 'optionalFields'),
    redactedFields: freezeStringList(description.redactedFields, 'redactedFields'),
    facts: freezeFacts(description.facts, 'block schema description'),
  });
}
