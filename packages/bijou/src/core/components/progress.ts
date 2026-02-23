import type { BijouContext } from '../../ports/context.js';
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
  const emptyChar = options.empty ?? '\u2591';
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

  const label = showPercent ? ` ${Math.round(pct)}%` : '';
  return `[${bar}]${label}`;
}
