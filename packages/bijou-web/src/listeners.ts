import type { WebEventTarget, WebListenerOptions } from './web-dom.js';

/** Tracks listeners so they can all be removed at once. */
export interface ListenerSet {
  add<E>(
    target: WebEventTarget<E>,
    type: string,
    listener: (event: E) => void,
    options?: WebListenerOptions,
  ): void;
  /** Remove every listener this set added. Safe to call again. */
  removeAll(): void;
}

/** Create an empty {@link ListenerSet}. */
export function createListenerSet(): ListenerSet {
  const removers: (() => void)[] = [];
  return {
    add(target, type, listener, options) {
      target.addEventListener(type, listener, options);
      removers.push(() => { target.removeEventListener(type, listener); });
    },
    removeAll() {
      for (const remove of removers.splice(0)) remove();
    },
  };
}
