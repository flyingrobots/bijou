import type { TimerHandle } from '../../ports/io.js';
import { resolveClock } from '../clock.js';
import { sanitizePositiveInt } from '../numeric.js';
import { resolveCtx } from '../resolve-ctx.js';
import { cursorGuard, type CursorHideHandle } from './cursor-guard.js';
import { CLEAR_LINE_RETURN } from '../ansi.js';
import { type ProgressBarController, progressBar } from './progress.part01.js';
import { type AnimatedProgressBarOptions } from './progress.part02.js';

/**
 * Create an animated progress bar that smoothly interpolates between values.
 *
 * When {@link ProgressBarController.update} is called, the bar animates from
 * its current percentage to the target over the configured duration using a
 * fixed-step timer. Non-interactive modes skip animation entirely.
 *
 * @param options - Animated progress bar configuration.
 * @returns A {@link ProgressBarController} for starting, updating, and stopping the bar.
 */
export function createAnimatedProgressBar(
  options: AnimatedProgressBarOptions = {},
): ProgressBarController {
  const ctx = resolveCtx(options.ctx);
  const clock = resolveClock(ctx);
  const mode = ctx.mode;
  const fps = sanitizePositiveInt(options.fps, 30);
  const duration = sanitizePositiveInt(options.duration, 300);

  let currentPct = 0;
  let targetPct = 0;
  let timer: TimerHandle | null = null;
  let cursorHandle: CursorHideHandle | null = null;

  const frameMs = Math.round(1000 / fps);
  const stepPerFrame = 100 / (duration / frameMs); // max pct change per frame

  /** Write the current percentage bar to the terminal, overwriting the current line. */
  function render(): void {
    ctx.io.write(
      `${CLEAR_LINE_RETURN}${progressBar(currentPct, { ...options, ctx })}`,
    );
  }

  /** Start the interpolation timer if it is not already running. */
  function startAnimation(): void {
    if (timer !== null) return;
    timer = clock.setInterval(() => {
      if (Math.abs(targetPct - currentPct) < 0.1) {
        currentPct = targetPct;
        render();
        if (timer !== null) {
          timer.dispose();
          timer = null;
        }
        return;
      }
      const direction = targetPct > currentPct ? 1 : -1;
      currentPct +=
        direction * Math.min(stepPerFrame, Math.abs(targetPct - currentPct));
      render();
    }, frameMs);
  }

  return {
    start() {
      if (mode !== 'interactive') {
        ctx.io.write(progressBar(0, { ...options, ctx }) + '\n');
        return;
      }
      cursorHandle?.dispose();
      cursorHandle = cursorGuard(ctx.io).hide();
      render();
    },

    update(pct: number) {
      targetPct = Math.max(0, Math.min(100, pct));
      if (mode !== 'interactive') {
        currentPct = targetPct;
        ctx.io.write(progressBar(currentPct, { ...options, ctx }) + '\n');
        return;
      }
      startAnimation();
    },

    stop(finalMessage?: string) {
      if (timer !== null) {
        timer.dispose();
        timer = null;
      }
      currentPct = targetPct;
      if (mode !== 'interactive') {
        if (finalMessage !== undefined) {
          ctx.io.write(finalMessage + '\n');
        }
        return;
      }
      render();
      ctx.io.write(CLEAR_LINE_RETURN);
      if (cursorHandle !== null) {
        cursorHandle.dispose();
        cursorHandle = null;
      }
      if (finalMessage !== undefined) {
        ctx.io.write(finalMessage + '\n');
      }
    },
  };
}
