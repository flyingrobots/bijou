import { graphemeWidth } from '../text/grapheme.js';

// ── Word wrapping ──────────────────────────────────────────────────

/**
 * Wrap text to a maximum column width, breaking on word boundaries.
 *
 * Uses grapheme-aware width measurement to handle wide characters correctly.
 *
 * @param text - The text to wrap.
 * @param width - Maximum line width in columns.
 * @returns Array of wrapped lines.
 */
export function wordWrap(text: string, width: number): string[] {
  // Non-positive widths return the text unwrapped. This is a deliberate
  // degradation — callers clamp width upstream, so this is a safety net.
  if (width <= 0) return [text];
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  let currentWidth = 0;

  for (const word of words) {
    const wordWidth = graphemeWidth(word);
    if (currentWidth === 0) {
      current = word;
      currentWidth = wordWidth;
    } else if (currentWidth + 1 + wordWidth <= width) {
      current += ' ' + word;
      currentWidth += 1 + wordWidth;
    } else {
      lines.push(current);
      current = word;
      currentWidth = wordWidth;
    }
  }
  if (currentWidth > 0) lines.push(current);
  return lines.length > 0 ? lines : [''];
}
