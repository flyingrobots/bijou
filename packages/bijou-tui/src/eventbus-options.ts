import type { ClockPort } from '@flyingrobots/bijou';

/** Snapshot of command queue state for diagnostics and tests. */
export interface CommandQueueDiagnostics {
  readonly pendingCommands: number;
  readonly activeCommandCleanups: number;
  readonly backpressureThreshold: number;
}

/** Payload emitted when command backpressure diagnostics trip. */
export interface CommandBackpressureInfo extends CommandQueueDiagnostics {
  readonly atMs: number;
}

/** Optional callbacks and deterministic ports for `createEventBus`. */
export interface CreateEventBusOptions {
  onCommandRejected?: (error: unknown) => void;
  onCommandBackpressure?: (info: CommandBackpressureInfo) => void;
  onError?: (message: string, error: unknown) => void;
  commandBackpressureThreshold?: number;
  clock?: ClockPort;
}
