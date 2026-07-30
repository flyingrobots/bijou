import type { RuntimeInputRouteResult } from "./runtime-engine-input.js";

export interface RuntimeCommandBuffer<Command = unknown> {
  readonly items: readonly Command[];
}

export interface RuntimeEffectBuffer<Effect = unknown> {
  readonly items: readonly Effect[];
}

export interface RuntimeBuffers<Command = unknown, Effect = unknown> {
  readonly commands: RuntimeCommandBuffer<Command>;
  readonly effects: RuntimeEffectBuffer<Effect>;
}

export interface ApplyRuntimeCommandBufferResult<State, Command = unknown> {
  readonly state: State;
  readonly applied: readonly Command[];
  readonly buffer: RuntimeCommandBuffer<Command>;
}

export interface ExecuteRuntimeEffectBufferResult<Effect = unknown> {
  readonly executed: readonly Effect[];
  readonly buffer: RuntimeEffectBuffer<Effect>;
}

export function createRuntimeCommandBuffer<Command = unknown>(
  items: readonly Command[] = [],
): RuntimeCommandBuffer<Command> {
  return { items: [...items] };
}

export function createRuntimeEffectBuffer<Effect = unknown>(
  items: readonly Effect[] = [],
): RuntimeEffectBuffer<Effect> {
  return { items: [...items] };
}

export function createRuntimeBuffers<
  Command = unknown,
  Effect = unknown,
>(): RuntimeBuffers<Command, Effect> {
  return {
    commands: createRuntimeCommandBuffer<Command>(),
    effects: createRuntimeEffectBuffer<Effect>(),
  };
}

export function appendRuntimeCommands<Command = unknown>(
  buffer: RuntimeCommandBuffer<Command>,
  commands: readonly Command[],
): RuntimeCommandBuffer<Command> {
  return commands.length === 0
    ? buffer
    : { items: [...buffer.items, ...commands] };
}

export function appendRuntimeEffects<Effect = unknown>(
  buffer: RuntimeEffectBuffer<Effect>,
  effects: readonly Effect[],
): RuntimeEffectBuffer<Effect> {
  return effects.length === 0
    ? buffer
    : { items: [...buffer.items, ...effects] };
}

export function bufferRuntimeRouteResult<Command = unknown, Effect = unknown>(
  buffers: RuntimeBuffers<Command, Effect>,
  result:
    | RuntimeInputRouteResult<Command, Effect>
    | {
        readonly commands: readonly Command[];
        readonly effects: readonly Effect[];
      },
): RuntimeBuffers<Command, Effect> {
  const commands = appendRuntimeCommands(buffers.commands, result.commands);
  const effects = appendRuntimeEffects(buffers.effects, result.effects);
  return commands === buffers.commands && effects === buffers.effects
    ? buffers
    : { commands, effects };
}

export function applyRuntimeCommandBuffer<State, Command = unknown>(
  state: State,
  buffer: RuntimeCommandBuffer<Command>,
  apply: (state: State, command: Command) => State,
): ApplyRuntimeCommandBufferResult<State, Command> {
  let nextState = state;
  for (const command of buffer.items) nextState = apply(nextState, command);
  return {
    state: nextState,
    applied: [...buffer.items],
    buffer: createRuntimeCommandBuffer<Command>(),
  };
}

export async function executeRuntimeEffectBuffer<Effect = unknown>(
  buffer: RuntimeEffectBuffer<Effect>,
  execute: (effect: Effect) => void | Promise<void>,
): Promise<ExecuteRuntimeEffectBufferResult<Effect>> {
  for (const effect of buffer.items) await execute(effect);
  return {
    executed: [...buffer.items],
    buffer: createRuntimeEffectBuffer<Effect>(),
  };
}
