import type {
  BusMsg,
  EventBus,
  EventBusDisposable,
  Middleware,
} from './eventbus-contract.js';
import type { CreateEventBusOptions } from './eventbus-options.js';
import { connectEventBusIO } from './eventbus-io.js';
import { drainCommands, runCommand } from './eventbus-command.js';
import {
  startEventBusPulse,
  stopEventBusPulse,
  subscribeEventBusPulse,
} from './eventbus-pulse.js';
import {
  commandDiagnostics,
  createEventBusState,
  emitMessage,
  resolveIdleIfNeeded,
} from './eventbus-state.js';

/** Create a typed event bus for one TUI runtime. */
export function createEventBus<M>(
  options?: CreateEventBusOptions,
): EventBus<M> {
  const state = createEventBusState<M>(options);
  const subscribePulse = (
    handler: (dt: number) => void,
  ): EventBusDisposable => subscribeEventBusPulse(state, handler);

  return {
    on(handler) {
      state.subscribers.add(handler);
      return disposable(() => state.subscribers.delete(handler));
    },
    emit(message: BusMsg<M>) {
      emitMessage(state, message);
    },
    connectIO(io, ioOptions) {
      return connectEventBusIO(state, io, ioOptions?.mouse ?? false);
    },
    runCmd(cmd) {
      runCommand(state, cmd, subscribePulse);
    },
    onQuit(handler) {
      state.quitHandlers.add(handler);
      return disposable(() => state.quitHandlers.delete(handler));
    },
    startPulse(fps = 60) {
      startEventBusPulse(state, fps);
    },
    stopPulse() {
      stopEventBusPulse(state);
    },
    onPulse: subscribePulse,
    use(middleware: Middleware<M>) {
      state.middlewares.push(middleware);
      return disposable(() => {
        const index = state.middlewares.indexOf(middleware);
        if (index !== -1) state.middlewares.splice(index, 1);
      });
    },
    drain() {
      return drainCommands(state);
    },
    getCommandDiagnostics() {
      return commandDiagnostics(state);
    },
    dispose() {
      disposeEventBus(state);
    },
  };
}

function disposable(dispose: () => unknown): EventBusDisposable {
  return {
    dispose() {
      dispose();
    },
  };
}

function disposeEventBus<M>(
  state: ReturnType<typeof createEventBusState<M>>,
): void {
  state.disposed = true;
  stopEventBusPulse(state);
  for (const cleanup of state.activeCommandCleanups) cleanup.dispose();
  state.activeCommandCleanups.clear();
  resolveIdleIfNeeded(state);
  for (const handle of state.disposables) handle.dispose();
  state.disposables.length = 0;
  state.subscribers.clear();
  state.quitHandlers.clear();
  state.pulseHandlers.clear();
  state.middlewares.length = 0;
}
