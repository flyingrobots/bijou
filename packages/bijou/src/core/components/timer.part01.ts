import type { BijouContext } from '../../ports/context.js';
import type { TimerHandle } from '../../ports/io.js';
import { resolveCtx } from '../resolve-ctx.js';
import { renderByMode } from '../mode-render.js';
import { type CursorHideHandle } from './cursor-guard.js';
import { formatSpoken, formatTime } from './timer-format.js';

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

  return renderByMode(
    ctx.mode,
    {
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
    },
    options,
  );
}
/** Internal config for the shared live controller. */
export interface LiveControllerConfig {
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
export type TimerState =
  | { readonly kind: 'idle' }
  | {
      readonly kind: 'running';
      readonly startTime: number;
      readonly pausedElapsed: number;
      readonly handle: TimerHandle;
      readonly cursor: CursorHideHandle | null;
    }
  | {
      readonly kind: 'paused';
      readonly pausedElapsed: number;
      readonly handle: TimerHandle;
      readonly cursor: CursorHideHandle | null;
    }
  | { readonly kind: 'stopped'; readonly elapsedMs: number };
