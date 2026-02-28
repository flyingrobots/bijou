/**
 * Built-in command factories for the TEA runtime.
 *
 * Provide standard side effects: quitting the application, delayed message
 * delivery, and batching multiple commands.
 *
 * @module
 */

import { QUIT, type Cmd, type QuitSignal } from './types.js';

/**
 * Create a command that signals the runtime to quit.
 *
 * @template M - Application message type.
 * @returns A command that resolves to the {@link QUIT} sentinel.
 */
export function quit<M>(): Cmd<M> {
  return async (_emit) => QUIT as QuitSignal;
}

/**
 * Create a command that delivers a message after a delay.
 *
 * @template M - Application message type.
 * @param ms - Delay in milliseconds before delivering the message.
 * @param msg - Message to deliver after the delay.
 * @returns A one-shot timer command.
 */
export function tick<M>(ms: number, msg: M): Cmd<M> {
  return (_emit) =>
    new Promise<M>((resolve) => {
      setTimeout(() => resolve(msg), ms);
    });
}

/**
 * Group multiple commands into an array.
 *
 * Convenience wrapper that collects variadic commands into a `Cmd<M>[]`
 * suitable for returning from `init()` or `update()`.
 *
 * @template M - Application message type.
 * @param cmds - Commands to batch.
 * @returns Array of commands.
 */
export function batch<M>(...cmds: Cmd<M>[]): Cmd<M>[] {
  return cmds;
}
