import type { BijouContext } from '../../ports/context.js';
import type { TimerHandle } from '../../ports/io.js';
import { resolveClock } from '../clock.js';
import { resolveCtx } from '../resolve-ctx.js';
import { renderByMode } from '../mode-render.js';
import { cursorGuard, type CursorHideHandle } from './cursor-guard.js';
import { CLEAR_LINE_RETURN } from '../ansi.js';

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

/** Internal config for the shared live controller. */
interface LiveControllerConfig {
  readonly ctx: BijouContext;
  readonly interval: number;
  readonly timerOpts: TimerOptions;
  /** Return the display ms for the current tick. Called after updating elapsed. */
  readonly displayMs: (elapsedMs: number) => number;
  /** Initial display value for non-interactive fallback. */
  readonly initialDisplayMs: number;
  /** Optional tick guard — return true to signal completion. */
  readonly onTick?: (elapsedMs: number) => boolean;
  /** Called after cleanup when onTick signals completion. */
  readonly onComplete?: () => void;
}

/**
 * Discriminated union for timer state machine.
 * Makes invalid states unrepresentable and transitions explicit.
 */
type TimerState =
  | { readonly kind: 'idle' }
  | { readonly kind: 'running'; readonly startTime: number; readonly pausedElapsed: number;
      readonly handle: TimerHandle; readonly cursor: CursorHideHandle | null }
  | { readonly kind: 'paused'; readonly pausedElapsed: number;
      readonly handle: TimerHandle; readonly cursor: CursorHideHandle | null }
  | { readonly kind: 'stopped'; readonly elapsedMs: number };

function computeElapsed(s: TimerState, nowMs: number): number {
  switch (s.kind) {
    case 'idle':    return 0;
    case 'running': return s.pausedElapsed + (nowMs - s.startTime);
    case 'paused':  return s.pausedElapsed;
    case 'stopped': return s.elapsedMs;
  }
}

/** Shared controller logic for createTimer and createStopwatch. */
function createLiveController(config: LiveControllerConfig): TimerController {
  const { ctx, interval, timerOpts, displayMs, initialDisplayMs, onTick, onComplete } = config;
  const clock = resolveClock(ctx);
  const mode = ctx.mode;

  let state: TimerState = { kind: 'idle' };

  function tick(): void {
    if (state.kind !== 'running') return;
    const elapsed = state.pausedElapsed + (clock.now() - state.startTime);
    if (onTick?.(elapsed)) {
      state.handle.dispose();
      if (mode === 'interactive') {
        ctx.io.write('\n');
        if (state.cursor !== null) {
          state.cursor.dispose();
        }
      }
      state = { kind: 'stopped', elapsedMs: elapsed };
      onComplete?.();
      return;
    }
    const line = timer(displayMs(elapsed), { ...timerOpts, ctx });
    ctx.io.write(`${CLEAR_LINE_RETURN}${line}`);
  }

  return {
    start() {
      if (state.kind === 'running' || state.kind === 'paused') {
        state.handle.dispose();
        if (state.cursor !== null) {
          state.cursor.dispose();
        }
      }

      if (mode !== 'interactive') {
        ctx.io.write(timer(initialDisplayMs, { ...timerOpts, ctx }) + '\n');
        if (onTick?.(0)) { onComplete?.(); }
        state = { kind: 'idle' };
        return;
      }

      const cursor = cursorGuard(ctx.io).hide();

      if (onTick?.(0)) {
        cursor.dispose();
        state = { kind: 'stopped', elapsedMs: 0 };
        onComplete?.();
        return;
      }

      const now = clock.now();
      const line = timer(displayMs(0), { ...timerOpts, ctx });
      ctx.io.write(`${CLEAR_LINE_RETURN}${line}`);
      const handle = clock.setInterval(tick, interval);
      state = { kind: 'running', startTime: now, pausedElapsed: 0, handle, cursor };
    },

    pause() {
      if (state.kind !== 'running') return;
      const elapsed = state.pausedElapsed + (clock.now() - state.startTime);
      state = { kind: 'paused', pausedElapsed: elapsed, handle: state.handle, cursor: state.cursor };
    },

    resume() {
      if (state.kind !== 'paused') return;
      state = { kind: 'running', startTime: clock.now(), pausedElapsed: state.pausedElapsed,
        handle: state.handle, cursor: state.cursor };
    },

    stop(finalMessage?: string) {
      const elapsed = computeElapsed(state, clock.now());
      if (state.kind === 'running' || state.kind === 'paused') {
        state.handle.dispose();
        if (mode === 'interactive') {
          ctx.io.write(CLEAR_LINE_RETURN);
          if (state.cursor !== null) {
            state.cursor.dispose();
          }
        }
      }
      state = { kind: 'stopped', elapsedMs: elapsed };
      if (finalMessage !== undefined) {
        ctx.io.write(finalMessage + '\n');
      }
    },

    elapsed() {
      return computeElapsed(state, clock.now());
    },
  };
}

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
export function createStopwatch(options: CreateStopwatchOptions = {}): TimerController {
  const ctx = resolveCtx(options.ctx);

  return createLiveController({
    ctx,
    interval: options.interval ?? (options.showMs ? 100 : 1000),
    timerOpts: options,
    displayMs: (elapsed) => elapsed,
    initialDisplayMs: 0,
  });
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

/** Format milliseconds as `MM:SS`, `HH:MM:SS`, or `MM:SS.mmm`. */
function formatTime(ms: number, options: TimerOptions): string {
  const safeMs = Math.max(0, ms);
  const totalSeconds = Math.floor(safeMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const millis = Math.floor(safeMs % 1000);

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
