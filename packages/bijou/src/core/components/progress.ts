import type { BijouContext } from '../../ports/context.js';
import type { TimerHandle } from '../../ports/io.js';
import type { GradientStop } from '../theme/tokens.js';
import { lerp3 } from '../theme/gradient.js';
import { getDefaultContext } from '../../context.js';

export interface ProgressBarOptions {
  width?: number;
  filled?: string;
  empty?: string;
  gradient?: GradientStop[];
  showPercent?: boolean;
  ctx?: BijouContext;
}

function resolveCtx(ctx?: BijouContext): BijouContext {
  if (ctx) return ctx;
  return getDefaultContext();
}

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

export interface ProgressBarController {
  start(): void;
  update(pct: number): void;
  stop(finalMessage?: string): void;
}

export interface LiveProgressBarOptions extends ProgressBarOptions {
  // no extra options beyond ProgressBarOptions
}

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

export interface AnimatedProgressBarOptions extends ProgressBarOptions {
  fps?: number;
  duration?: number;
}

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

  function render(): void {
    ctx.io.write(`\r\x1b[K${progressBar(currentPct, { ...options, ctx })}`);
  }

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
