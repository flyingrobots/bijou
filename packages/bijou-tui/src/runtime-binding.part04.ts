import { isBindingLifecycleOwner, isCommandIntent, type CommandIntent } from '@flyingrobots/bijou';
import type { RuntimeCommandBuffer } from './runtime-engine.js';
import { RUNTIME_COMMAND_INTENT_EMISSION_BRAND, RUNTIME_COMMAND_INTENT_ROUTE_BRAND, assertObjectRecord, brand } from './runtime-binding.part01.js';
import type { RuntimeCommandIntentEmission, RuntimeCommandIntentEmissionOptions, RuntimeCommandIntentRoute, RuntimeCommandIntentRouteInput } from './runtime-binding.part01.js';
import { freezeRuntimePayload } from './runtime-binding.part03.js';

export function runtimeCommandIntentEmission(
  intent: CommandIntent,
): RuntimeCommandIntentEmission;

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
  const owner = options['owner'];
  if (owner !== undefined && !isBindingLifecycleOwner(owner)) {
    throw new Error(
      'runtime command intent emission: owner was not created by defineBindingLifecycleOwner()',
    );
  }

  const emission = {
    intent,
    payload: freezeRuntimePayload(payload),
    owner,
  };

  brand(emission, RUNTIME_COMMAND_INTENT_EMISSION_BRAND);
  return Object.freeze(emission);
}

function hasOwnBrand(value: unknown, brandSymbol: symbol): boolean {
  return (
    value !== null
    && typeof value === 'object'
    && Object.prototype.hasOwnProperty.call(value, brandSymbol)
    && Reflect.get(value, brandSymbol) === true
  );
}

export function isRuntimeCommandIntentEmission(
  value: unknown,
): value is RuntimeCommandIntentEmission {
  return hasOwnBrand(value, RUNTIME_COMMAND_INTENT_EMISSION_BRAND);
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
  };

  brand(route, RUNTIME_COMMAND_INTENT_ROUTE_BRAND);
  return Object.freeze(route);
}

export function isRuntimeCommandIntentRoute(value: unknown): value is RuntimeCommandIntentRoute {
  return hasOwnBrand(value, RUNTIME_COMMAND_INTENT_ROUTE_BRAND);
}

function isRuntimeCommandIntentRouteList<Payload, Command>(value: readonly RuntimeCommandIntentRoute<Payload, Command>[]): value is readonly RuntimeCommandIntentRoute<Payload, Command>[] { return Array.isArray(value); }

function isRuntimeCommandBuffer(value: unknown): value is RuntimeCommandBuffer {
  return Boolean(
    value
      && typeof value === 'object'
      && Array.isArray(Reflect.get(value, 'items')),
  );
}

export { hasOwnBrand, isRuntimeCommandBuffer, isRuntimeCommandIntentRouteList };
