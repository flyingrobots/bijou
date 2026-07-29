import type { BijouContext } from '../../ports/context.js';
import { resolveSafeCtx as resolveCtx } from '../resolve-ctx.js';
import { renderByMode } from '../mode-render.js';
import {
  generateListPrefix,
  generatePipeListPrefix,
  renderEnumeratedItems,
} from './enumerated-list-format.js';

/**
 * Enumeration style for list item prefixes.
 *
 * - `'arabic'` - Decimal numbering (1., 2., 3.)
 * - `'alpha'` - Lowercase alphabetic (a., b., c.)
 * - `'roman'` - Lowercase Roman numerals (i., ii., iii.)
 * - `'bullet'` - Unicode bullet character
 * - `'dash'` - En-dash character
 * - `'none'` - No prefix
 */
export type BulletStyle =
  'arabic' | 'alpha' | 'roman' | 'bullet' | 'dash' | 'none';

/** Configuration options for the {@link enumeratedList} component. */
export interface EnumeratedListOptions {
  /** Bullet/numbering style. Defaults to `'arabic'`. */
  readonly style?: BulletStyle;
  /** Number of leading spaces for indentation. Defaults to `2`. */
  readonly indent?: number;
  /** Starting number for ordered styles. Defaults to `1`. */
  readonly start?: number;
  /** Bijou context for rendering mode and theme resolution. */
  readonly ctx?: BijouContext;
}

/**
 * Render a formatted list with configurable numbering or bullet styles.
 *
 * Supports multi-line items with continuation-line indentation aligned to the
 * first content character. Ordered styles right-align prefixes for visual consistency.
 *
 * Adapts output by mode:
 * - `accessible`: simple decimal numbering regardless of style.
 * - `pipe`: ASCII-safe prefixes (`*`, `-`).
 * - `interactive`/`static`/no context: Unicode prefixes (`\u2022`, `\u2013`).
 *
 * @param items - List item strings to render (may contain newlines).
 * @param options - Rendering options including style, indent, start, and context.
 * @returns The formatted list string, or an empty string if `items` is empty.
 */
export function enumeratedList(
  items: readonly string[],
  options?: EnumeratedListOptions,
): string {
  if (items.length === 0) return '';

  const style = options?.style ?? 'arabic';
  const indent = options?.indent ?? 2;
  const start = options?.start ?? 1;
  const ctx = resolveCtx(options?.ctx);

  const indentStr = ' '.repeat(indent);

  if (!ctx) {
    return renderEnumeratedItems(
      items,
      style,
      start,
      indent,
      indentStr,
      generateListPrefix,
    );
  }

  return renderByMode(
    ctx.mode,
    {
      accessible: () => {
        return items
          .map((item, i) => {
            const num = start + i;
            const prefix = `${String(num)}.`;
            const lines = item.split('\n');
            const firstLine = `${indentStr}${prefix} ${lines[0] ?? ''}`;
            if (lines.length === 1) return firstLine;
            const contIndent = ' '.repeat(indent + prefix.length + 1);
            return [
              firstLine,
              ...lines.slice(1).map((l) => `${contIndent}${l}`),
            ].join('\n');
          })
          .join('\n');
      },
      pipe: () =>
        renderEnumeratedItems(
          items,
          style,
          start,
          indent,
          indentStr,
          generatePipeListPrefix,
        ),
      interactive: () =>
        renderEnumeratedItems(
          items,
          style,
          start,
          indent,
          indentStr,
          generateListPrefix,
        ),
    },
    options ?? {},
  );
}
