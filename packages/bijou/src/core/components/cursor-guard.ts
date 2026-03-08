/**
 * Reference-counted cursor visibility guard.
 *
 * Multiple components (spinner, progress, timer, forms) can independently
 * hide the cursor. The guard tracks how many are active and only re-shows
 * the cursor when all have released their hold.
 *
 * @module core/components/cursor-guard
 */

import type { WritePort } from '../../ports/io.js';

const HIDE_CURSOR = '\x1b[?25l';
const SHOW_CURSOR = '\x1b[?25h';

/** Disposable handle returned by {@link CursorGuard.hide}. */
export interface CursorHideHandle {
  /** Release this hold on cursor visibility. Cursor re-appears when all handles are disposed. */
  dispose(): void;
}

/** Reference-counted cursor visibility manager. */
export interface CursorGuard {
  /** Hide the cursor, returning a handle that must be disposed to release the hold. */
  hide(): CursorHideHandle;
  /** Current number of active hide holds. */
  readonly depth: number;
}

/** WeakMap keyed on WritePort so each IOPort gets exactly one shared guard. */
const guards = new WeakMap<WritePort, CursorGuard>();

/**
 * Get or create the shared {@link CursorGuard} for the given I/O port.
 *
 * All components sharing the same `io` automatically share the same guard,
 * so nesting a spinner inside a progress bar (or any other combination)
 * won't prematurely restore the cursor.
 *
 * @param io - The I/O port to write cursor escape sequences to.
 * @returns The shared cursor guard for this port.
 */
export function cursorGuard(io: WritePort): CursorGuard {
  let existing = guards.get(io);
  if (existing) return existing;

  let count = 0;

  const guard: CursorGuard = {
    hide(): CursorHideHandle {
      if (count === 0) {
        io.write(HIDE_CURSOR);
      }
      count++;

      let disposed = false;
      return {
        dispose() {
          if (disposed) return;
          disposed = true;
          count--;
          if (count === 0) {
            io.write(SHOW_CURSOR);
          }
        },
      };
    },

    get depth() {
      return count;
    },
  };

  guards.set(io, guard);
  return guard;
}

/**
 * Run a function with the cursor hidden, guaranteeing restore via try/finally.
 *
 * Uses the shared {@link CursorGuard} for the given port, so nested calls
 * are reference-counted correctly.
 *
 * @param io - The I/O port to write cursor escape sequences to.
 * @param fn - The function to run while the cursor is hidden.
 * @returns The return value of `fn`. If `fn` returns a Promise, the cursor
 *          is restored after the promise settles.
 */
export function withHiddenCursor<T>(io: WritePort, fn: () => T): T {
  const guard = cursorGuard(io);
  const handle = guard.hide();
  try {
    const result = fn();
    // If fn returns a promise, defer dispose until settlement
    if (result instanceof Promise) {
      return result.then(
        (value) => {
          handle.dispose();
          return value;
        },
        (error: unknown) => {
          handle.dispose();
          throw error;
        },
      ) as T;
    }
    handle.dispose();
    return result;
  } catch (error: unknown) {
    handle.dispose();
    throw error;
  }
}
