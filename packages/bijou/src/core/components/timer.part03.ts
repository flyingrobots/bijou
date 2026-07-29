import { resolveCtx } from '../resolve-ctx.js';
import { CLEAR_LINE_RETURN } from '../ansi.js';
import {
  type CreateStopwatchOptions,
  type CreateTimerOptions,
  type TimerController,
  timer,
} from './timer.part01.js';
import { createLiveController } from './timer.part02.js';

/**
 * Create a live countdown timer.
 *
 * Follows the same controller pattern as `createSpinner` and `createProgressBar`.
 * In interactive mode, uses `setInterval` for ticking with `CLEAR_LINE_RETURN` for line overwrite.
 * Non-interactive modes emit a single line on start and final line on stop.
 *
 * @param options - Timer configuration including duration and optional onComplete callback.
 * @returns A {@link TimerController} for managing the timer.
 */
export function createTimer(options: CreateTimerOptions): TimerController {
  const ctx = resolveCtx(options.ctx);
  const duration = Math.max(0, options.duration);
  const onComplete = options.onComplete;

  return createLiveController({
    ctx,
    interval: options.interval ?? (options.showMs ? 100 : 1000),
    timerOpts: options,
    displayMs: (elapsed) => Math.max(0, duration - elapsed),
    initialDisplayMs: duration,
    onTick: (elapsed) => {
      if (elapsed >= duration) {
        // Render final frame before completing
        const line = timer(0, { ...options, ctx });
        ctx.io.write(`${CLEAR_LINE_RETURN}${line}`);
        return true;
      }
      return false;
    },
    onComplete,
  });
}
/**
 * Create a live stopwatch (counts up from zero).
 *
 * @param options - Stopwatch configuration.
 * @returns A {@link TimerController} for managing the stopwatch.
 */
export function createStopwatch(
  options: CreateStopwatchOptions = {},
): TimerController {
  const ctx = resolveCtx(options.ctx);

  return createLiveController({
    ctx,
    interval: options.interval ?? (options.showMs ? 100 : 1000),
    timerOpts: options,
    displayMs: (elapsed) => elapsed,
    initialDisplayMs: 0,
  });
}
