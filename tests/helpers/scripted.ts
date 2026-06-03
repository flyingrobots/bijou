import {
  createTestContext,
  type TestContext,
  type TestContextOptions,
} from '@flyingrobots/bijou/adapters/test';
import type { ClockPort, TimerHandle } from '@flyingrobots/bijou';
import {
  runScript,
  type App,
  type RunScriptOptions,
  type RunScriptResult,
  type ScriptStep,
} from '@flyingrobots/bijou-tui';

export interface ScriptTestContext extends TestContext {
  readonly clock: ClockPort;
}

export function createScriptTestContext(options: Omit<TestContextOptions, 'clock'> = {}): ScriptTestContext {
  return createTestContext({
    ...options,
    clock: autoAdvancingScriptClock(),
  }) as ScriptTestContext;
}

export function runScriptDeterministic<Model, M>(
  app: App<Model, M>,
  steps: ScriptStep<M>[],
  options: Omit<RunScriptOptions, 'pulseFps'> & {
    readonly ctx: ScriptTestContext;
    readonly pulseFps?: false;
  },
): Promise<RunScriptResult<Model>> {
  return runScript(app, steps, {
    ...options,
    pulseFps: options.pulseFps ?? false,
  });
}

interface ScheduledTimeout {
  readonly id: number;
  readonly at: number;
  readonly callback: () => void;
  disposed: boolean;
}

function normalizeDelay(ms: number): number {
  if (!Number.isFinite(ms)) return 0;
  return Math.max(0, Math.floor(ms));
}

/**
 * Creates a deterministic script clock that advances through scheduled timeout work.
 *
 * Each timeout queues one global microtask that drains all pending timeouts in
 * timestamp order, including timeouts scheduled by earlier callbacks. Disposed
 * timeouts stay in the small in-memory queue and are skipped, which is acceptable
 * for bounded test scripts.
 *
 * Intervals are intentionally unsupported; use explicit pulse steps or a
 * dedicated mock clock for periodic behavior. Microtasks still delegate to the
 * host queue so promise ordering matches the runtime.
 */
function autoAdvancingScriptClock(): ClockPort {
  let nowMs = 0;
  let nextId = 1;
  let flushQueued = false;
  const timeouts: ScheduledTimeout[] = [];

  function disposeTimeout(id: number): void {
    const timeout = timeouts.find((candidate) => candidate.id === id);
    if (timeout !== undefined) {
      timeout.disposed = true;
    }
  }

  function nextTimeout(): ScheduledTimeout | undefined {
    timeouts.sort((a, b) => a.at - b.at || a.id - b.id);
    return timeouts.find((timeout) => !timeout.disposed);
  }

  function queueFlush(): void {
    if (flushQueued) return;
    flushQueued = true;
    globalThis.queueMicrotask(() => {
      flushQueued = false;
      for (let timeout = nextTimeout(); timeout !== undefined; timeout = nextTimeout()) {
        timeout.disposed = true;
        nowMs = Math.max(nowMs, timeout.at);
        timeout.callback();
      }
    });
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
      timeouts.push({
        id,
        at: nowMs + normalizeDelay(ms),
        callback,
        disposed: false,
      });
      queueFlush();
      return {
        dispose(): void {
          disposeTimeout(id);
        },
      };
    },

    setInterval(): TimerHandle {
      // Scripted tests should drive periodic behavior through explicit pulse steps.
      throw new Error(
        'autoAdvancingScriptClock does not support intervals; use explicit pulse steps or a dedicated mockClock.',
      );
    },

    queueMicrotask(callback: () => void): void {
      // Preserve host microtask ordering while keeping timeout advancement deterministic.
      globalThis.queueMicrotask(callback);
    },
  };
}
