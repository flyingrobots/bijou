import type { OutputMode } from './detect/tty.js';
import {
  isBlockDefinition,
  type BlockDefinition,
  type BlockRenderInput,
} from './block-metadata.js';
import type {
  BindingFact,
  BindingIssueSeverity,
  DeepReadonly,
} from './binding.js';
import { deepFreeze, freezeInertData } from './schema-inert-data.js';

const BLOCK_SCHEMA_ADAPTER_BRAND: unique symbol = Symbol('BlockSchemaAdapter');
const SCHEMA_BOUND_BLOCK_BRAND: unique symbol = Symbol('SchemaBoundBlockDefinition');

const BINDING_ISSUE_SEVERITIES: readonly BindingIssueSeverity[] = [
  'info',
  'warning',
  'error',
];
const BINDING_ISSUE_SEVERITY_VALUES: ReadonlySet<string> = new Set(BINDING_ISSUE_SEVERITIES);
const EMPTY_BINDING_FACTS = Object.freeze([]) as readonly BindingFact[];

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

interface RequiredTextOptions {
  readonly scope: string;
  readonly field: string;
  readonly value: unknown;
}

interface TextFieldOptions {
  readonly scope: string;
  readonly field: string;
}

interface NormalizedBindOutput<Config> {
  readonly input: DeepReadonly<BlockRenderInput<Config>>;
  readonly facts: readonly BindingFact[];
}

function brand<Brand extends symbol, Value extends object>(
  value: Value,
  brandSymbol: Brand,
): asserts value is Value & Readonly<Record<Brand, true>> {
  Object.defineProperty(value, brandSymbol, { value: true });
}

function hasOwnBrand(value: unknown, brandSymbol: symbol): boolean {
  return (
    value !== null
    && typeof value === 'object'
    && Object.prototype.hasOwnProperty.call(value, brandSymbol)
    && Reflect.get(value, brandSymbol) === true
  );
}

function normalizeSchemaResult<Data>(result: BlockSchemaResult<Data>): BlockSchemaResult<Data> {
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

function normalizeSchemaDescription(
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

function normalizeBindOutput<Config>(
  output: SchemaBlockBindOutput<Config>,
): NormalizedBindOutput<Config> {
  if (!isObjectLike(output)) {
    throw new Error('schema block bind: bind output must be an object');
  }
  if (!isPlainObject(output)) {
    throw new Error('schema block bind: bind output must be a plain object');
  }

  if (isWrappedBindOutput(output)) {
    const wrappedOutput = output;
    assertOnlyKeys(output, ['input', 'facts'], {
      scope: 'schema block bind',
      label: 'bind output',
    });
    if (!isObjectLike(wrappedOutput.input)) {
      throw new Error('schema block bind: input must be an object');
    }
    if (!isPlainObject(wrappedOutput.input)) {
      throw new Error('schema block bind: input must be a plain object');
    }
    assertOnlyKeys(wrappedOutput.input, ['config', 'slots', 'mode'], {
      scope: 'schema block bind',
      label: 'input',
    });

    return {
      input: freezeRenderInput(wrappedOutput.input),
      facts: freezeFacts(wrappedOutput.facts, 'schema block bind'),
    };
  }

  assertOnlyKeys(output, ['config', 'slots', 'mode'], {
    scope: 'schema block bind',
    label: 'bind output',
  });
  return {
    input: freezeRenderInput(output),
    facts: EMPTY_BINDING_FACTS,
  };
}

function isWrappedBindOutput<Config>(
  output: SchemaBlockBindOutput<Config>,
): output is {
  readonly input: BlockRenderInput<Config>;
  readonly facts?: readonly BindingFact[];
} {
  return Object.prototype.hasOwnProperty.call(output, 'input');
}

function freezeRenderInput<Config>(
  input: BlockRenderInput<Config>,
): DeepReadonly<BlockRenderInput<Config>> {
  const normalizedMode = normalizeOutputMode(input.mode);
  const normalizedInput = {
    ...(input.config === undefined
      ? {}
      : { config: freezeInertData(input.config, 'input.config') }),
    ...(input.slots === undefined
      ? {}
      : { slots: freezeInertData(input.slots, 'input.slots') }),
    ...(normalizedMode === undefined ? {} : { mode: normalizedMode }),
  };

  return Object.freeze(normalizedInput);
}

function freezeSchemaIssues(issues: unknown): readonly BlockSchemaIssue[] {
  if (issues === undefined) {
    throw new Error('block schema result: failed result requires at least one issue');
  }
  if (!Array.isArray(issues)) {
    throw new Error('block schema result: issues must be an array');
  }
  if (issues.length === 0) {
    throw new Error('block schema result: failed result requires at least one issue');
  }

  return deepFreeze(issues.map((issue, index) => normalizeIssue(issue, index)));
}

function normalizeIssue(issue: unknown, index: number): BlockSchemaIssue {
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

function freezeFacts(
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

function freezeStringList(
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

function normalizeOutputMode(value: unknown): OutputMode | undefined {
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

function normalizeRequiredText(options: RequiredTextOptions): string {
  if (typeof options.value !== 'string') {
    throw new Error(`${options.scope}: ${options.field} must be a string`);
  }

  const normalized = options.value.trim();
  if (normalized === '') {
    throw new Error(`${options.scope}: ${options.field} is required`);
  }

  return normalized;
}

function optionalTrimmedText(
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

function isObjectLike(value: unknown): value is object {
  return value !== null && typeof value === 'object';
}

function assertObjectRecord(
  value: unknown,
  scope: string,
  label = 'input',
): asserts value is Record<string, unknown> {
  if (!isObjectLike(value) || Array.isArray(value)) {
    throw new Error(`${scope}: ${label} must be an object`);
  }
}

interface AllowedKeyOptions {
  readonly scope: string;
  readonly label: string;
}

function assertOnlyKeys(
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

function keyText(key: string | symbol): string {
  return typeof key === 'string' ? key : key.toString();
}

function isPlainObject(value: object): boolean {
  const prototype = Reflect.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isBindingIssueSeverity(value: unknown): value is BindingIssueSeverity {
  return typeof value === 'string' && BINDING_ISSUE_SEVERITY_VALUES.has(value);
}

function isBindingFactArray(
  value: readonly BindingFact[] | undefined,
): value is readonly BindingFact[] {
  return Array.isArray(value);
}

function unknownText(value: unknown): string {
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
