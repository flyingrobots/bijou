import {
  collectActiveBindings,
  isBindingLifecycleOwner,
  isCommandIntent,
  isViewDataContract,
  type ActiveBindingCollection,
  type ActiveBindingProviderAssignment,
  type BindingLifecycleOwner,
  type CommandIntent,
  type DeepReadonly,
  type ViewDataContract,
} from '@flyingrobots/bijou';
import {
  appendRuntimeCommands,
  type RuntimeCommandBuffer,
} from './runtime-engine.js';
import type {
  RuntimeStackLayer,
  RuntimeViewStack,
} from './runtime-engine.js';

const RUNTIME_VIEW_BINDING_SOURCE_BRAND: unique symbol = Symbol('RuntimeViewBindingSource');
const RUNTIME_COMMAND_INTENT_EMISSION_BRAND: unique symbol = Symbol('RuntimeCommandIntentEmission');
const RUNTIME_COMMAND_INTENT_ROUTE_BRAND: unique symbol = Symbol('RuntimeCommandIntentRoute');

export interface RuntimeViewBindingSourceInput {
  readonly owner: BindingLifecycleOwner;
  readonly contract: ViewDataContract;
  readonly providerIds?: readonly ActiveBindingProviderAssignment[];
}

export interface RuntimeViewBindingSource {
  readonly [RUNTIME_VIEW_BINDING_SOURCE_BRAND]: true;
  readonly owner: BindingLifecycleOwner;
  readonly contract: ViewDataContract;
  readonly providerIds?: readonly ActiveBindingProviderAssignment[];
}

export interface RuntimeBindingLayerModel {
  readonly bindingSources?: readonly RuntimeViewBindingSource[];
}

export interface RuntimeCommandIntentEmissionOptions {
  readonly owner?: BindingLifecycleOwner;
}

export interface RuntimeCommandIntentEmission<Payload = undefined> {
  readonly [RUNTIME_COMMAND_INTENT_EMISSION_BRAND]: true;
  readonly intent: CommandIntent<Payload>;
  readonly payload: DeepReadonly<Payload>;
  readonly owner?: BindingLifecycleOwner;
}

export interface RuntimeCommandIntentRouteInput<Payload, Command> {
  readonly intent: CommandIntent<Payload>;
  readonly toCommand: (emission: RuntimeCommandIntentEmission<Payload>) => Command;
}

export interface RuntimeCommandIntentRoute<Payload = unknown, Command = unknown> {
  readonly [RUNTIME_COMMAND_INTENT_ROUTE_BRAND]: true;
  readonly intent: CommandIntent<Payload>;
  readonly toCommand: (emission: RuntimeCommandIntentEmission<Payload>) => Command;
}

export interface DispatchRuntimeCommandIntentInput<Payload, Command> {
  readonly emission: RuntimeCommandIntentEmission<Payload>;
  readonly routes: readonly RuntimeCommandIntentRoute<Payload, Command>[];
  readonly buffer: RuntimeCommandBuffer<Command>;
}

export interface DispatchRuntimeCommandIntentResult<Command> {
  readonly command: Command;
  readonly buffer: RuntimeCommandBuffer<Command>;
}

export function runtimeViewBindingSource(
  input: RuntimeViewBindingSourceInput,
): RuntimeViewBindingSource {
  assertObjectRecord(input, 'runtime binding source');

  if (!isBindingLifecycleOwner(input.owner)) {
    throw new Error(
      'runtime binding source: owner was not created by defineBindingLifecycleOwner()',
    );
  }
  if (!isViewDataContract(input.contract)) {
    throw new Error(
      'runtime binding source: contract was not created by defineViewData()',
    );
  }

  const source = {
    owner: input.owner,
    contract: input.contract,
    providerIds: freezeProviderAssignments(input.providerIds),
  } as RuntimeViewBindingSource;

  Object.defineProperty(source, RUNTIME_VIEW_BINDING_SOURCE_BRAND, { value: true });
  return Object.freeze(source);
}

