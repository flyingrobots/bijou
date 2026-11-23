import type { WebEventTarget, WebListenerOptions } from './web-dom.js';

/** Event bag with a recorded `preventDefault()` call. */
export interface FakeEvent {
  readonly prevented: () => boolean;
  preventDefault(): void;
}

interface Registration<E> {
  readonly type: string;
  readonly listener: (event: E) => void;
  readonly options: WebListenerOptions | undefined;
}

/** Real in-memory event target that counts its live listeners. */
export interface FakeTarget<E> extends WebEventTarget<E> {
  /** Run every listener registered for `type` and return the event. */
  dispatch<T extends E>(type: string, event: T): T;
  /** Listeners currently registered. */
  listenerCount(): number;
  /** Options a listener of `type` was registered with. */
  optionsFor(type: string): WebListenerOptions | undefined;
}

/** Create an in-memory event target. */
export function createFakeTarget<E>(): FakeTarget<E> {
  const registrations: Registration<E>[] = [];
  return {
    addEventListener(type, listener, options) {
      registrations.push({ type, listener, options });
    },
    removeEventListener(type, listener) {
      const index = registrations.findIndex((entry) => entry.type === type && entry.listener === listener);
      if (index >= 0) registrations.splice(index, 1);
    },
    dispatch(type, event) {
      for (const entry of [...registrations]) {
        if (entry.type === type) entry.listener(event);
      }
      return event;
    },
    listenerCount: () => registrations.length,
    optionsFor: (type) => registrations.find((entry) => entry.type === type)?.options,
  };
}

/** Make an event that records whether `preventDefault()` ran. */
export function withPrevent<T extends object>(fields: T): T & FakeEvent {
  let prevented = false;
  return {
    ...fields,
    prevented: () => prevented,
    preventDefault() { prevented = true; },
  };
}
