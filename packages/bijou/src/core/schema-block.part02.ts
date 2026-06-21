import { isBlockDefinition } from './block-metadata.js';

import { BLOCK_SCHEMA_ADAPTER_BRAND, SCHEMA_BOUND_BLOCK_BRAND } from './schema-block.part01.js';

import type { BlockSchemaAdapter, BlockSchemaAdapterInput, BlockSchemaResult, SchemaBoundBlockDefinition, SchemaBoundBlockDefinitionInput } from './schema-block.part01.js';

import { brand, hasOwnBrand, normalizeSchemaDescription, normalizeSchemaResult } from './schema-block.part03.js';

import { normalizeRequiredText } from './schema-block.part05.js';

import { isObjectLike } from './schema-block.part06.js';
export function defineBlockSchemaAdapter<Data>(
  input: BlockSchemaAdapterInput<Data>,
): BlockSchemaAdapter<Data> {
  if (!isObjectLike(input)) {
    throw new Error('block schema adapter: input must be an object');
  }

  const id = normalizeRequiredText({
    scope: 'block schema adapter',
    field: 'id',
    value: input.id,
  });
  if (typeof input.parse !== 'function') {
    throw new Error('block schema adapter: parse must be a function');
  }
  const parse = input.parse;
  const describe = input.describe;

  const adapter = {
    id,
    parse: (value: unknown) => normalizeSchemaResult(parse(value)),
    ...(describe === undefined
      ? {}
      : { describe: () => normalizeSchemaDescription(describe()) }),
  };

  brand(adapter, BLOCK_SCHEMA_ADAPTER_BRAND);
  return Object.freeze(adapter);
}
export function isBlockSchemaAdapter(value: unknown): value is BlockSchemaAdapter {
  return hasOwnBrand(value, BLOCK_SCHEMA_ADAPTER_BRAND);
}
export function parseBlockSchema<Data>(
  schema: BlockSchemaAdapter<Data>,
  input: unknown,
): BlockSchemaResult<Data> {
  if (!isBlockSchemaAdapter(schema)) {
    throw new Error('block schema parse: schema must be created by defineBlockSchemaAdapter()');
  }

  return schema.parse(input);
}
export function defineSchemaBlock<
  Data = unknown,
  Config = unknown,
  Output = unknown,
>(
  input: SchemaBoundBlockDefinitionInput<Data, Config, Output>,
): SchemaBoundBlockDefinition<Data, Config, Output> {
  if (!isObjectLike(input)) {
    throw new Error('schema block: input must be an object');
  }

  if (!isBlockDefinition(input.block)) {
    throw new Error('schema block: block must be created by defineBlock()');
  }
  if (!isBlockSchemaAdapter(input.schema)) {
    throw new Error('schema block: schema must be created by defineBlockSchemaAdapter()');
  }
  if (typeof input.bind !== 'function') {
    throw new Error('schema block: bind must be a function');
  }

  const block = {
    block: input.block,
    schema: input.schema,
    bind: input.bind,
  };

  brand(block, SCHEMA_BOUND_BLOCK_BRAND);
  return Object.freeze(block);
}
export function isSchemaBoundBlockDefinition(
  value: unknown,
): value is SchemaBoundBlockDefinition {
  return hasOwnBrand(value, SCHEMA_BOUND_BLOCK_BRAND);
}
