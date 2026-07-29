import type { BijouContext } from '../../ports/context.js';
import type { GradientStop, TokenValue } from '../theme/tokens.js';
import { lerp3 } from '../theme/gradient.js';
import { mix } from '../theme/color.js';
import { sanitizeNonNegativeInt } from '../numeric.js';
import { resolveCtx } from '../resolve-ctx.js';
import { renderByMode } from '../mode-render.js';

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
  /** Theme token for the leading edge of the filled range. Defaults to `semantic.info`. */
  filledToken?: TokenValue;
  /** Theme token for the trailing edge of the filled range. Defaults to `semantic.accent`. */
  filledEndToken?: TokenValue;
  /** Theme token applied to the empty range. Defaults to `ui.trackEmpty`. */
  emptyToken?: TokenValue;
  /** Theme token applied to the percentage label. Defaults to `semantic.primary`. */
  labelToken?: TokenValue;
  /** Whether to prepend a percentage label (defaults to `true`). */
  showPercent?: boolean;
  /** Bijou context for I/O, styling, and mode detection. */
  ctx?: BijouContext;
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
export function progressBar(
  percent: number,
  options: ProgressBarOptions = {},
): string {
  const ctx = resolveCtx(options.ctx);
  const pct = Math.max(0, Math.min(100, percent));
  const percentLabel = String(Math.round(pct));

  return renderByMode(
    ctx.mode,
    {
      pipe: () => `Progress: ${percentLabel}%`,
      accessible: () => `${percentLabel} percent complete.`,
      interactive: () => {
        const width = sanitizeNonNegativeInt(options.width, 20);
        const filledChar = options.filled ?? '\u2588';
        const emptyChar = options.empty ?? '\u2810';
        const showPercent = options.showPercent ?? true;
        const filledCount = Math.min(
          width,
          Math.max(0, Math.round((pct / 100) * width)),
        );

        const noColor = ctx.theme.noColor;
        const stops = options.gradient;
        const filledToken = options.filledToken ?? ctx.semantic('info');
        const filledEndToken = options.filledEndToken ?? ctx.semantic('accent');
        const emptyToken = options.emptyToken ?? ctx.ui('trackEmpty');
        const labelToken = options.labelToken ?? ctx.semantic('primary');

        let bar = '';
        if (noColor) {
          bar =
            filledChar.repeat(filledCount) +
            emptyChar.repeat(width - filledCount);
        } else if (stops != null && stops.length > 0) {
          for (let i = 0; i < filledCount; i++) {
            const t_val = filledCount <= 1 ? 0 : i / (filledCount - 1);
            const [r, g, b] = lerp3(stops, t_val * (pct / 100));
            bar += ctx.style.rgb(r, g, b, filledChar);
          }
          bar += ctx.style.styled(
            emptyToken,
            emptyChar.repeat(width - filledCount),
          );
        } else {
          for (let i = 0; i < filledCount; i++) {
            const t_val = filledCount <= 1 ? 0 : i / (filledCount - 1);
            const token = mix(filledToken, filledEndToken, t_val);
            bar += ctx.style.styled(token, filledChar);
          }
          bar += ctx.style.styled(
            emptyToken,
            emptyChar.repeat(width - filledCount),
          );
        }

        const label = showPercent ? `${percentLabel}%` : '';
        return label
          ? `${noColor ? label.padStart(4) : ctx.style.styled(labelToken, label.padStart(4))} ${bar}`
          : bar;
      },
    },
    options,
  );
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
