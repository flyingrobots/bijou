import { collectActiveBindings, type ActiveBindingCollection } from '@flyingrobots/bijou';
import { appendRuntimeCommands, type RuntimeStackLayer, type RuntimeViewStack } from './runtime-engine.js';
import { RUNTIME_COMMAND_INTENT_ROUTE_BRAND, RUNTIME_VIEW_BINDING_SOURCE_BRAND, assertObjectRecord } from './runtime-binding.part01.js';
import type { DispatchRuntimeCommandIntentInput, DispatchRuntimeCommandIntentResult, RuntimeBindingLayerModel, RuntimeCommandIntentRoute, RuntimeViewBindingSource } from './runtime-binding.part01.js';
import { hasOwnBrand, isRuntimeCommandBuffer, isRuntimeCommandIntentEmission, isRuntimeCommandIntentRouteList } from './runtime-binding.part04.js';

export function dispatchRuntimeCommandIntent<Payload, Command>(
  input: DispatchRuntimeCommandIntentInput<Payload, Command>,
): DispatchRuntimeCommandIntentResult<Command> {
  assertObjectRecord(input, 'runtime command intent dispatch');

  if (!isRuntimeCommandIntentEmission(input.emission)) {
    throw new Error(
      'runtime command intent dispatch: emission was not created by runtimeCommandIntentEmission()',
    );
  }
  if (!isRuntimeCommandIntentRouteList(input.routes)) {
    throw new Error('runtime command intent dispatch: routes must be an array');
  }
  if (!isRuntimeCommandBuffer(input.buffer)) {
    throw new Error('runtime command intent dispatch: buffer must be a RuntimeCommandBuffer');
  }

  let route: RuntimeCommandIntentRoute<Payload, Command> | undefined;
  input.routes.forEach((candidate, index) => {
    if (!hasOwnBrand(candidate, RUNTIME_COMMAND_INTENT_ROUTE_BRAND)) {
      throw new Error(
        `runtime command intent dispatch: route at index ${String(index)} was not created by runtimeCommandIntentRoute()`,
      );
    }

    if (route === undefined && candidate.intent.id === input.emission.intent.id) {
      route = candidate;
    }
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
  return hasOwnBrand(value, RUNTIME_VIEW_BINDING_SOURCE_BRAND);
}

function isRuntimeViewStack(value: unknown): value is RuntimeViewStack {
  return Boolean(
    value
      && typeof value === 'object'
      && Array.isArray(Reflect.get(value, 'layers')),
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
          `runtime binding collection: source at layer ${layer.id} index ${String(index)} `
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
