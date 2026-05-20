import {
  collectActiveBindings,
  isBindingLifecycleOwner,
  isCommandIntent,
  isViewDataContract,
  type ActiveBindingCollection,
  type ActiveBindingProviderAssignment,
  type BindingLifecycleOwner,
  type CommandIntent,
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
  readonly payload: Payload;
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
  if (input.providerIds !== undefined && !Array.isArray(input.providerIds)) {
    throw new Error('runtime binding source: providerIds must be an array');
  }

  const source = {
    owner: input.owner,
    contract: input.contract,
    providerIds: input.providerIds === undefined
      ? undefined
      : Object.freeze([...input.providerIds]),
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
    payload,
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
    if (!layer.blocksBelow) {
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
