import { QUIT, type Cmd, type QuitSignal } from './types.js';

/** Command that signals the runtime to quit. */
export function quit<M>(): Cmd<M> {
  return () => Promise.resolve(QUIT as QuitSignal);
}

/** Command that delivers a message after a delay (one-shot). */
export function tick<M>(ms: number, msg: M): Cmd<M> {
  return () => new Promise<M>((resolve) => {
    setTimeout(() => resolve(msg), ms);
  });
}

/** Convenience: group multiple commands into an array. */
export function batch<M>(...cmds: Cmd<M>[]): Cmd<M>[] {
  return cmds;
}
