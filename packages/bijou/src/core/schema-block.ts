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

const BLOCK_SCHEMA_ADAPTER_BRAND: unique symbol = Symbol('BlockSchemaAdapter');
const SCHEMA_BOUND_BLOCK_BRAND: unique symbol = Symbol('SchemaBoundBlockDefinition');

const BINDING_ISSUE_SEVERITIES: readonly BindingIssueSeverity[] = [
  'info',
  'warning',
  'error',
];
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
      : { describe: () => normalizeSchemaDescription(describe() ?? {}) }),
  } as BlockSchemaAdapter<Data>;

  Object.defineProperty(adapter, BLOCK_SCHEMA_ADAPTER_BRAND, { value: true });
  return Object.freeze(adapter);
}

export function isBlockSchemaAdapter(value: unknown): value is BlockSchemaAdapter {
  return Boolean(
    value
      && typeof value === 'object'
      && Object.prototype.hasOwnProperty.call(value, BLOCK_SCHEMA_ADAPTER_BRAND)
      && (value as BlockSchemaAdapterBrandCarrier)[BLOCK_SCHEMA_ADAPTER_BRAND] === true,
  );
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
  } as SchemaBoundBlockDefinition<Data, Config, Output>;

  Object.defineProperty(block, SCHEMA_BOUND_BLOCK_BRAND, { value: true });
  return Object.freeze(block);
}

export function isSchemaBoundBlockDefinition(
  value: unknown,
): value is SchemaBoundBlockDefinition {
  return Boolean(
    value
      && typeof value === 'object'
      && Object.prototype.hasOwnProperty.call(value, SCHEMA_BOUND_BLOCK_BRAND)
      && (value as SchemaBoundBlockBrandCarrier)[SCHEMA_BOUND_BLOCK_BRAND] === true,
  );
}

export function bindSchemaBlockInput<
  Data = unknown,
  Config = unknown,
  Output = unknown,
