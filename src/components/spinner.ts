import { detectOutputMode } from '../detect/tty.js';

export interface SpinnerOptions {
  /** Spinner frame set. Default: dots ('⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'). */
  frames?: string[];
  /** Label shown next to the spinner. */
  label?: string;
  /** Frame interval in ms. Default: 80. */
  interval?: number;
}

const DOTS = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

/**
 * Returns the spinner frame string for a given tick index.
 * Degrades by output mode:
 * - interactive: animated frame
 * - static: "... label"
 * - pipe: "label..."
 * - accessible: "label. Please wait."
 */
export function spinnerFrame(tick: number, options: SpinnerOptions = {}): string {
  const frames = options.frames ?? DOTS;
  const label = options.label ?? 'Loading';
  const mode = detectOutputMode();

  switch (mode) {
    case 'interactive': {
      const frame = frames[tick % frames.length] ?? frames[0] ?? '⠋';
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

export interface SpinnerController {
  /** Start the spinner. Writes to stdout. */
  start(): void;
  /** Update the label while spinning. */
  update(label: string): void;
  /** Stop and clear the spinner line. Optionally print a final message. */
  stop(finalMessage?: string): void;
}

/**
 * Creates an animated spinner that writes directly to process.stdout.
 * In non-interactive modes, prints a single static line instead.
 */
export function createSpinner(options: SpinnerOptions = {}): SpinnerController {
  const frames = options.frames ?? DOTS;
  const interval = options.interval ?? 80;
  let label = options.label ?? 'Loading';
  let timer: ReturnType<typeof setInterval> | null = null;
  let tick = 0;

  const mode = detectOutputMode();

  function render(): void {
    const line = spinnerFrame(tick, { frames, label });
    process.stdout.write(`\r\x1b[K${line}`);
    tick++;
  }

  return {
    start() {
      if (mode !== 'interactive') {
        process.stdout.write(spinnerFrame(0, { frames, label }) + '\n');
        return;
      }
      process.stdout.write('\x1b[?25l'); // hide cursor
      render();
      timer = setInterval(render, interval);
    },

    update(newLabel: string) {
      label = newLabel;
    },

    stop(finalMessage?: string) {
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
      if (mode === 'interactive') {
        process.stdout.write('\r\x1b[K'); // clear line
        process.stdout.write('\x1b[?25h'); // show cursor
      }
      if (finalMessage !== undefined) {
        process.stdout.write(finalMessage + '\n');
      }
    },
  };
}
