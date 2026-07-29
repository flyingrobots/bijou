import type { IOPort } from '@flyingrobots/bijou';
import type {
  Cmd,
  KeyMsg,
  MouseMsg,
  PulseMsg,
  ResizeMsg,
} from './types.js';
import type {
  CommandQueueDiagnostics,
} from './eventbus-options.js';

/** Built-in input messages plus an application-defined message type. */
export type BusMsg<M> = KeyMsg | ResizeMsg | MouseMsg | PulseMsg | M;

/** Intercepts a message and may continue the chain with `next`. */
export type Middleware<M> = (
  msg: BusMsg<M>,
  next: (msg: BusMsg<M>) => void,
) => void;

/** Internal disposable shared by public event-bus operations. */
export interface EventBusDisposable {
  dispose(): void;
}

/** Central typed event stream for TUI applications. */
export interface EventBus<M> {
  /** Subscribe to every emitted message. */
  on(handler: (msg: BusMsg<M>) => void): EventBusDisposable;

  /** Emit one message through middleware to all subscribers. */
  emit(msg: BusMsg<M>): void;

  /** Connect raw input, resize, and optional data sources. */
  connectIO(
    io: IOPort,
    options?: { mouse?: boolean },
  ): EventBusDisposable;

  /** Run one command and route its result back through the bus. */
  runCmd(cmd: Cmd<M>): void;

  /** Subscribe to the command quit signal. */
  onQuit(handler: () => void): EventBusDisposable;

  /** Start the animation heartbeat. */
  startPulse(fps?: number): void;

  /** Stop the animation heartbeat. */
  stopPulse(): void;

  /** Subscribe to heartbeat deltas. */
  onPulse(handler: (dt: number) => void): EventBusDisposable;

  /** Add one ordered message middleware. */
  use(middleware: Middleware<M>): EventBusDisposable;

  /** Resolve once all in-flight commands settle. */
  drain(): Promise<void>;

  /** Read current command queue diagnostics. */
  getCommandDiagnostics(): CommandQueueDiagnostics;

  /** Disconnect sources and release retained resources. */
  dispose(): void;
}
