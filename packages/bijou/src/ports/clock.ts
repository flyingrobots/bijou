import type { TimerHandle } from './io.js';

/**
 * Abstract time/scheduling port.
 *
 * Provides wall-clock reads plus timer and microtask scheduling without
 * coupling components to Node.js globals.
 */
export interface ClockPort {
  /** Current wall-clock time in milliseconds since the Unix epoch. */
  now(): number;

  /**
   * Create a Date object for a specific timestamp or for the current time when
   * omitted.
   */
  date(ms?: number): Date;

  /**
   * Schedule a one-shot callback.
   * @returns A handle whose `dispose()` cancels the timeout.
   */
  setTimeout(callback: () => void, ms: number): TimerHandle;

  /**
   * Schedule a repeating callback.
   * @returns A handle whose `dispose()` cancels the interval.
   */
  setInterval(callback: () => void, ms: number): TimerHandle;

  /** Schedule a microtask callback. */
  queueMicrotask(callback: () => void): void;
}
