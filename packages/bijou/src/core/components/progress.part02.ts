import { resolveCtx } from '../resolve-ctx.js';
import { cursorGuard, type CursorHideHandle } from './cursor-guard.js';
import { CLEAR_LINE_RETURN } from '../ansi.js';
import {
  type ProgressBarController,
  type ProgressBarOptions,
  progressBar,
} from './progress.part01.js';

/** Options for {@link createProgressBar}. Currently identical to {@link ProgressBarOptions}. */
export type LiveProgressBarOptions = ProgressBarOptions;
/**
 * Create a live progress bar that the caller updates by pushing new values.
 *
 * In interactive mode, each call to {@link ProgressBarController.update}
 * overwrites the current line. Non-interactive modes emit a new line per update.
 *
 * @param options - Progress bar configuration.
 * @returns A {@link ProgressBarController} for starting, updating, and stopping the bar.
 */
export function createProgressBar(
  options: LiveProgressBarOptions = {},
): ProgressBarController {
  const ctx = resolveCtx(options.ctx);
  const mode = ctx.mode;
  let cursorHandle: CursorHideHandle | null = null;

  return {
    start() {
      if (mode !== 'interactive') {
        ctx.io.write(progressBar(0, { ...options, ctx }) + '\n');
        return;
      }
      cursorHandle?.dispose();
      cursorHandle = cursorGuard(ctx.io).hide();
      ctx.io.write(progressBar(0, { ...options, ctx }));
    },

    update(pct: number) {
      if (mode !== 'interactive') {
        ctx.io.write(progressBar(pct, { ...options, ctx }) + '\n');
        return;
      }
      ctx.io.write(
        `${CLEAR_LINE_RETURN}${progressBar(pct, { ...options, ctx })}`,
      );
    },

    stop(finalMessage?: string) {
      if (mode !== 'interactive') {
        if (finalMessage !== undefined) {
          ctx.io.write(finalMessage + '\n');
        }
        return;
      }
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
// ---------------------------------------------------------------------------
// Animated progress bar (smooth interpolation between values)
// ---------------------------------------------------------------------------

/** Options for {@link createAnimatedProgressBar}. */
export interface AnimatedProgressBarOptions extends ProgressBarOptions {
  /** Target frames per second for the interpolation animation (defaults to 30). */
  fps?: number;
  /** Duration in milliseconds to interpolate from current to target value (defaults to 300). */
  duration?: number;
}
