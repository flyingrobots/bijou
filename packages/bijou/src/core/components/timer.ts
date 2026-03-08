import type { BijouContext } from '../../ports/context.js';
import type { TimerHandle } from '../../ports/io.js';
import { resolveCtx } from '../resolve-ctx.js';
import { renderByMode } from '../mode-render.js';

/** Configuration for timer rendering. */
export interface TimerOptions {
  /** Show hours segment even when 0 (e.g. `00:02:30`). Default: false. */
  showHours?: boolean;
  /** Show milliseconds (e.g. `02:30.123`). Default: false. */
  showMs?: boolean;
  /** Optional label prepended to the timer display. */
  label?: string;
  /** Bijou context for I/O, styling, and mode detection. */
  ctx?: BijouContext;
}

/** Controller for a live timer or stopwatch. */
export interface TimerController {
  /** Begin the timer. */
  start(): void;
  /** Pause the timer (preserves elapsed time). */
  pause(): void;
  /** Resume a paused timer. */
  resume(): void;
  /**
   * Stop the timer and optionally print a final message.
   * @param finalMessage - Text written after stopping (followed by a newline).
   */
  stop(finalMessage?: string): void;
  /** Return elapsed milliseconds. */
  elapsed(): number;
}

/** Options for {@link createTimer}. */
export interface CreateTimerOptions extends TimerOptions {
  /** Total duration in milliseconds for countdown. Timer completes when elapsed reaches this. */
  duration: number;
  /** Callback invoked when the countdown completes. */
  onComplete?: () => void;
  /** Tick interval in milliseconds. Default: 1000 (or 100 if showMs). */
  interval?: number;
}

/** Options for {@link createStopwatch}. */
export interface CreateStopwatchOptions extends TimerOptions {
  /** Tick interval in milliseconds. Default: 1000 (or 100 if showMs). */
  interval?: number;
}

/**
 * Render a static timer string from a millisecond value.
 *
 * Output adapts to the current output mode:
 * - `interactive` / `static` — formatted time with primary styling.
 * - `pipe` — plain text like `"02:30"`.
 * - `accessible` — human-readable like `"2 minutes, 30 seconds"`.
 *
 * @param ms - Elapsed or remaining time in milliseconds.
 * @param options - Timer rendering options.
 * @returns The rendered timer string.
 */
export function timer(ms: number, options: TimerOptions = {}): string {
  const ctx = resolveCtx(options.ctx);
  const label = options.label;

  return renderByMode(ctx.mode, {
    pipe: () => {
      const formatted = formatTime(ms, options);
      return label ? `${label} ${formatted}` : formatted;
    },
    accessible: () => {
      const spoken = formatSpoken(ms);
      return label ? `${label} ${spoken}` : spoken;
    },
    interactive: () => {
      const formatted = formatTime(ms, options);
      const timeStr = ctx.style.styled(ctx.semantic('primary'), formatted);
      return label ? `${label} ${timeStr}` : timeStr;
    },
  }, options);
}

/**
 * Create a live countdown timer.
 *
 * Follows the same controller pattern as `createSpinner` and `createProgressBar`.
 * In interactive mode, uses `setInterval` for ticking with `\r\x1b[K` for line overwrite.
 * Non-interactive modes emit a single line on start and final line on stop.
 *
 * @param options - Timer configuration including duration and optional onComplete callback.
 * @returns A {@link TimerController} for managing the timer.
 */
