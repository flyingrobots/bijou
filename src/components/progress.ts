import chalk from 'chalk';
import { detectOutputMode } from '../detect/tty.js';
import { getTheme, isNoColor } from '../theme/resolve.js';
import { lerp3 } from '../theme/gradient.js';
import type { GradientStop } from '../theme/tokens.js';

export interface ProgressBarOptions {
  /** Bar width in characters. Default: 20. */
  width?: number;
  /** Filled character. Default: '█'. */
  filled?: string;
  /** Empty character. Default: '░'. */
  empty?: string;
  /** Gradient stops for coloring. Uses theme.gradient.progress if not specified. */
  gradient?: GradientStop[];
  /** Show percentage label. Default: true. */
  showPercent?: boolean;
}

/**
 * Renders a progress bar string.
 *
 * Degrades by output mode:
 * - interactive/static: `[████░░░░] 45%` (colored in interactive)
 * - pipe: "Progress: 45%"
 * - accessible: "45 percent complete."
 */
export function progressBar(percent: number, options: ProgressBarOptions = {}): string {
  const pct = Math.max(0, Math.min(100, percent));
  const mode = detectOutputMode();

  if (mode === 'pipe') {
    return `Progress: ${Math.round(pct)}%`;
  }
  if (mode === 'accessible') {
    return `${Math.round(pct)} percent complete.`;
  }

  const width = options.width ?? 20;
  const filledChar = options.filled ?? '█';
  const emptyChar = options.empty ?? '░';
  const showPercent = options.showPercent ?? true;
  const filledCount = Math.min(width, Math.max(0, Math.round((pct / 100) * width)));

  const noColor = isNoColor();
  const t = getTheme();
  const stops = options.gradient ?? (t.theme.gradient['progress'] as GradientStop[] | undefined) ?? [];

  let bar = '';
  if (noColor || stops.length === 0) {
    bar = filledChar.repeat(filledCount) + emptyChar.repeat(width - filledCount);
  } else {
    // Color each filled character along the gradient
    for (let i = 0; i < filledCount; i++) {
      const t_val = filledCount <= 1 ? 0 : i / (filledCount - 1);
      const [r, g, b] = lerp3(stops, t_val * (pct / 100));
      bar += chalk.rgb(r, g, b)(filledChar);
    }
    const emptyToken = t.theme.ui['trackEmpty'];
    if (emptyToken !== undefined && !noColor) {
      bar += chalk.hex(emptyToken.hex)(emptyChar.repeat(width - filledCount));
    } else {
      bar += emptyChar.repeat(width - filledCount);
    }
  }

  const label = showPercent ? ` ${Math.round(pct)}%` : '';
  return `[${bar}]${label}`;
}