export function runtimeCommandIntentEmission(
  intent: CommandIntent,
): RuntimeCommandIntentEmission<undefined>;
export function runtimeCommandIntentEmission<Payload>(
  intent: CommandIntent<Payload>,
  payload: Payload,
  options?: RuntimeCommandIntentEmissionOptions,
): RuntimeCommandIntentEmission<Payload>;
export function runtimeCommandIntentEmission<Payload>(
  intent: CommandIntent<Payload>,
  payload?: Payload,
  options: RuntimeCommandIntentEmissionOptions = {},
): RuntimeCommandIntentEmission<Payload | undefined> {
  assertObjectRecord(options, 'runtime command intent emission', 'options');

  if (!isCommandIntent(intent)) {
    throw new Error('runtime command intent emission: intent was not created by commandIntent()');
  }
  if (options.owner !== undefined && !isBindingLifecycleOwner(options.owner)) {
    throw new Error(
      'runtime command intent emission: owner was not created by defineBindingLifecycleOwner()',
    );
  }

  const emission = {
    intent,
    payload: freezeRuntimePayload(payload),
    owner: options.owner,
  } as RuntimeCommandIntentEmission<Payload | undefined>;

  Object.defineProperty(emission, RUNTIME_COMMAND_INTENT_EMISSION_BRAND, { value: true });
  return Object.freeze(emission);
}

export function isRuntimeCommandIntentEmission(
  value: unknown,
): value is RuntimeCommandIntentEmission {
  return Boolean(
    value
      && typeof value === 'object'
      && Object.prototype.hasOwnProperty.call(value, RUNTIME_COMMAND_INTENT_EMISSION_BRAND)
      && (value as RuntimeCommandIntentEmissionBrandCarrier)[RUNTIME_COMMAND_INTENT_EMISSION_BRAND] === true,
  );
}

export function runtimeCommandIntentRoute<Payload, Command>(
  input: RuntimeCommandIntentRouteInput<Payload, Command>,
): RuntimeCommandIntentRoute<Payload, Command> {
  assertObjectRecord(input, 'runtime command intent route');

  if (!isCommandIntent(input.intent)) {
    throw new Error('runtime command intent route: intent was not created by commandIntent()');
  }
  if (typeof input.toCommand !== 'function') {
    throw new Error('runtime command intent route: toCommand must be a function');
  }

  const route = {
    intent: input.intent,
    toCommand: input.toCommand,
  } as RuntimeCommandIntentRoute<Payload, Command>;

  Object.defineProperty(route, RUNTIME_COMMAND_INTENT_ROUTE_BRAND, { value: true });
  return Object.freeze(route);
}

export function isRuntimeCommandIntentRoute(value: unknown): value is RuntimeCommandIntentRoute {
  return Boolean(
    value
      && typeof value === 'object'
      && Object.prototype.hasOwnProperty.call(value, RUNTIME_COMMAND_INTENT_ROUTE_BRAND)
      && (value as RuntimeCommandIntentRouteBrandCarrier)[RUNTIME_COMMAND_INTENT_ROUTE_BRAND] === true,
  );
}

export function dispatchRuntimeCommandIntent<Payload, Command>(
  input: DispatchRuntimeCommandIntentInput<Payload, Command>,
): DispatchRuntimeCommandIntentResult<Command> {
  assertObjectRecord(input, 'runtime command intent dispatch');

  if (!isRuntimeCommandIntentEmission(input.emission)) {
    throw new Error(
      'runtime command intent dispatch: emission was not created by runtimeCommandIntentEmission()',
    );
  }
  if (!Array.isArray(input.routes)) {
    throw new Error('runtime command intent dispatch: routes must be an array');
  }
  if (!isRuntimeCommandBuffer(input.buffer)) {
    throw new Error('runtime command intent dispatch: buffer must be a RuntimeCommandBuffer');
  }

  const route = input.routes.find((candidate, index) => {
    if (!isRuntimeCommandIntentRoute(candidate)) {
      throw new Error(
        `runtime command intent dispatch: route at index ${index} was not created by runtimeCommandIntentRoute()`,
      );
    }

    return candidate.intent.id === input.emission.intent.id;
  });
  if (route === undefined) {
    throw new Error(
      `runtime command intent dispatch: no route for intent ${input.emission.intent.id}`,
    );
  }

  const command = route.toCommand(input.emission);
  return Object.freeze({
    command,
    buffer: appendRuntimeCommands(input.buffer, [command]),
  });
}

