import type { ClockPort } from '../../ports/clock.js';
import type { TimerHandle } from '../../ports/io.js';

/**
 * Configuration for {@link mockClock}.
 */
export interface MockClockOptions {
  /** Initial wall-clock time in milliseconds since the Unix epoch. */
  nowMs?: number;
}

interface ScheduledTask {
  id: number;
  at: number;
  callback: () => void;
  intervalMs: number | null;
  disposed: boolean;
}

/**
 * Deterministic in-memory clock for tests.
 *
 * Supports manual time advancement, interval/timeout scheduling, and queued
 * microtasks without touching global timers.
 */
export interface MockClock extends ClockPort {
  /** Advance time and run all due timers/microtasks. */
  advanceBy(ms: number): void;
  /** Advance time while flushing native Promise continuations between timer chunks. */
  advanceByAsync(ms: number): Promise<void>;
  /** Run all queued microtasks without advancing wall-clock time. */
  flushMicrotasks(): void;
  /**
   * Run all currently scheduled non-recurring timers to completion.
   *
   * Throws when an interval remains active after being given a chance to run,
   * because recurring timers cannot be drained to completion automatically.
   */
  runAll(): void;
}

function normalizeDelay(ms: number): number {
  if (!Number.isFinite(ms)) return 0;
  return Math.max(0, Math.floor(ms));
}

/**
 * Create a deterministic {@link ClockPort} for unit and integration tests.
 *
 * The returned clock is manually driven through `advanceBy()` and `runAll()`.
 */
export function mockClock(options: MockClockOptions = {}): MockClock {
  let nowMs = options.nowMs ?? 0;
  let nextId = 1;
  const microtasks: Array<() => void> = [];
  const tasks: ScheduledTask[] = [];

  function sortTasks(): void {
    tasks.sort((a, b) => a.at - b.at || a.id - b.id);
  }

  function disposeTask(id: number): void {
    const task = tasks.find((candidate) => candidate.id === id);
    if (task) {
      task.disposed = true;
    }
  }

  function createHandle(id: number): TimerHandle {
    return {
      dispose(): void {
        disposeTask(id);
      },
    };
  }

  function runQueuedMicrotasks(): void {
    while (microtasks.length > 0) {
      const pending = microtasks.splice(0, microtasks.length);
      for (const callback of pending) {
        callback();
      }
    }
  }

  function runNextTask(targetMs: number): boolean {
    sortTasks();
    const next = tasks.find((task) => !task.disposed && task.at <= targetMs);
    if (next === undefined) return false;

    nowMs = next.at;
    if (next.intervalMs === null) {
      next.disposed = true;
    } else {
      next.at = nowMs + next.intervalMs;
    }
    next.callback();
    runQueuedMicrotasks();
    return true;
  }

  return {
    now(): number {
      return nowMs;
    },

    date(ms?: number): Date {
      return new Date(ms ?? nowMs);
    },

    setTimeout(callback: () => void, ms: number): TimerHandle {
      const id = nextId++;
      tasks.push({
        id,
        at: nowMs + normalizeDelay(ms),
        callback,
        intervalMs: null,
        disposed: false,
      });
      sortTasks();
      return createHandle(id);
    },

    setInterval(callback: () => void, ms: number): TimerHandle {
      const intervalMs = Math.max(1, normalizeDelay(ms));
      const id = nextId++;
      tasks.push({
        id,
        at: nowMs + intervalMs,
        callback,
        intervalMs,
        disposed: false,
      });
      sortTasks();
      return createHandle(id);
    },

    queueMicrotask(callback: () => void): void {
      microtasks.push(callback);
    },

    advanceBy(ms: number): void {
      const targetMs = nowMs + normalizeDelay(ms);
      runQueuedMicrotasks();
      while (runNextTask(targetMs)) {
        // Keep draining until there are no more timers due at or before targetMs.
      }
      nowMs = targetMs;
      runQueuedMicrotasks();
    },

    async advanceByAsync(ms: number): Promise<void> {
      const targetMs = nowMs + normalizeDelay(ms);
      await Promise.resolve();
      while (nowMs < targetMs) {
        sortTasks();
        const next = tasks.find((task) => !task.disposed && task.at <= targetMs);
        const nextAt = next?.at ?? Math.min(targetMs, nowMs + 1);
        this.advanceBy(Math.max(0, nextAt - nowMs));
        await Promise.resolve();
      }
      await Promise.resolve();
    },

    flushMicrotasks(): void {
      runQueuedMicrotasks();
    },

    runAll(): void {
      runQueuedMicrotasks();
      while (true) {
        sortTasks();
        const next = tasks.find((task) => !task.disposed);
        if (next === undefined) break;
        this.advanceBy(Math.max(0, next.at - nowMs));
        sortTasks();
        const remaining = tasks.filter((task) => !task.disposed);
        if (remaining.length > 0 && remaining.every((task) => task.intervalMs !== null)) {
          throw new Error(
            'mockClock.runAll() cannot drain active interval timers; dispose them or advance time manually.',
          );
        }
      }
    },
  };
}
