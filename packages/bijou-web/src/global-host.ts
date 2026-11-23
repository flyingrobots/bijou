import type { WebCancel, WebClockHost } from './clock.js';

type FrameCallback = (timestampMs: number) => void;
type AnyFunction = (...args: readonly unknown[]) => unknown;

/**
 * Look up a function on the global object without naming it as an identifier.
 *
 * Window, worker, and non-DOM hosts expose different globals, so a host API
 * that may be absent is read at run time and never assumed.
 */
function globalFunction(name: string): AnyFunction | undefined {
  const value: unknown = Reflect.get(globalThis, name);
  if (typeof value !== 'function') return undefined;
  return (...args) => {
    const result: unknown = Reflect.apply(value, globalThis, args);
    return result;
  };
}

function globalFrameScheduler(): ((callback: FrameCallback) => WebCancel) | undefined {
  const request = globalFunction('requestAnimationFrame');
  const cancel = globalFunction('cancelAnimationFrame');
  if (request === undefined || cancel === undefined) return undefined;
  return (callback) => {
    const id = request(callback);
    return () => { cancel(id); };
  };
}

/**
 * Build a {@link WebClockHost} from the globals of the current host.
 *
 * Works in a window and in a worker. `requestFrame` is defined only when the
 * host has `requestAnimationFrame`, which a worker may not.
 */
export function globalClockHost(): WebClockHost {
  return {
    now: () => Date.now(),
    monotonicNow: () => globalThis.performance.now(),
    setTimeout: (callback, ms) => {
      const id = globalThis.setTimeout(callback, ms);
      return () => { globalThis.clearTimeout(id); };
    },
    setInterval: (callback, ms) => {
      const id = globalThis.setInterval(callback, ms);
      return () => { globalThis.clearInterval(id); };
    },
    queueMicrotask: (callback) => { globalThis.queueMicrotask(callback); },
    requestFrame: globalFrameScheduler(),
  };
}
