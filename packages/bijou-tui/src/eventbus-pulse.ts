import type { EventBusDisposable } from './eventbus-contract.js';
import type { EventBusState } from './eventbus-state.js';
import { emitMessage } from './eventbus-state.js';

export function startEventBusPulse<M>(
  state: EventBusState<M>,
  fps: number,
): void {
  if (state.disposed || state.pulseTimer != null) return;
  const intervalMs = Math.round(1000 / fps);
  let lastMs = state.clock.now();
  state.pulseTimer = state.clock.setInterval(() => {
    if (state.disposed) {
      stopEventBusPulse(state);
      return;
    }
    const nowMs = state.clock.now();
    const dt = Math.max(0, (nowMs - lastMs) / 1000);
    lastMs = nowMs;
    for (const handler of state.pulseHandlers) handler(dt);
    emitMessage(state, { type: 'pulse', dt });
  }, intervalMs);
}

export function stopEventBusPulse<M>(state: EventBusState<M>): void {
  state.pulseTimer?.dispose();
  state.pulseTimer = null;
}

export function subscribeEventBusPulse<M>(
  state: EventBusState<M>,
  handler: (dt: number) => void,
): EventBusDisposable {
  state.pulseHandlers.add(handler);
  return {
    dispose() {
      state.pulseHandlers.delete(handler);
    },
  };
}
