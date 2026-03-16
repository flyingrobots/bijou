import type { ClockPort } from '../ports/clock.js';

/**
 * Default system-backed clock implementation.
 *
 * This remains the runtime default, while tests can inject a deterministic
 * implementation through `BijouContext.clock`.
 */
const SYSTEM_CLOCK: ClockPort = {
  now(): number {
    return Date.now();
  },

  date(ms?: number): Date {
    return new Date(ms ?? Date.now());
  },

  setTimeout(callback: () => void, ms: number) {
    const id = globalThis.setTimeout(callback, ms);
    return {
      dispose(): void {
        globalThis.clearTimeout(id);
      },
    };
  },

  setInterval(callback: () => void, ms: number) {
    const id = globalThis.setInterval(callback, ms);
    return {
      dispose(): void {
        globalThis.clearInterval(id);
      },
    };
  },

  queueMicrotask(callback: () => void): void {
    globalThis.queueMicrotask(callback);
  },
};

/** Return the shared system-backed clock. */
export function systemClock(): ClockPort {
  return SYSTEM_CLOCK;
}

/** Resolve a clock from an explicit port or a context-like object. */
export function resolveClock(value?: ClockPort | { clock?: ClockPort }): ClockPort {
  if (value === undefined) return SYSTEM_CLOCK;
  if (typeof value === 'object' && value !== null && 'now' in value) {
    return value as ClockPort;
  }
  return value.clock ?? SYSTEM_CLOCK;
}

/** Sleep for `ms` milliseconds using the provided clock port. */
export function sleep(clock: ClockPort, ms: number): Promise<void> {
  return new Promise<void>((resolve) => {
    clock.setTimeout(resolve, ms);
  });
}

/** Yield to the next microtask using the provided clock port. */
export function defer(clock: ClockPort): Promise<void> {
  return new Promise<void>((resolve) => {
    clock.queueMicrotask(resolve);
  });
}
