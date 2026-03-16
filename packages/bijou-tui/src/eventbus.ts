/**
 * Centralized event bus for TUI applications.
 *
 * Unifies all input sources (keyboard, resize, commands, custom) into
 * a single typed event stream. The TEA runtime subscribes to the bus
 * instead of manually wiring callbacks.
 *
 * ```ts
 * const bus = createEventBus<Msg>();
 *
 * // Connect I/O sources (keyboard + resize)
 * bus.connectIO(ctx.io);
 *
 * // Subscribe to all events
 * bus.on((msg) => {
 *   const [model, cmds] = app.update(msg, model);
 *   cmds.forEach(cmd => bus.runCmd(cmd));
 * });
 *
 * // Emit custom events
 * bus.emit({ type: 'tick' });
 *
 * // In tests — emit directly, no I/O needed
 * bus.emit({ type: 'key', key: 'a', ctrl: false, alt: false, shift: false });
 * ```
 */

import type { IOPort } from '@flyingrobots/bijou';
import { defer, resolveClock, sleep, type ClockPort } from '@flyingrobots/bijou';
import type { Cmd, KeyMsg, MouseMsg, PulseMsg, ResizeMsg } from './types.js';
import { QUIT } from './types.js';
import { parseKey, parseMouse } from './keys.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Union of all message types the bus can carry — built-in key, resize,
 * mouse, and pulse messages plus any app-defined custom message type.
 *
 * @template M - Application-defined custom message type.
 */
export type BusMsg<M> = KeyMsg | ResizeMsg | MouseMsg | PulseMsg | M;

/**
 * Middleware function for intercepting and modifying messages.
 * 
 * Call `next(msg)` to continue the message chain. Omitting the call 
 * halts message propagation.
 * 
 * @template M - Application-defined custom message type.
 */
export type Middleware<M> = (msg: BusMsg<M>, next: (msg: BusMsg<M>) => void) => void;

/**
 * Centralized event bus that unifies all input sources into a single
 * typed event stream for TEA applications.
 *
 * @template M - Application-defined custom message type.
 */
export interface EventBus<M> {
  /**
   * Subscribe to all events. Returns a dispose function.
   * Multiple subscribers are supported — all receive every event.
   *
   * @param handler - Callback invoked for every emitted message.
   * @returns A disposable that removes this subscription.
   */
  on(handler: (msg: BusMsg<M>) => void): Disposable;

  /**
   * Emit a message to all subscribers.
   *
   * @param msg - The message to broadcast.
   */
  emit(msg: BusMsg<M>): void;

  /**
   * Connect keyboard and resize sources from an IOPort.
   * Raw stdin bytes are parsed into KeyMsg automatically.
   * When `options.mouse` is true, SGR mouse sequences are parsed into MouseMsg.
   *
   * @param io - IO port providing raw input and resize events.
   * @param options - Optional flags (e.g. `{ mouse: true }` to enable mouse input).
   * @returns A disposable that disconnects both input and resize listeners.
   */
  connectIO(io: IOPort, options?: { mouse?: boolean }): Disposable;

  /**
   * Run a command. The command receives the bus's `emit` function to
   * dispatch intermediate messages during execution. When it resolves:
   * - QUIT signal — fires onQuit handlers
   * - Message — emitted to all subscribers
   * - void/undefined — ignored
   *
   * Rejected commands are surfaced via `onCommandRejected` when provided.
   *
   * @param cmd - The command to execute.
   */
  runCmd(cmd: Cmd<M>): void;

  /**
   * Register a quit handler. Called when a command resolves to QUIT.
   * Separate from `on()` so the runtime can handle shutdown without
   * the app needing to filter for it.
   *
   * @param handler - Callback invoked on quit signal.
   * @returns A disposable that removes this quit handler.
   */
  onQuit(handler: () => void): Disposable;

  /**
   * Start the system animation heartbeat at the specified frequency.
   * Emits `PulseMsg` to all subscribers.
   * 
   * @param fps - Frames per second. Default: 60.
   */
  startPulse(fps?: number): void;

  /** Stop the system animation heartbeat. */
  stopPulse(): void;