>(
  block: SchemaBoundBlockDefinition<Data, Config, Output>,
  input: unknown,
): SchemaBlockBindResult<Config> {
  if (!isSchemaBoundBlockDefinition(block)) {
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

  const output = normalizeBindOutput(block.bind(parsed.data));
  return Object.freeze({
    ok: true,
    input: output.input,
    facts: output.facts,
  }) as SchemaBlockBindResult<Config>;
}

interface BlockSchemaAdapterBrandCarrier {
  readonly [BLOCK_SCHEMA_ADAPTER_BRAND]?: true;
}

interface SchemaBoundBlockBrandCarrier {
  readonly [SCHEMA_BOUND_BLOCK_BRAND]?: true;
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

function normalizeSchemaResult<Data>(result: BlockSchemaResult<Data>): BlockSchemaResult<Data> {
  if (!isObjectLike(result)) {
    throw new Error('block schema result: result must be an object');
  }

  if (result.ok) {
    if (!Object.prototype.hasOwnProperty.call(result, 'data')) {
      throw new Error('block schema result: data is required for ok result');
    }

    return Object.freeze({
      ok: true,
      data: freezeInertData(result.data, 'data') as DeepReadonly<Data>,
    });
  }

  if (!result.ok) {
    return Object.freeze({
      ok: false,
      issues: freezeSchemaIssues(result.issues),
    });
  }

  throw new Error('block schema result: ok must be true or false');
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

  if (Object.prototype.hasOwnProperty.call(output, 'input')) {
    assertOnlyKeys(output, ['input', 'facts'], {
      scope: 'schema block bind',
      label: 'bind output',
    });
    const wrappedOutput = output as {
      readonly input?: BlockRenderInput<Config>;
      readonly facts?: readonly BindingFact[];
    };
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
    input: freezeRenderInput(output as BlockRenderInput<Config>),
    facts: EMPTY_BINDING_FACTS,
  };
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

function freezeSchemaIssues(
  issues: readonly BlockSchemaIssue[] | undefined,
): readonly BlockSchemaIssue[] {
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

function normalizeIssue(issue: BlockSchemaIssue, index: number): BlockSchemaIssue {
  if (!isObjectLike(issue)) {
    throw new Error(`block schema issue: issue at index ${index} must be an object`);
  }
  if (!BINDING_ISSUE_SEVERITIES.includes(issue.severity)) {
    throw new Error(`block schema issue: unsupported severity ${String(issue.severity)} at index ${index}`);
  }

  return {
    severity: issue.severity,
    code: normalizeRequiredText({
      scope: 'block schema issue',
      field: `issues[${index}].code`,
      value: issue.code,
    }),
    message: normalizeRequiredText({
      scope: 'block schema issue',
      field: `issues[${index}].message`,
      value: issue.message,
    }),
    path: optionalTrimmedText(issue.path, {
      scope: 'block schema issue',
      field: `issues[${index}].path`,
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
  if (!Array.isArray(facts)) {
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
    field: `${field}[${index}]`,
    value,
  })));
}

function normalizeOutputMode(value: OutputMode | undefined): OutputMode | undefined {
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

  throw new Error(`schema block bind: unsupported mode ${String(value)}`);
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

function freezeInertData<T>(
  value: T,
  path: string,
): DeepReadonly<T> {
  return deepFreeze(cloneInertData(value, path));
}

function cloneInertData<T>(
  value: T,
  path: string,
  seen = new WeakSet(),
): T {
  if (
    value === null
    || typeof value === 'string'
    || typeof value === 'number'
    || typeof value === 'boolean'
  ) {
    return value;
  }

  if (typeof value === 'bigint' || typeof value === 'symbol' || typeof value === 'function') {
    throw new Error(`block schema data: unsupported ${typeof value} at ${path}`);
  }

  if (value === undefined) {
    throw new Error(`block schema data: unsupported undefined at ${path}`);
  }

  if (typeof value !== 'object') {
    throw new Error(`block schema data: unsupported ${typeof value} at ${path}`);
  }

  const objectValue = value as object;
  if (seen.has(objectValue)) {
    throw new Error(`block schema data: circular reference at ${path}`);
  }
  seen.add(objectValue);

  try {
    if (Array.isArray(value)) {
      return value.map((item, index) => cloneInertData(item, `${path}[${index}]`, seen)) as T;
    }

    if (!isPlainObject(value)) {
      throw new Error(`block schema data: unsupported ${objectKind(value)} at ${path}`);
    }

    const clone = Object.create(Object.getPrototypeOf(value)) as InertDataObject;
    const descriptors = Object.getOwnPropertyDescriptors(value);
    for (const key of Reflect.ownKeys(descriptors)) {
      if (typeof key === 'symbol') {
        throw new Error(`block schema data: unsupported symbol property at ${path}`);
      }

      const propertyPath = `${path}.${key}`;
      const descriptor = descriptors[key];
      if (descriptor === undefined) {
        continue;
      }
      if (!descriptor.enumerable) {
        throw new Error(`block schema data: unsupported non-enumerable property at ${propertyPath}`);
      }
      if ('get' in descriptor || 'set' in descriptor) {
        throw new Error(`block schema data: unsupported accessor at ${propertyPath}`);
      }

      clone[key] = cloneInertData(descriptor.value, propertyPath, seen);
    }

    return clone as T;
  } finally {
    seen.delete(objectValue);
  }
}

type InertDataObject = Record<string, unknown>;

function isPlainObject(value: object): boolean {
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function objectKind(value: object): string {
  return Object.prototype.toString.call(value).slice(8, -1);
}

function deepFreeze<T>(
  value: T,
  seen = new WeakSet(),
): DeepReadonly<T> {
  if (value === null || typeof value !== 'object') {
    return value as DeepReadonly<T>;
  }

  const objectValue = value as object;
  if (seen.has(objectValue)) {
    return value as DeepReadonly<T>;
  }

  seen.add(objectValue);

  for (const key of Reflect.ownKeys(objectValue)) {
    const descriptor = Object.getOwnPropertyDescriptor(objectValue, key);
    if (descriptor !== undefined && 'value' in descriptor) {
      deepFreeze(descriptor.value, seen);
    }
  }

  return Object.freeze(value) as DeepReadonly<T>;
}
