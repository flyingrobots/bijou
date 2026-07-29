import type { TokenValue } from '../theme/tokens.js';
import { resolveCtx } from '../resolve-ctx.js';
import { makeBgFill } from '../bg-fill.js';
import { renderByMode } from '../mode-render.js';
import type { BijouNodeOptions } from './types.js';
import { resolveOverflowBehavior } from './overflow.js';
import { drawBox } from './box-render.js';
import { resolveFillChar } from './box-fill.js';

/** Configuration for rendering a bordered box. */
export interface BoxOptions extends BijouNodeOptions {
  /** Optional title displayed in the top border. */
  title?: string;
  /** Theme token applied to border characters. */
  borderToken?: TokenValue;
  /** Background fill token. Interior spaces are styled with this token's bg color. */
  bgToken?: TokenValue;
  /** Inner padding between the border and content (in characters/lines). */
  padding?: { top?: number; bottom?: number; left?: number; right?: number };
  /** Lock outer width (including borders). Content is clipped/padded to fit. */
  width?: number;
  /**
   * Custom character used for padding/fill areas instead of spaces.
   * Must be a single-width grapheme cluster. Wide characters (e.g. CJK)
   * are rejected and fall back to space.
   */
  fillChar?: string;
}

/**
 * Render content inside a bordered box.
 *
 * Output adapts to the current output mode:
 * - `interactive` / `static` — unicode box with themed border color.
 * - `pipe` / `accessible` — raw content without borders.
 *
 * @param content - Text to display inside the box (may contain newlines).
 * @param options - Box configuration.
 * @returns The rendered box string, or plain content in non-visual modes.
 */
export function box(
  content: string | null | undefined,
  options: BoxOptions = {},
): string {
  const ctx = resolveCtx(options.ctx);
  const safeContent = content ?? '';

  return renderByMode(
    ctx.mode,
    {
      pipe: () => safeContent,
      accessible: () => safeContent,
      interactive: () => {
        const borderToken = options.borderToken ?? ctx.border('primary');
        const padding = {
          top: options.padding?.top ?? 0,
          bottom: options.padding?.bottom ?? 0,
          left: options.padding?.left ?? 1,
          right: options.padding?.right ?? 1,
        };

        const colorize = (s: string): string =>
          ctx.style.styled(borderToken, s);
        const bgFill = makeBgFill(options.bgToken, ctx);
        const resolvedFill = resolveFillChar(options.fillChar);
        const overflow = resolveOverflowBehavior(
          options.overflow,
          ctx.resolveBCSS({
            type: 'Box',
            id: options.id,
            classes: options.class?.split(' '),
          }),
        );

        return drawBox(
          safeContent,
          colorize,
          padding,
          options.width,
          bgFill,
          resolvedFill,
          options.title,
          overflow,
        );
      },
    },
    options,
  );
}

/** Configuration for {@link headerBox}, extending {@link BoxOptions} with label support. */
export interface HeaderBoxOptions extends BoxOptions {
  /** Optional detail text displayed after the label in a muted style. */
  detail?: string;
  /** Theme token applied to the label text. */
  labelToken?: TokenValue;
}

/**
 * Render a labeled box with an optional detail line.
 *
 * In visual modes the label is styled with `options.labelToken` (defaults to
 * the primary semantic token) and wrapped in a {@link box}. Pipe mode returns
 * plain text; accessible mode uses a colon separator.
 *
 * @param label - Primary heading text.
 * @param options - Header box configuration.
 * @returns The rendered header box string.
 */
export function headerBox(
  label: string | null | undefined,
  options: HeaderBoxOptions = {},
): string {
  const ctx = resolveCtx(options.ctx);
  const detail = options.detail ?? '';
  const safeLabel = label ?? '';

  return renderByMode(
    ctx.mode,
    {
      pipe: () =>
        safeLabel && detail ? `${safeLabel}  ${detail}` : safeLabel || detail,
      accessible: () =>
        safeLabel && detail ? `${safeLabel}: ${detail}` : safeLabel || detail,
      interactive: () => {
        const labelToken = options.labelToken ?? ctx.semantic('primary');
        const content =
          safeLabel && detail
            ? ctx.style.styled(labelToken, safeLabel) +
              ctx.style.styled(ctx.semantic('muted'), `  ${detail}`)
            : safeLabel
              ? ctx.style.styled(labelToken, safeLabel)
              : detail
                ? ctx.style.styled(ctx.semantic('muted'), detail)
                : '';

        return box(content, options);
      },
    },
    options,
  );
}

/** Resolve a single-width fill character, falling back to a space. */
export { resolveFillChar } from './box-fill.js';