  /**
   * Register a listener for the system heartbeat pulse.
   * 
   * @param handler - Callback invoked every pulse with the time delta.
   * @returns A disposable that removes this pulse listener.
   */
  onPulse(handler: (dt: number) => void): Disposable;

  /**
   * Register a middleware function to intercept or modify messages.
   * 
   * Middleware are executed in the order they are registered.
   * 
   * @param middleware - The middleware function.
   * @returns A disposable that removes this middleware.
   */
  use(middleware: Middleware<M>): Disposable;

  /** Resolve once all in-flight commands have settled. */
  drain(): Promise<void>;

  /** Disconnect all sources and remove all subscribers. */
  dispose(): void;
}

/** Optional callbacks for {@link createEventBus}. */
export interface CreateEventBusOptions {
  /** Called when a command promise rejects. */
  onCommandRejected?: (error: unknown) => void;
  /** Called to surface error messages (replaces direct `console.error` usage). */
  onError?: (message: string, error: unknown) => void;
  /** Clock/scheduler override for deterministic command and pulse timing. */
  clock?: ClockPort;
}

/** Handle for unsubscribing or disconnecting a resource. */
interface Disposable {
  /** Remove the subscription or disconnect the resource. */
  dispose(): void;
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

/**
 * Create a new event bus.
 *
 * Returns an {@link EventBus} that manages subscribers, I/O connections,
 * command execution, and quit signaling for a TEA runtime.
 *
 * **Note:** Command rejections are silent by default. Provide `onCommandRejected`
 * or `onError` in options to surface them.
 *
 * @template M - Application-defined custom message type.
 * @returns A new event bus instance.
 */
export function createEventBus<M>(busOptions?: CreateEventBusOptions): EventBus<M> {
  const clock = resolveClock(busOptions?.clock);
  const subscribers = new Set<(msg: BusMsg<M>) => void>();
  const quitHandlers = new Set<() => void>();
  const pulseHandlers = new Set<(dt: number) => void>();
  const middlewares: Middleware<M>[] = [];
  const disposables: Disposable[] = [];
  let disposed = false;
  let pulseTimer: { dispose(): void } | null = null;
  let pendingCommands = 0;
  const idleResolvers = new Set<() => void>();

  /** Report an error without risking an unhandled rejection. */
  function safeReport(message: string, error: unknown): void {
    try {
      busOptions?.onError?.(message, error);
    } catch {
      // Never let error reporting recreate an unhandled rejection.
    }
  }

  /** Broadcast a message to all current subscribers. */
  function emit(msg: BusMsg<M>): void {
    if (disposed) return;

    let index = 0;
    const dispatch = (currentMsg: BusMsg<M>) => {
      if (index < middlewares.length) {
        const mw = middlewares[index++]!;
        let nextCalled = false;
        try {
          mw(currentMsg, (nextMsg) => {
            nextCalled = true;
            dispatch(nextMsg);
          });
        } catch (err) {
          safeReport('[EventBus] Middleware threw:', err);
          // Continue with original message if middleware fails and next() was not yet called
          if (!nextCalled) {
            dispatch(currentMsg);
          }
        }
      } else {
        for (const handler of subscribers) {
          handler(currentMsg);
        }
      }
    };

    dispatch(msg);
  }

  function resolveIdleIfNeeded(): void {
    if (!disposed && pendingCommands !== 0) return;
    for (const resolve of idleResolvers) {
      resolve();
    }
    idleResolvers.clear();
  }

  return {
    on(handler) {
      subscribers.add(handler);
      return {
        dispose() {
          subscribers.delete(handler);
        },
      };
    },

    emit,

    connectIO(io: IOPort, ioOptions?: { mouse?: boolean }): Disposable {
      const mouseEnabled = ioOptions?.mouse ?? false;

      // Keyboard (and optionally mouse) input
      const inputHandle = io.rawInput((raw: string) => {
        if (disposed) return;

        // When mouse is enabled, try parsing as mouse first
        if (mouseEnabled) {
          const mouseMsg = parseMouse(raw);
          if (mouseMsg) {
            emit(mouseMsg);
            return;
          }
        }

        const keyMsg = parseKey(raw);
        // Skip unknown sequences (unrecognized escape sequences)
        if (keyMsg.key === 'unknown') return;
        emit(keyMsg);
      });

      // Resize events
      const resizeHandle = io.onResize((columns, rows) => {
        if (disposed) return;
        const msg: ResizeMsg = { type: 'resize', columns, rows };
        emit(msg);
      });

      const dataHandle = io.onData?.((payload) => {
        if (disposed) return;
        emit(payload as M);
      });

      const handle: Disposable = {
        dispose() {
          inputHandle.dispose();
          resizeHandle.dispose();
          dataHandle?.dispose();
        },
      };
      disposables.push(handle);
      return handle;
    },

    runCmd(cmd: Cmd<M>): void {
      if (disposed) return;
      pendingCommands++;

      const caps = {
        onPulse: (h: (dt: number) => void) => this.onPulse(h),
        sleep: (ms: number) => sleep(clock, ms),
        defer: () => defer(clock),
        now: () => clock.now(),
      };

      Promise.resolve(cmd(emit, caps)).then((result) => {
        if (disposed) return;
        if (result === QUIT) {
          for (const handler of quitHandlers) {
            handler();
          }
          return;
        }
        if (result !== undefined) {
          emit(result as M);
        }
      }).catch((err: unknown) => {
        if (disposed) return;
        // Surface command rejections instead of leaving unhandled promise rejections.
        try {
          if (busOptions?.onCommandRejected != null) {
            busOptions.onCommandRejected(err);
          } else {
            safeReport('[EventBus] Command rejected:', err);
          }
        } catch (reportErr: unknown) {
          safeReport(
            busOptions?.onCommandRejected != null
              ? '[EventBus] onCommandRejected handler threw:'
              : '[EventBus] onError handler threw while reporting a command rejection:',
            reportErr,
          );
          safeReport('[EventBus] Original command rejection:', err);
        }
      }).finally(() => {
        pendingCommands = Math.max(0, pendingCommands - 1);
        if (!disposed) {
          resolveIdleIfNeeded();
        }
      });
    },

    onQuit(handler) {
      quitHandlers.add(handler);
      return {
        dispose() {
          quitHandlers.delete(handler);
        },
      };
    },

    startPulse(fps = 60) {
      if (disposed || pulseTimer) return;

      const intervalMs = Math.round(1000 / fps);
      let lastMs = clock.now();

      pulseTimer = clock.setInterval(() => {
        if (disposed) {
          pulseTimer?.dispose();
          pulseTimer = null;
          return;
        }
        const nowMs = clock.now();
        const dt = Math.max(0, (nowMs - lastMs) / 1000);
        lastMs = nowMs;

        // Notify pulse listeners first (for batching local state updates)
        for (const handler of pulseHandlers) {
          handler(dt);
        }
        // Emit message to application subscribers
        emit({ type: 'pulse', dt });
      }, intervalMs);
    },

    stopPulse() {
      if (pulseTimer) {
        pulseTimer.dispose();
        pulseTimer = null;
      }
    },

    onPulse(handler) {
      pulseHandlers.add(handler);
      return {
        dispose() {
          pulseHandlers.delete(handler);
        },
      };
    },

    use(middleware) {
      middlewares.push(middleware);
      return {
        dispose() {
          const i = middlewares.indexOf(middleware);
          if (i !== -1) middlewares.splice(i, 1);
        },
      };
    },

    drain(): Promise<void> {
      if (disposed || pendingCommands === 0) {
        return Promise.resolve();
      }
      return new Promise<void>((resolve) => {
        idleResolvers.add(resolve);
      });
    },

    dispose(): void {
      disposed = true;
      if (pulseTimer) {
        pulseTimer.dispose();
        pulseTimer = null;
      }
      resolveIdleIfNeeded();
      for (const d of disposables) {
        d.dispose();
      }
      disposables.length = 0;
      subscribers.clear();
      quitHandlers.clear();
      pulseHandlers.clear();
      middlewares.length = 0;
    },
  };
}
