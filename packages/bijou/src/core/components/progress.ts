import type { BijouContext } from '../../ports/context.js';
import type { TimerHandle } from '../../ports/io.js';
import type { GradientStop } from '../theme/tokens.js';
import { lerp3 } from '../theme/gradient.js';
import { getDefaultContext } from '../../context.js';

/** Configuration for rendering a progress bar. */
export interface ProgressBarOptions {
  /** Character-width of the bar (defaults to 20). */
  width?: number;
  /** Character used for filled segments (defaults to `\u2588` full block). */
  filled?: string;
  /** Character used for empty segments (defaults to `\u2810` braille dot). */
  empty?: string;
  /** Gradient color stops applied across filled segments. */
  gradient?: GradientStop[];
  /** Whether to prepend a percentage label (defaults to `true`). */
  showPercent?: boolean;
  /** Bijou context for I/O, styling, and mode detection. */
  ctx?: BijouContext;
}

/**
 * Resolve the provided context or fall back to the global default.
 *
 * @param ctx - Optional context override.
 * @returns The resolved {@link BijouContext}.
 */
function resolveCtx(ctx?: BijouContext): BijouContext {
  if (ctx) return ctx;
  return getDefaultContext();
}

/**
 * Render a progress bar string for the given percentage.
 *
 * Output adapts to the current output mode:
 * - `interactive` / `static` — visual bar using filled and empty characters,
 *   optionally colored with a gradient.
 * - `pipe` — plain text like `Progress: 42%`.
 * - `accessible` — screen-reader-friendly phrase like `42 percent complete.`.
 *
 * The percentage is clamped to the 0–100 range.
 *
 * @param percent - Completion percentage (0–100).
 * @param options - Progress bar configuration.
 * @returns The rendered progress bar string.
 */
export function progressBar(percent: number, options: ProgressBarOptions = {}): string {
  const ctx = resolveCtx(options.ctx);
  const pct = Math.max(0, Math.min(100, percent));
  const mode = ctx.mode;

  if (mode === 'pipe') {
    return `Progress: ${Math.round(pct)}%`;
  }
  if (mode === 'accessible') {
    return `${Math.round(pct)} percent complete.`;
  }

  const width = options.width ?? 20;
  const filledChar = options.filled ?? '\u2588';
  const emptyChar = options.empty ?? '\u2810';
  const showPercent = options.showPercent ?? true;
  const filledCount = Math.min(width, Math.max(0, Math.round((pct / 100) * width)));

  const noColor = ctx.theme.noColor;
  const theme = ctx.theme.theme;
  const stops = options.gradient ?? theme.gradient.progress ?? [];

  let bar = '';
  if (noColor || stops.length === 0) {
    bar = filledChar.repeat(filledCount) + emptyChar.repeat(width - filledCount);
  } else {
    for (let i = 0; i < filledCount; i++) {
      const t_val = filledCount <= 1 ? 0 : i / (filledCount - 1);
      const [r, g, b] = lerp3(stops, t_val * (pct / 100));
      bar += ctx.style.rgb(r, g, b, filledChar);
    }
    const emptyToken = theme.ui.trackEmpty;
    bar += ctx.style.hex(emptyToken.hex, emptyChar.repeat(width - filledCount));
  }

  const label = showPercent ? `${Math.round(pct)}%` : '';
  return label ? `${label.padStart(4)} ${bar}` : bar;
}

// ---------------------------------------------------------------------------
// Live progress bar (caller pushes values)
// ---------------------------------------------------------------------------

/** Controller for managing a live or animated progress bar. */
export interface ProgressBarController {
  /** Begin rendering the progress bar (hides cursor in interactive mode). */
  start(): void;
  /**
   * Set the progress bar to a new percentage.
   * @param pct - New completion percentage (0–100).
   */
  update(pct: number): void;
  /**
   * Stop the progress bar, restore the cursor, and optionally print a final message.
   * @param finalMessage - Text written after stopping (followed by a newline).
   */
  stop(finalMessage?: string): void;
}

/** Options for {@link createProgressBar}. Currently identical to {@link ProgressBarOptions}. */
export interface LiveProgressBarOptions extends ProgressBarOptions {
  // no extra options beyond ProgressBarOptions
}

/**
 * Create a live progress bar that the caller updates by pushing new values.
 *
 * In interactive mode, each call to {@link ProgressBarController.update}
 * overwrites the current line. Non-interactive modes emit a new line per update.
 *
 * @param options - Progress bar configuration.
 * @returns A {@link ProgressBarController} for starting, updating, and stopping the bar.
 */
export function createProgressBar(options: LiveProgressBarOptions = {}): ProgressBarController {
  const ctx = resolveCtx(options.ctx);
  const mode = ctx.mode;

  return {
    start() {
      if (mode !== 'interactive') {
        ctx.io.write(progressBar(0, { ...options, ctx }) + '\n');
        return;
      }
      ctx.io.write('\x1b[?25l');
      ctx.io.write(progressBar(0, { ...options, ctx }));
    },

    update(pct: number) {
      if (mode !== 'interactive') {
        ctx.io.write(progressBar(pct, { ...options, ctx }) + '\n');
        return;
      }
      ctx.io.write(`\r\x1b[K${progressBar(pct, { ...options, ctx })}`);
    },

    stop(finalMessage?: string) {
      if (mode !== 'interactive') {
        if (finalMessage !== undefined) {
          ctx.io.write(finalMessage + '\n');
        }
        return;
      }
      ctx.io.write('\r\x1b[K');
      ctx.io.write('\x1b[?25h');
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
export function createAnimatedProgressBar(options: AnimatedProgressBarOptions = {}): ProgressBarController {
  const ctx = resolveCtx(options.ctx);
  const mode = ctx.mode;
  const fps = options.fps ?? 30;
  const duration = options.duration ?? 300;

  let currentPct = 0;
  let targetPct = 0;
  let timer: TimerHandle | null = null;

  const frameMs = Math.round(1000 / fps);
  const stepPerFrame = 100 / (duration / frameMs); // max pct change per frame

  /** Write the current percentage bar to the terminal, overwriting the current line. */
  function render(): void {
    ctx.io.write(`\r\x1b[K${progressBar(currentPct, { ...options, ctx })}`);
  }

  /** Start the interpolation timer if it is not already running. */
  function startAnimation(): void {
    if (timer !== null) return;
    timer = ctx.io.setInterval(() => {
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
      currentPct += direction * Math.min(stepPerFrame, Math.abs(targetPct - currentPct));
      render();
    }, frameMs);
  }

  return {
    start() {
      if (mode !== 'interactive') {
        ctx.io.write(progressBar(0, { ...options, ctx }) + '\n');
        return;
      }
      ctx.io.write('\x1b[?25l');
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
      ctx.io.write('\r\x1b[K');
      ctx.io.write('\x1b[?25h');
      if (finalMessage !== undefined) {
        ctx.io.write(finalMessage + '\n');
      }
    },
  };
}
