import type { ClockPort } from '../../ports/clock.js';
export interface MockClockOptions {
  /** Initial wall-clock time in milliseconds since the Unix epoch. */
  nowMs?: number;
}
export interface ScheduledTask {
  id: number;
  at: number;
  callback: () => void;
  intervalMs: number | null;
  disposed: boolean;
}
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
export function normalizeDelay(ms: number): number {
  if (!Number.isFinite(ms)) return 0;
  return Math.max(0, Math.floor(ms));
}
