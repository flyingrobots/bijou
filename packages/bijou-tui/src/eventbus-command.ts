import { defer, sleep } from '@flyingrobots/bijou';
import type {
  Cmd,
  CmdCleanup,
  CmdDisposable,
  CmdResult,
} from './types.js';
import { isCmdCleanup, QUIT } from './types.js';
import type { BusMsg, EventBusDisposable } from './eventbus-contract.js';
import type { EventBusState } from './eventbus-state.js';
import {
  emitMessage,
  reportBackpressureIfNeeded,
  resolveIdleIfNeeded,
  safeReport,
} from './eventbus-state.js';

export function runCommand<M>(
  state: EventBusState<M>,
  cmd: Cmd<M>,
  onPulse: (handler: (dt: number) => void) => EventBusDisposable,
): void {
  if (state.disposed) return;
  state.pendingCommands += 1;
  reportBackpressureIfNeeded(state);
  const emit = (message: BusMsg<M>): void => {
    emitMessage(state, message);
  };
  const caps = {
    onPulse,
    sleep: (ms: number) => sleep(state.clock, ms),
    defer: () => defer(state.clock),
    now: () => state.clock.now(),
  };

  let commandPromise: Promise<CmdResult<M>>;
  try {
    commandPromise = Promise.resolve(cmd(emit, caps));
  } catch (error: unknown) {
    commandPromise = Promise.reject(
      error instanceof Error ? error : new Error(String(error)),
    );
  }

  commandPromise
    .then((result) => {
      resolveCommandResult(state, result);
    })
    .catch((error: unknown) => {
      reportCommandRejection(state, error);
    })
    .finally(() => {
      settleCommand(state);
    });
}

export function drainCommands<M>(state: EventBusState<M>): Promise<void> {
  if (state.disposed || state.pendingCommands === 0) {
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    state.idleResolvers.add(resolve);
  });
}

function resolveCommandResult<M>(
  state: EventBusState<M>,
  result: CmdResult<M>,
): void {
  if (isCmdCleanup(result)) {
    const cleanup = normalizeCleanup(result);
    if (state.disposed) cleanup.dispose();
    else state.activeCommandCleanups.add(cleanup);
    return;
  }
  if (state.disposed) return;
  if (result === QUIT) {
    for (const handler of state.quitHandlers) handler();
  } else if (result !== undefined) {
    emitMessage(state, result);
  }
}

function reportCommandRejection<M>(
  state: EventBusState<M>,
  error: unknown,
): void {
  if (state.disposed) return;
  try {
    if (state.options?.onCommandRejected != null) {
      state.options.onCommandRejected(error);
    } else {
      safeReport(state, '[EventBus] Command rejected:', error);
    }
  } catch (reportError: unknown) {
    safeReport(
      state,
      state.options?.onCommandRejected != null
        ? '[EventBus] onCommandRejected handler threw:'
        : '[EventBus] onError handler threw while reporting a command rejection:',
      reportError,
    );
    safeReport(state, '[EventBus] Original command rejection:', error);
  }
}

function settleCommand<M>(state: EventBusState<M>): void {
  state.pendingCommands = Math.max(0, state.pendingCommands - 1);
  if (state.pendingCommands < state.backpressureThreshold) {
    state.backpressureReported = false;
  }
  if (!state.disposed) resolveIdleIfNeeded(state);
}

function normalizeCleanup(cleanup: CmdCleanup): CmdDisposable {
  return typeof cleanup === 'function' ? { dispose: cleanup } : cleanup;
}
