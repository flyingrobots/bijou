import type { EventBusState } from './eventbus-state.js';

export function safeReport<M>(
  state: EventBusState<M>,
  message: string,
  error: unknown,
): void {
  try {
    void Promise.resolve(
      state.options?.onError?.(message, error),
    ).catch(() => undefined);
  } catch {
    // Error reporting must not recreate an unhandled rejection.
  }
}

export function invokeSubscribers<M, Handler>(
  state: EventBusState<M>,
  handlers: Iterable<Handler>,
  failureMessage: string,
  invoke: (handler: Handler) => void,
): void {
  for (const handler of handlers) {
    try {
      invoke(handler);
    } catch (error: unknown) {
      safeReport(state, failureMessage, error);
    }
  }
}
