import type { EventBusState } from './eventbus-state.js';

export function safeReport<M>(
  state: EventBusState<M>,
  message: string,
  error: unknown,
): void {
  try {
    state.options?.onError?.(message, error);
  } catch {
    // Error reporting must not recreate an unhandled rejection.
  }
}
