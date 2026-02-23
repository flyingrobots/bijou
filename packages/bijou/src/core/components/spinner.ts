import type { BijouContext } from '../../ports/context.js';
import type { TimerHandle } from '../../ports/io.js';
import type { OutputMode } from '../detect/tty.js';
import { getDefaultContext } from '../../context.js';

export interface SpinnerOptions {
  frames?: string[];
  label?: string;
  interval?: number;
  ctx?: BijouContext;
}

const DOTS = ['\u280b', '\u2819', '\u2839', '\u2838', '\u283c', '\u2834', '\u2826', '\u2827', '\u2807', '\u280f'];

function resolveCtx(ctx?: BijouContext): BijouContext {
  if (ctx) return ctx;
  return getDefaultContext();
}

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

export interface SpinnerController {
  start(): void;
  update(label: string): void;
  stop(finalMessage?: string): void;
}

export function createSpinner(options: SpinnerOptions = {}): SpinnerController {
  const ctx = resolveCtx(options.ctx);
  const frames = options.frames ?? DOTS;
  const interval = options.interval ?? 80;
  let label = options.label ?? 'Loading';
  let timer: TimerHandle | null = null;
  let tick = 0;

  const mode: OutputMode = ctx.mode;

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
