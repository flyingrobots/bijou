import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import type { ClockPort, TimerHandle } from '@flyingrobots/bijou';
import {
  createScriptTestContext,
  type ScriptTestContext,
} from './scripted.js';

type ScriptContextOptions = Parameters<typeof createScriptTestContext>[0];

/**
 * Scripted time runs this many times faster than the timers it schedules:
 * a timer of N ms moves the clock forward by N * this value.
 *
 * The settings toast lasts 2.5 s and ticks every 40 ms. At real speed that is
 * about 62 ticks, each one re-rendering the whole page (about 40 ms locally,
 * several times that on hosted runners). At 60x the toast is gone after two
 * ticks. The ratchet cases assert the settled state after the toast, so this
 * keeps every assertion and drops only the intermediate renders.
 */
const TOAST_TIME_SCALE = 60;

/**
 * Creates a scripted context whose clock lets short repeating timers, such as
 * the settings toast tick, expire after a few ticks instead of dozens.
 *
 * Use it for cases that assert the state after a transient toast. Cases that
 * assert what the toast shows while it is visible must use
 * `createScriptTestContext`.
 *
 * `tests/cycles/LX-011/dogfood-locale-ratchet.part04.test.ts` keeps this helper
 * honest: it runs the same language cycle at real speed and requires the
 * compressed run to end on the identical frame and page models.
 */
export function createToastCompressedScriptContext(
  options: ScriptContextOptions = {},
): ScriptTestContext {
  const base = createScriptTestContext(options).clock;
  let skewMs = 0;
  const clock: ClockPort = {
    now: () => base.now() + skewMs,
    date: (ms) => base.date(ms ?? base.now() + skewMs),
    setTimeout(callback: () => void, ms: number): TimerHandle {
      return base.setTimeout(() => {
        skewMs += Math.max(0, ms) * (TOAST_TIME_SCALE - 1);
        callback();
      }, ms);
    },
    setInterval: (callback, ms) => base.setInterval(callback, ms),
    queueMicrotask(callback: () => void): void {
      base.queueMicrotask(callback);
    },
  };
  return { ...createTestContext({ ...options, clock }), clock };
}
