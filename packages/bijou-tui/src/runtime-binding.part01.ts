import type { ActiveBindingProviderAssignment, BindingLifecycleOwner, CommandIntent, DeepReadonly, ViewDataContract } from '@flyingrobots/bijou';
import type { RuntimeCommandBuffer } from './runtime-engine.js';

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

function assertObjectRecord(
  value: unknown,
  scope: string,
  label = 'input',
): asserts value is Record<string, unknown> {
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
      `provider assignment ${String(index)}`,
    );
    const requirementId = normalizeRequiredText({
      scope: 'runtime binding source',
      field: `provider assignment ${String(index)} requirementId`,
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
        field: `provider assignment ${String(index)} providerId`,
        value: assignment['providerId'],
      }),
    });
  }));
}

function brand<Brand extends symbol, Value extends object>(
  value: Value,
  brandSymbol: Brand,
): asserts value is Value & Readonly<Record<Brand, true>> {
  Object.defineProperty(value, brandSymbol, { value: true });
}

export { RUNTIME_COMMAND_INTENT_EMISSION_BRAND, RUNTIME_COMMAND_INTENT_ROUTE_BRAND, RUNTIME_VIEW_BINDING_SOURCE_BRAND, assertObjectRecord, brand, freezeProviderAssignments };
