import type { TimerHandle } from '../../ports/io.js';

import { normalizeDelay } from './clock.part01.js';

import type { MockClock, MockClockOptions, ScheduledTask } from './clock.part01.js';
export function mockClock(options: MockClockOptions = {}): MockClock {
  let nowMs = options.nowMs ?? 0;
  let nextId = 1;
  const microtasks: (() => void)[] = [];
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
      for (;;) {
        sortTasks();
        const next = tasks.find((task) => !task.disposed);
        if (next === undefined) break;
        const nextIsInterval = next.intervalMs !== null;
        this.advanceBy(Math.max(0, next.at - nowMs));
        sortTasks();
        if (nextIsInterval && tasks.some((task) => !task.disposed && task.intervalMs !== null)) {
          throw new Error(
            'mockClock.runAll() cannot drain active interval timers; dispose them or advance time manually.',
          );
        }
      }
    },
  };
}
