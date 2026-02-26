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
import type { Cmd, KeyMsg, ResizeMsg } from './types.js';
import { QUIT } from './types.js';
import { parseKey } from './keys.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Any message the bus can carry — built-in or app-defined. */
export type BusMsg<M> = KeyMsg | ResizeMsg | M;

export interface EventBus<M> {
  /**
   * Subscribe to all events. Returns a dispose function.
   * Multiple subscribers are supported — all receive every event.
   */
  on(handler: (msg: BusMsg<M>) => void): Disposable;

  /** Emit a message to all subscribers. */
  emit(msg: BusMsg<M>): void;

  /**
   * Connect keyboard and resize sources from an IOPort.
   * Raw stdin bytes are parsed into KeyMsg automatically.
   * Returns a dispose function that disconnects both.
   */
  connectIO(io: IOPort): Disposable;

  /**
   * Run a command. The command receives the bus's `emit` function to
   * dispatch intermediate messages during execution. When it resolves:
   * - QUIT signal → fires onQuit handlers
   * - Message → emitted to all subscribers
   * - void/undefined → ignored
   *
   * Rejected commands are logged to stderr via `console.error`.
   */
  runCmd(cmd: Cmd<M>): void;

  /**
   * Register a quit handler. Called when a command resolves to QUIT.
   * Separate from `on()` so the runtime can handle shutdown without
   * the app needing to filter for it.
   */
  onQuit(handler: () => void): Disposable;

  /** Disconnect all sources and remove all subscribers. */
  dispose(): void;
}

interface Disposable {
  dispose(): void;
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export function createEventBus<M>(): EventBus<M> {
  const subscribers = new Set<(msg: BusMsg<M>) => void>();
  const quitHandlers = new Set<() => void>();
  const disposables: Disposable[] = [];
  let disposed = false;

  function emit(msg: BusMsg<M>): void {
    if (disposed) return;
    for (const handler of subscribers) {
      handler(msg);
    }
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

    connectIO(io: IOPort): Disposable {
      // Keyboard input
      const inputHandle = io.rawInput((raw: string) => {
        if (disposed) return;
        const keyMsg = parseKey(raw);
        // Skip unknown sequences (mouse events, etc.)
        if (keyMsg.key === 'unknown') return;
        emit(keyMsg);
      });

      // Resize events
      const resizeHandle = io.onResize((columns, rows) => {
        if (disposed) return;
        const msg: ResizeMsg = { type: 'resize', columns, rows };
        emit(msg);
      });

      const handle: Disposable = {
        dispose() {
          inputHandle.dispose();
          resizeHandle.dispose();
        },
      };
      disposables.push(handle);
      return handle;
    },

    runCmd(cmd: Cmd<M>): void {
      if (disposed) return;
      void cmd(emit).then((result) => {
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
        // Surface command rejections instead of leaving unhandled promise rejections.
        console.error('[EventBus] Command rejected:', err);
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

    dispose(): void {
      disposed = true;
      for (const d of disposables) {
        d.dispose();
      }
      disposables.length = 0;
      subscribers.clear();
      quitHandlers.clear();
    },
  };
}
