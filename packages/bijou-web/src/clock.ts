import type { ClockPort, TimerHandle } from '@flyingrobots/bijou';
import { globalClockHost } from './global-host.js';

/** Cancels one scheduled callback. */
export type WebCancel = () => void;

/**
 * The time and scheduling functions a {@link WebClock} runs on.
 *
 * Every member is a plain function that is called without a receiver. Each
 * scheduler returns its own cancel function, so a host never has to expose its
 * handle type.
 */
export interface WebClockHost {
  /** Wall-clock time in milliseconds since the Unix epoch. */
  readonly now: () => number;
  /** Monotonic time in milliseconds, as `performance.now()` reports it. */
  readonly monotonicNow: () => number;
  /** Schedule a one-shot callback. */
  readonly setTimeout: (callback: () => void, ms: number) => WebCancel;
  /** Schedule a repeating callback. */
  readonly setInterval: (callback: () => void, ms: number) => WebCancel;
  /** Schedule a microtask. */
  readonly queueMicrotask: (callback: () => void) => void;
  /** Schedule a callback before the next repaint. `undefined` when the host cannot. */
  readonly requestFrame: ((callback: (timestampMs: number) => void) => WebCancel) | undefined;
}

/** Options for {@link createWebClock}. */
export interface WebClockOptions {
  /**
   * Host functions to use in place of the globals. A member that is absent
   * uses the global; `requestFrame: undefined` turns frame scheduling off.
   */
  host?: Partial<WebClockHost>;
  /** Delay of the timer that stands in for a frame when the host has no frame hook. Defaults to 16 ms. */
  frameIntervalMs?: number;
}

/** A {@link ClockPort} for browser hosts, with frame scheduling and a leak counter. */
export interface WebClock extends ClockPort {
  /** Monotonic time in milliseconds. */
  monotonicNow(): number;
  /**
   * Schedule a callback for the next frame.
   *
   * Uses the host frame hook when there is one and a timer otherwise.
   * @returns A handle whose `dispose()` cancels the callback.
   */
  requestFrame(callback: (timestampMs: number) => void): TimerHandle;
  /** Number of timeouts, intervals, and frames that are scheduled and not yet finished or disposed. */
  pendingHandles(): number;
}

function delay(ms: number): number {
  return Number.isFinite(ms) && ms > 0 ? ms : 0;
}

function resolveHost(overrides: Partial<WebClockHost> = {}): WebClockHost {
  const base = globalClockHost();
  return {
    now: overrides.now ?? base.now,
    monotonicNow: overrides.monotonicNow ?? base.monotonicNow,
    setTimeout: overrides.setTimeout ?? base.setTimeout,
    setInterval: overrides.setInterval ?? base.setInterval,
    queueMicrotask: overrides.queueMicrotask ?? base.queueMicrotask,
    requestFrame: 'requestFrame' in overrides ? overrides.requestFrame : base.requestFrame,
  };
}

/**
 * Create a {@link ClockPort} backed by an injected host or the host globals.
 *
 * @param options - Host override and frame fallback interval.
 * @returns A clock whose handles cancel their callbacks on `dispose()`.
 */
export function createWebClock(options: WebClockOptions = {}): WebClock {
  const host = resolveHost(options.host);
  const frameIntervalMs = delay(options.frameIntervalMs ?? 16);
  let pending = 0;

  /**
   * Track one scheduled callback so that it is released exactly once.
   * `schedule` receives `run`, which performs an action only while the handle is live.
   */
  const track = (oneShot: boolean, schedule: (run: (act: () => void) => void) => WebCancel): TimerHandle => {
    let live = true;
    pending++;
    const release = (): void => {
      live = false;
      pending--;
    };
    const cancel = schedule((act) => {
      if (!live) return;
      if (oneShot) release();
      act();
    });
    return {
      dispose(): void {
        if (!live) return;
        release();
        cancel();
      },
    };
  };

  return {
    now: () => host.now(),
    date: (ms) => new Date(ms ?? host.now()),
    monotonicNow: () => host.monotonicNow(),
    setTimeout: (callback, ms) => track(true, (run) => host.setTimeout(() => { run(callback); }, delay(ms))),
    setInterval: (callback, ms) => track(false, (run) => host.setInterval(() => { run(callback); }, delay(ms))),
    queueMicrotask(callback) { host.queueMicrotask(callback); },
    requestFrame(callback) {
      const requestFrame = host.requestFrame;
      if (requestFrame !== undefined) {
        return track(true, (run) => requestFrame((timestampMs) => { run(() => { callback(timestampMs); }); }));
      }
      return track(true, (run) => host.setTimeout(() => {
        run(() => { callback(host.monotonicNow()); });
      }, frameIntervalMs));
    },
    pendingHandles: () => pending,
  };
}
