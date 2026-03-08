import type { BijouContext } from '../../ports/context.js';
import { resolveCtx } from '../resolve-ctx.js';
import { renderByMode } from '../mode-render.js';
import { clipToWidth } from '../text/clip.js';
import { graphemeWidth } from '../text/grapheme.js';

/** Configuration for content constraint rendering. */
export interface ConstrainOptions {
  /** Maximum visible width in terminal columns. Lines exceeding this are clipped. */
  maxWidth?: number;
  /** Maximum number of visible lines. When truncating, the last visible line is replaced with the ellipsis indicator. */
  maxHeight?: number;
  /** Ellipsis string appended when content is clipped. Defaults to `"…"`. */
  ellipsis?: string;
  /** Bijou context for I/O, styling, and mode detection. */
  ctx?: BijouContext;
}

/**
 * Constrain content to maximum width and/or height.
 *
 * In interactive/static modes, applies `clipToWidth()` per line for width
 * and truncates the line array for height. When content is clipped, an
 * ellipsis is appended (width: end of clipped line; height: replaces last
 * visible line).
 *
 * In pipe/accessible modes, content passes through unchanged.
 *
 * @param content - Multiline string to constrain.
 * @param options - Constraint configuration.
 * @returns The constrained string.
 */
export function constrain(content: string, options: ConstrainOptions = {}): string {
  const ctx = resolveCtx(options.ctx);
  const safeContent = content ?? '';

  return renderByMode(ctx.mode, {
    pipe: () => safeContent,
    accessible: () => safeContent,
    interactive: () => applyConstraints(safeContent, options),
  }, options);
}

/** Apply width and height constraints to content. */
function applyConstraints(content: string, options: ConstrainOptions): string {
  const ellipsis = options.ellipsis ?? '…';
  let lines = content.split('\n');

  // Apply width constraint
  if (options.maxWidth != null && options.maxWidth >= 0) {
    const maxW = Math.floor(options.maxWidth);
    if (maxW === 0) return '';
    lines = lines.map((line) => {
      const clipped = clipToWidth(line, maxW);
      if (graphemeWidth(clipped) < graphemeWidth(line)) {
        // Re-clip to make room for ellipsis
        const ellipsisWidth = graphemeWidth(ellipsis);
        if (maxW > ellipsisWidth) {
          return clipToWidth(line, maxW - ellipsisWidth) + ellipsis;
        }
        return clipToWidth(ellipsis, maxW);
      }
      return clipped;
    });
  }

  // Apply height constraint
  if (options.maxHeight != null && options.maxHeight >= 0 && lines.length > options.maxHeight) {
    const maxH = Math.floor(options.maxHeight);
    if (maxH === 0) return '';
    lines = lines.slice(0, maxH);
    // Respect width constraint on the ellipsis line
    if (options.maxWidth != null && options.maxWidth > 0 && graphemeWidth(ellipsis) > options.maxWidth) {
      lines[maxH - 1] = clipToWidth(ellipsis, options.maxWidth);
    } else {
      lines[maxH - 1] = ellipsis;
    }
  }

  return lines.join('\n');
}