export function isRuntimeViewBindingSource(
  value: unknown,
): value is RuntimeViewBindingSource {
  return Boolean(
    value
      && typeof value === 'object'
      && Object.prototype.hasOwnProperty.call(value, RUNTIME_VIEW_BINDING_SOURCE_BRAND)
      && (value as RuntimeViewBindingSourceBrandCarrier)[RUNTIME_VIEW_BINDING_SOURCE_BRAND] === true,
  );
}

export function runtimeActiveBindingLayers<Model extends RuntimeBindingLayerModel>(
  stack: RuntimeViewStack<Model>,
): readonly RuntimeStackLayer<Model>[] {
  if (!isRuntimeViewStack(stack)) {
    throw new Error('runtime binding collection: stack must be a RuntimeViewStack');
  }

  const activeLayers: RuntimeStackLayer<Model>[] = [];
  for (let index = stack.layers.length - 1; index >= 0; index -= 1) {
    const layer = stack.layers[index];
    if (layer === undefined) {
      continue;
    }

    activeLayers.unshift(layer);
    if (layer.blocksBelow) {
      break;
    }
  }

  return Object.freeze(activeLayers);
}

export function collectRuntimeViewBindings<Model extends RuntimeBindingLayerModel>(
  stack: RuntimeViewStack<Model>,
): ActiveBindingCollection {
  const contracts = runtimeActiveBindingLayers(stack).flatMap((layer) => {
    const bindingSources = layer.model?.bindingSources ?? [];
    if (!Array.isArray(bindingSources)) {
      throw new Error(
        `runtime binding collection: bindingSources for layer ${layer.id} must be an array`,
      );
    }

    return bindingSources.map((source, index) => {
      if (!isRuntimeViewBindingSource(source)) {
        throw new Error(
          `runtime binding collection: source at layer ${layer.id} index ${index} `
          + 'was not created by runtimeViewBindingSource()',
        );
      }

      return {
        owner: source.owner,
        contract: source.contract,
        providerIds: source.providerIds,
      };
    });
  });

  return collectActiveBindings({ contracts });
}

interface RuntimeViewBindingSourceBrandCarrier {
  readonly [RUNTIME_VIEW_BINDING_SOURCE_BRAND]?: true;
}

interface RuntimeCommandIntentEmissionBrandCarrier {
  readonly [RUNTIME_COMMAND_INTENT_EMISSION_BRAND]?: true;
}

interface RuntimeCommandIntentRouteBrandCarrier {
  readonly [RUNTIME_COMMAND_INTENT_ROUTE_BRAND]?: true;
}

function isRuntimeViewStack(value: unknown): value is RuntimeViewStack {
  return Boolean(
    value
      && typeof value === 'object'
      && Array.isArray((value as RuntimeViewStack).layers),
  );
}

function isRuntimeCommandBuffer(value: unknown): value is RuntimeCommandBuffer {
  return Boolean(
    value
      && typeof value === 'object'
      && Array.isArray((value as RuntimeCommandBuffer).items),
  );
}

function freezeProviderAssignments(
  assignments: readonly ActiveBindingProviderAssignment[] | undefined,
): readonly ActiveBindingProviderAssignment[] | undefined {
  if (assignments === undefined) {
    return undefined;
  }
  if (!Array.isArray(assignments)) {
    throw new Error('runtime binding source: providerIds must be an array');
  }

  const seenRequirementIds = new Set<string>();
  return Object.freeze(assignments.map((assignment, index) => {
    assertObjectRecord(
      assignment,
      'runtime binding source',
      `provider assignment ${index}`,
    );
    const requirementId = normalizeRequiredText({
      scope: 'runtime binding source',
      field: `provider assignment ${index} requirementId`,
      value: assignment['requirementId'],
    });
    if (seenRequirementIds.has(requirementId)) {
      throw new Error(
        `runtime binding source: duplicate provider assignment ${requirementId}`,
      );
    }

    seenRequirementIds.add(requirementId);
    return Object.freeze({
      requirementId,
      providerId: normalizeRequiredText({
        scope: 'runtime binding source',
        field: `provider assignment ${index} providerId`,
        value: assignment['providerId'],
      }),
    });
  }));
}

