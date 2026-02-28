import type { BijouContext } from '../../ports/context.js';
import type { TimerHandle } from '../../ports/io.js';
import type { OutputMode } from '../detect/tty.js';
import { getDefaultContext } from '../../context.js';

/** Configuration for spinner rendering and behavior. */
export interface SpinnerOptions {
  /** Custom animation frames (defaults to braille dot pattern). */
  frames?: string[];
  /** Text label displayed alongside the spinner. */
  label?: string;
  /** Milliseconds between frame updates (defaults to 80). */
  interval?: number;
  /** Bijou context for I/O, styling, and mode detection. */
  ctx?: BijouContext;
}

/** Default braille dot spinner frames. */
const DOTS = ['\u280b', '\u2819', '\u2839', '\u2838', '\u283c', '\u2834', '\u2826', '\u2827', '\u2807', '\u280f'];

/**
 * Resolve the provided context or fall back to the default context.
 *
 * @param ctx - Optional context override.
 * @returns The resolved {@link BijouContext}.
 */
function resolveCtx(ctx?: BijouContext): BijouContext {
  if (ctx) return ctx;
  return getDefaultContext();
}

/**
 * Render a single spinner frame as a string.
 *
 * Output adapts to the current output mode:
 * - `interactive` — animated braille frame + label.
 * - `static` — static ellipsis prefix.
 * - `pipe` — label followed by ellipsis.
 * - `accessible` — descriptive "Please wait." suffix.
 *
 * @param tick - Zero-based frame counter used to select the current animation frame.
 * @param options - Spinner configuration.
 * @returns The rendered spinner frame string.
 */
export function spinnerFrame(tick: number, options: SpinnerOptions = {}): string {
  const ctx = resolveCtx(options.ctx);
  const frames = options.frames ?? DOTS;
  const label = options.label ?? 'Loading';
  const mode: OutputMode = ctx.mode;

  switch (mode) {
    case 'interactive': {
      const frame = frames[tick % frames.length] ?? frames[0] ?? '\u280b';
      return `${frame} ${label}`;
    }
    case 'static':
      return `... ${label}`;
    case 'pipe':
      return `${label}...`;
    case 'accessible':
      return `${label}. Please wait.`;
  }
}

/** Controller returned by {@link createSpinner} for managing a live spinner. */
export interface SpinnerController {
  /** Begin rendering the spinner animation. In non-interactive modes, emit a single line. */
  start(): void;
  /** Update the spinner label text without restarting the animation.
   * @param label - New label to display.
   */
  update(label: string): void;
  /**
   * Stop the spinner, clear the line, and optionally print a final message.
   * @param finalMessage - Text written after stopping (followed by a newline).
   */
  stop(finalMessage?: string): void;
}

/**
 * Create a live spinner that animates in the terminal.
 *
 * In interactive mode the spinner uses an interval timer to cycle through
 * animation frames, hiding the cursor while running. Non-interactive modes
 * emit a single static line on {@link SpinnerController.start}.
 *
 * @param options - Spinner configuration.
 * @returns A {@link SpinnerController} for starting, updating, and stopping the spinner.
 */
export function createSpinner(options: SpinnerOptions = {}): SpinnerController {
  const ctx = resolveCtx(options.ctx);
  const frames = options.frames ?? DOTS;
  const interval = options.interval ?? 80;
  let label = options.label ?? 'Loading';
  let timer: TimerHandle | null = null;
  let tick = 0;

  const mode: OutputMode = ctx.mode;

  /** Write the current frame to the terminal, overwriting the previous line. */
  function render(): void {
    const line = spinnerFrame(tick, { frames, label, ctx });
    ctx.io.write(`\r\x1b[K${line}`);
    tick++;
  }

  return {
    start() {
      if (mode !== 'interactive') {
        ctx.io.write(spinnerFrame(0, { frames, label, ctx }) + '\n');
        return;
      }
      ctx.io.write('\x1b[?25l');
      render();
      timer = ctx.io.setInterval(render, interval);
    },

    update(newLabel: string) {
      label = newLabel;
    },

    stop(finalMessage?: string) {
      if (timer !== null) {
        timer.dispose();
        timer = null;
      }
      if (mode === 'interactive') {
        ctx.io.write('\r\x1b[K');
        ctx.io.write('\x1b[?25h');
      }
      if (finalMessage !== undefined) {
        ctx.io.write(finalMessage + '\n');
      }
    },
  };
}