export function createTimer(options: CreateTimerOptions): TimerController {
  const ctx = resolveCtx(options.ctx);
  const mode = ctx.mode;
  const duration = Math.max(0, options.duration);
  const interval = options.interval ?? (options.showMs ? 100 : 1000);
  const onComplete = options.onComplete;

  let elapsedMs = 0;
  let timerHandle: TimerHandle | null = null;
  let startTime = 0;
  let pausedElapsed = 0;
  let paused = false;

  function render(): void {
    const remaining = Math.max(0, duration - elapsedMs);
    const line = timer(remaining, { ...options, ctx });
    ctx.io.write(`\r\x1b[K${line}`);
  }

  function tick(): void {
    if (paused) return;
    elapsedMs = pausedElapsed + (Date.now() - startTime);
    if (elapsedMs >= duration) {
      elapsedMs = duration;
      render();
      stopInternal();
      onComplete?.();
      return;
    }
    render();
  }

  function stopInternal(): void {
    if (timerHandle !== null) {
      timerHandle.dispose();
      timerHandle = null;
    }
  }

  return {
    start() {
      if (mode !== 'interactive') {
        ctx.io.write(timer(duration, { ...options, ctx }) + '\n');
        return;
      }
      startTime = Date.now();
      pausedElapsed = 0;
      elapsedMs = 0;
      ctx.io.write('\x1b[?25l');
      render();
      timerHandle = ctx.io.setInterval(tick, interval);
    },

    pause() {
      if (paused || timerHandle === null) return;
      paused = true;
      pausedElapsed = elapsedMs;
    },

    resume() {
      if (!paused) return;
      paused = false;
      startTime = Date.now();
    },

    stop(finalMessage?: string) {
      stopInternal();
      if (mode === 'interactive') {
        ctx.io.write('\r\x1b[K');
        ctx.io.write('\x1b[?25h');
      }
      if (finalMessage !== undefined) {
        ctx.io.write(finalMessage + '\n');
      }
    },

    elapsed() {
      return elapsedMs;
    },
  };
}

/**
 * Create a live stopwatch (counts up from zero).
 *
 * @param options - Stopwatch configuration.
 * @returns A {@link TimerController} for managing the stopwatch.
 */
export function createStopwatch(options: CreateStopwatchOptions = {}): TimerController {
  const ctx = resolveCtx(options.ctx);
  const mode = ctx.mode;
  const interval = options.interval ?? (options.showMs ? 100 : 1000);

  let elapsedMs = 0;
  let timerHandle: TimerHandle | null = null;
  let startTime = 0;
  let pausedElapsed = 0;
  let paused = false;

  function render(): void {
    const line = timer(elapsedMs, { ...options, ctx });
    ctx.io.write(`\r\x1b[K${line}`);
  }

  function tick(): void {
    if (paused) return;
    elapsedMs = pausedElapsed + (Date.now() - startTime);
    render();
  }

  return {
    start() {
      if (mode !== 'interactive') {
        ctx.io.write(timer(0, { ...options, ctx }) + '\n');
        return;
      }
      startTime = Date.now();
      pausedElapsed = 0;
      elapsedMs = 0;
      ctx.io.write('\x1b[?25l');
      render();
      timerHandle = ctx.io.setInterval(tick, interval);
    },

    pause() {
      if (paused || timerHandle === null) return;
      paused = true;
      pausedElapsed = elapsedMs;
    },

    resume() {
      if (!paused) return;
      paused = false;
      startTime = Date.now();
    },

    stop(finalMessage?: string) {
      if (timerHandle !== null) {
        timerHandle.dispose();
        timerHandle = null;
      }
      if (mode === 'interactive') {
        ctx.io.write('\r\x1b[K');
        ctx.io.write('\x1b[?25h');
      }
      if (finalMessage !== undefined) {
        ctx.io.write(finalMessage + '\n');
      }
    },

    elapsed() {
      return elapsedMs;
    },
  };
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

/** Format milliseconds as `MM:SS`, `HH:MM:SS`, or `MM:SS.mmm`. */
function formatTime(ms: number, options: TimerOptions): string {
  const totalSeconds = Math.floor(Math.max(0, ms) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const millis = Math.floor(ms % 1000);

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  let result: string;
  if (options.showHours || hours > 0) {
    const hh = String(hours).padStart(2, '0');
    result = `${hh}:${mm}:${ss}`;
  } else {
    result = `${mm}:${ss}`;
  }

  if (options.showMs) {
    result += `.${String(millis).padStart(3, '0')}`;
  }

  return result;
}

/** Format milliseconds as a human-readable spoken string. */
function formatSpoken(ms: number): string {
  const totalSeconds = Math.floor(Math.max(0, ms) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
  if (minutes > 0) parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds} ${seconds === 1 ? 'second' : 'seconds'}`);

  return parts.join(', ');
}