function freezeRuntimePayload<Payload>(
  payload: Payload | undefined,
): DeepReadonly<Payload | undefined> {
  if (payload === undefined) {
    return undefined as DeepReadonly<Payload | undefined>;
  }

  return deepFreeze(cloneRuntimePayload(payload, 'payload'));
}

function cloneRuntimePayload<Payload>(
  value: Payload,
  path: string,
  seen: WeakSet<object> = new WeakSet<object>(),
): Payload {
  if (
    value === null
    || typeof value === 'string'
    || typeof value === 'number'
    || typeof value === 'boolean'
  ) {
    return value;
  }

  if (typeof value === 'bigint' || typeof value === 'symbol' || typeof value === 'function') {
    throw new Error(`runtime command intent payload: unsupported ${typeof value} at ${path}`);
  }
  if (value === undefined) {
    throw new Error(`runtime command intent payload: unsupported undefined at ${path}`);
  }
  if (typeof value !== 'object') {
    throw new Error(`runtime command intent payload: unsupported ${typeof value} at ${path}`);
  }

  const objectValue = value as object;
  if (seen.has(objectValue)) {
    throw new Error(`runtime command intent payload: circular reference at ${path}`);
  }
  seen.add(objectValue);

  try {
    if (Array.isArray(value)) {
      return value.map((item, index) => cloneRuntimePayload(
        item,
        `${path}[${index}]`,
        seen,
      )) as Payload;
    }
    if (!isPlainObject(value)) {
      throw new Error(
        `runtime command intent payload: unsupported ${objectKind(value)} at ${path}`,
      );
    }

    const clone = Object.create(Object.getPrototypeOf(value)) as Record<string, unknown>;
    const descriptors = Object.getOwnPropertyDescriptors(value);
    for (const key of Reflect.ownKeys(descriptors)) {
      if (typeof key === 'symbol') {
        throw new Error(`runtime command intent payload: unsupported symbol property at ${path}`);
      }

      const descriptor = descriptors[key];
      const propertyPath = `${path}.${key}`;
      if (descriptor === undefined) {
        continue;
      }
      if (!descriptor.enumerable) {
        throw new Error(
          `runtime command intent payload: unsupported non-enumerable property at ${propertyPath}`,
        );
      }
      if ('get' in descriptor || 'set' in descriptor) {
        throw new Error(
          `runtime command intent payload: unsupported accessor at ${propertyPath}`,
        );
      }

      clone[key] = cloneRuntimePayload(descriptor.value, propertyPath, seen);
    }

    return clone as Payload;
  } finally {
    seen.delete(objectValue);
  }
}

function deepFreeze<Payload>(
  value: Payload,
  seen: WeakSet<object> = new WeakSet<object>(),
): DeepReadonly<Payload> {
  if (value === null || typeof value !== 'object') {
    return value as DeepReadonly<Payload>;
  }

  const objectValue = value as object;
  if (seen.has(objectValue)) {
    return value as DeepReadonly<Payload>;
  }

  seen.add(objectValue);
  for (const key of Reflect.ownKeys(objectValue)) {
    const descriptor = Object.getOwnPropertyDescriptor(objectValue, key);
    if (descriptor !== undefined && 'value' in descriptor) {
      deepFreeze(descriptor.value, seen);
    }
  }

  return Object.freeze(value) as DeepReadonly<Payload>;
}

function assertObjectRecord(
  value: unknown,
  scope: string,
  label = 'input',
): asserts value {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${scope}: ${label} must be an object`);
  }
}

function normalizeRequiredText(options: {
  readonly scope: string;
  readonly field: string;
  readonly value: unknown;
}): string {
  if (typeof options.value !== 'string') {
    throw new Error(`${options.scope}: ${options.field} must be a string`);
  }

  const normalized = options.value.trim();
  if (normalized === '') {
    throw new Error(`${options.scope}: ${options.field} is required`);
  }

  return normalized;
}

function isPlainObject(value: object): boolean {
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function objectKind(value: object): string {
  return Object.prototype.toString.call(value).slice(8, -1);
}
