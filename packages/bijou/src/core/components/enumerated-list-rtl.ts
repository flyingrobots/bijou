import type { BulletStyle } from './enumerated-list.js';
import { alignEnd } from './rtl-align.js';

/**
 * Render list items for right-to-left layout: the marker keeps its text but
 * sits on the right (start) edge, followed by the indent, and every line is
 * right-aligned to the widest line. Ordered markers stay right-aligned to
 * each other.
 */
export function renderEnumeratedItemsRtl(
  items: readonly string[],
  style: BulletStyle,
  start: number,
  indent: number,
  prefix: (style: BulletStyle, index: number) => string,
): string {
  const ordered = style === 'arabic' || style === 'alpha' || style === 'roman';
  const prefixes = items.map((_, index) => prefix(style, start + index));
  const markerWidth = ordered ? Math.max(...prefixes.map((value) => value.length)) : 0;
  const indentStr = ' '.repeat(indent);

  return alignEnd(
    items.flatMap((item, index) => {
      const marker = style === 'none'
        ? ''
        : ` ${ordered ? (prefixes[index] ?? '').padStart(markerWidth) : (prefixes[index] ?? '')}`;
      return item.split('\n').map((line, n) =>
        line + (n === 0 ? marker : ' '.repeat(marker.length)) + indentStr);
    }),
  );
}
