import type { BlockDefinition, BlockRenderInput } from './block-metadata.js';

import type { BindingFact, BindingIssueSeverity, DeepReadonly } from './binding.js';
export const BLOCK_SCHEMA_ADAPTER_BRAND: unique symbol = Symbol('BlockSchemaAdapter');
export const SCHEMA_BOUND_BLOCK_BRAND: unique symbol = Symbol('SchemaBoundBlockDefinition');
export const BINDING_ISSUE_SEVERITIES: readonly BindingIssueSeverity[] = [
  'info',
  'warning',
  'error',
];
export const BINDING_ISSUE_SEVERITY_VALUES: ReadonlySet<string> = new Set(BINDING_ISSUE_SEVERITIES);
export const EMPTY_BINDING_FACTS = Object.freeze([]) as readonly BindingFact[];
export interface BlockSchemaIssue {
  readonly severity: BindingIssueSeverity;
  readonly code: string;
  readonly message: string;
  readonly path?: string;
}
export type BlockSchemaResult<Data> =
  | {
    readonly ok: true;
    readonly data: DeepReadonly<Data>;
  }
  | {
    readonly ok: false;
    readonly issues: readonly BlockSchemaIssue[];
  };
export interface BlockSchemaDescription {
  readonly requiredFields?: readonly string[];
  readonly optionalFields?: readonly string[];
  readonly redactedFields?: readonly string[];
  readonly facts?: readonly BindingFact[];
}
export interface BlockSchemaAdapterInput<Data> {
  readonly id: string;
  readonly parse: (input: unknown) => BlockSchemaResult<Data>;
  readonly describe?: () => BlockSchemaDescription;
}
export interface BlockSchemaAdapter<Data = unknown> {
  readonly [BLOCK_SCHEMA_ADAPTER_BRAND]: true;
  readonly id: string;
  readonly parse: (input: unknown) => BlockSchemaResult<Data>;
  readonly describe?: () => BlockSchemaDescription;
}
export type SchemaBlockBindOutput<Config = unknown> =
  | BlockRenderInput<Config>
  | {
    readonly input: BlockRenderInput<Config>;
    readonly facts?: readonly BindingFact[];
  };
export interface SchemaBoundBlockDefinitionInput<
  Data = unknown,
  Config = unknown,
  Output = unknown,
> {
  readonly block: BlockDefinition<Config, Output>;
  readonly schema: BlockSchemaAdapter<Data>;
  readonly bind: (data: DeepReadonly<Data>) => SchemaBlockBindOutput<Config>;
}
export interface SchemaBoundBlockDefinition<
  Data = unknown,
  Config = unknown,
  Output = unknown,
> extends SchemaBoundBlockDefinitionInput<Data, Config, Output> {
  readonly [SCHEMA_BOUND_BLOCK_BRAND]: true;
}
export type SchemaBlockBindResult<Config = unknown> =
  | {
    readonly ok: true;
    readonly input: DeepReadonly<BlockRenderInput<Config>>;
    readonly facts: readonly BindingFact[];
  }
  | {
    readonly ok: false;
    readonly issues: readonly BlockSchemaIssue[];
    readonly facts: readonly BindingFact[];
  };
