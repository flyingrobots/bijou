import type { RawInputHandle } from '@flyingrobots/bijou';
import { quit, type App } from '@flyingrobots/bijou-tui';

/** The private message that asks a mounted app to quit. */
const STOP: unique symbol = Symbol('bijou-web canvas stop');

/**
 * In crash mode the runtime hands no message to the app and shuts down on
 * Enter, so a stop after a crash sends Enter. The run then rejects with the
 * crash error.
 */
const CRASH_DISMISS = { type: 'key', key: 'enter', ctrl: false, alt: false, shift: false } as const;

/** An app wrapped so the mount can read its model and end its run. */
export interface ControlledApp<Model, M> {
  readonly app: App<Model, M | typeof STOP>;
  /** The latest model `init()` or `update()` returned. */
  model(): Model;
  /** Subscribe the runtime to control messages, as `IOPort.onData`. */
  onData(callback: (payload: unknown) => void): RawInputHandle;
  /** Ask the run to quit through its own update loop. */
  requestStop(): void;
}

/**
 * Wrap `app` without changing what it does. The TUI runtime has no external
 * stop, so `requestStop()` sends a private message through `IOPort.onData`
 * that the wrapper answers with `quit()`; the run then shuts down the way an
 * app quit would. After the app threw, the runtime is in crash mode and the
 * stop is an Enter key instead.
 */
export function controlApp<Model, M>(app: App<Model, M>): ControlledApp<Model, M> {
  let latest: { readonly model: Model } | undefined;
  let crashed = false;
  const guard = <T>(work: () => T): T => {
    try {
      return work();
    } catch (error: unknown) {
      crashed = true;
      throw error;
    }
  };
  const listeners = new Set<(payload: unknown) => void>();
  const wrapped: App<Model, M | typeof STOP> = {
    init() {
      const [model, commands] = app.init();
      latest = { model };
      return [model, commands];
    },
    update(msg, model) {
      if (msg === STOP) return [model, [quit()]];
      const [next, commands] = guard(() => app.update(msg, model));
      latest = { model: next };
      return [next, commands];
    },
    view: (model) => guard(() => app.view(model)),
    routeRuntimeIssue: (issue) => app.routeRuntimeIssue?.(issue),
  };
  return {
    app: wrapped,
    model() {
      if (latest === undefined) throw new Error('the app has not been initialised yet');
      return latest.model;
    },
    onData(callback) {
      listeners.add(callback);
      return { dispose() { listeners.delete(callback); } };
    },
    requestStop() {
      const message = crashed ? CRASH_DISMISS : STOP;
      for (const listener of [...listeners]) listener(message);
    },
  };
}
