import { resolveClock, type ClockPort } from '@flyingrobots/bijou';
import type { CmdDisposable } from './types.js';
import type {
  BusMsg,
  EventBusDisposable,
  Middleware,
} from './eventbus-contract.js';
import type {
  CommandBackpressureInfo,
  CommandQueueDiagnostics,
  CreateEventBusOptions,
} from './eventbus-options.js';
import { safeReport } from './eventbus-report.js';

const DEFAULT_COMMAND_BACKPRESSURE_THRESHOLD = 1000;

export interface EventBusState<M> {
  readonly clock: ClockPort;
  readonly options: CreateEventBusOptions | undefined;
  readonly backpressureThreshold: number;
  readonly subscribers: Set<(msg: BusMsg<M>) => void>;
  readonly quitHandlers: Set<() => void>;
  readonly pulseHandlers: Set<(dt: number) => void>;
  readonly activeCommandCleanups: Set<CmdDisposable>;
  readonly middlewares: Middleware<M>[];
  readonly disposables: EventBusDisposable[];
  readonly idleResolvers: Set<() => void>;
  disposed: boolean;
  pulseTimer: EventBusDisposable | null;
  pendingCommands: number;
  backpressureReported: boolean;
}

export function createEventBusState<M>(
  options: CreateEventBusOptions | undefined,
): EventBusState<M> {
  return {
    clock: resolveClock(options?.clock),
    options,
    backpressureThreshold: normalizeThreshold(
      options?.commandBackpressureThreshold,
    ),
    subscribers: new Set(),
    quitHandlers: new Set(),
    pulseHandlers: new Set(),
    activeCommandCleanups: new Set(),
    middlewares: [],
    disposables: [],
    idleResolvers: new Set(),
    disposed: false,
    pulseTimer: null,
    pendingCommands: 0,
    backpressureReported: false,
  };
}

export function emitMessage<M>(
  state: EventBusState<M>,
  msg: BusMsg<M>,
): void {
  if (state.disposed) return;
  let index = 0;
  const dispatch = (current: BusMsg<M>): void => {
    const middleware = state.middlewares[index];
    if (middleware == null) {
      for (const handler of state.subscribers) {
        try {
          handler(current);
        } catch (error: unknown) {
          safeReport(state, '[EventBus] Subscriber threw:', error);
        }
      }
      return;
    }
    index += 1;
    const dispatchState = { continued: false };
    try {
      middleware(current, (next) => {
        dispatchState.continued = true;
        dispatch(next);
      });
    } catch (error: unknown) {
      safeReport(state, '[EventBus] Middleware threw:', error);
      if (!dispatchState.continued) dispatch(current);
    }
  };
  dispatch(msg);
}

export function resolveIdleIfNeeded<M>(state: EventBusState<M>): void {
  if (!state.disposed && state.pendingCommands !== 0) return;
  for (const resolve of state.idleResolvers) resolve();
  state.idleResolvers.clear();
}

export function commandDiagnostics<M>(
  state: EventBusState<M>,
): CommandQueueDiagnostics {
  return {
    pendingCommands: state.pendingCommands,
    activeCommandCleanups: state.activeCommandCleanups.size,
    backpressureThreshold: state.backpressureThreshold,
  };
}

export function reportBackpressureIfNeeded<M>(
  state: EventBusState<M>,
): void {
  if (
    state.backpressureThreshold === 0
    || state.pendingCommands < state.backpressureThreshold
    || state.backpressureReported
  ) {
    return;
  }
  state.backpressureReported = true;
  const info: CommandBackpressureInfo = {
    ...commandDiagnostics(state),
    atMs: state.clock.now(),
  };
  const message =
    `${String(state.pendingCommands)} pending; max `
    + `${String(state.backpressureThreshold)}.`;
  try {
    if (state.options?.onCommandBackpressure != null) {
      state.options.onCommandBackpressure(info);
    } else {
      safeReport(state, message, info);
    }
  } catch (error: unknown) {
    safeReport(
      state,
      '[EventBus] onCommandBackpressure handler threw:',
      error,
    );
    safeReport(state, message, info);
  }
}

function normalizeThreshold(value: number | undefined): number {
  if (value == null) return DEFAULT_COMMAND_BACKPRESSURE_THRESHOLD;
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.floor(value);
}
