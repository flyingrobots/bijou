import type { BijouContext } from '../../ports/context.js';
import type { GradientStop, TokenValue } from '../theme/tokens.js';
import { lerp3 } from '../theme/gradient.js';
import { mix } from '../theme/color.js';

/** Inputs for {@link progressCells}. */
export interface ProgressCellInput {
  readonly ctx: BijouContext;
  readonly pct: number;
  readonly width: number;
  readonly filledCount: number;
  readonly filledChar: string;
  readonly emptyChar: string;
  readonly gradient: readonly GradientStop[] | undefined;
  readonly filledToken: TokenValue;
  readonly filledEndToken: TokenValue;
  readonly emptyToken: TokenValue;
}

/**
 * Build the bar in logical order: one styled string per filled cell (leading
 * edge first) and the empty run. The caller places them left to right or, under
 * a mirrored layout, right to left; whole cells move, text inside one never does.
 */
export function progressCells(input: ProgressCellInput): { filled: string[]; empty: string } {
  const { ctx, pct, width, filledCount, filledChar, emptyChar } = input;
  const emptyRun = emptyChar.repeat(width - filledCount);
  if (ctx.theme.noColor) {
    return { filled: Array.from({ length: filledCount }, () => filledChar), empty: emptyRun };
  }
  const stops = input.gradient;
  const filled = Array.from({ length: filledCount }, (_, i) => {
    const t = filledCount <= 1 ? 0 : i / (filledCount - 1);
    if (stops != null && stops.length > 0) {
      const [r, g, b] = lerp3([...stops], t * (pct / 100));
      return ctx.style.rgb(r, g, b, filledChar);
    }
    return ctx.style.styled(mix(input.filledToken, input.filledEndToken, t), filledChar);
  });
  return { filled, empty: ctx.style.styled(input.emptyToken, emptyRun) };
}
