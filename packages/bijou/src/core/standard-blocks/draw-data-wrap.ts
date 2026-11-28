import { badge, type BadgeVariant } from '../components/badge.js';
import { createTextSurface } from '../components/surface-text.js';
import { sanitizePlainTerminalText, wrapToWidth } from '../text/index.js';
import { createSurface, type Surface } from '../../ports/surface.js';

/** What a drawn data block shows for one slot or list entry: slot text, or a nested Surface kept cell by cell. */
type SlotContent = string | Surface;

/** `surface` clipped to at most `width` columns, keeping every cell's char and style. */
function clipSurface(surface: Surface, width: number): Surface {
  if (surface.width <= width) return surface;
  const clipped = createSurface(Math.max(1, width), surface.height);
  clipped.blit(surface, 0, 0);
  return clipped;
}

/** Slot text, sanitized with line breaks folded to spaces, wrapped at words to `width` (a longer word is broken). */
function wrapLines(text: string, width: number): readonly string[] {
  return wrapToWidth(sanitizePlainTerminalText(text), Math.max(1, width));
}

/**
 * `content` drawn after `prefix`, filling `width` columns: text wraps onto
 * following rows that start with `continuation` (spaces as wide as `prefix` by
 * default); a Surface is blitted beside the prefix, clipped to the columns left.
 */
function prefixedRows(prefix: string, content: SlotContent, width: number, continuation?: string): readonly Surface[] {
  const lead = continuation ?? ' '.repeat(prefix.length);
  const available = Math.max(1, width - prefix.length);
  if (typeof content !== 'string') {
    const rows = createSurface(Math.max(1, Math.min(width, prefix.length + content.width)), content.height);
    for (let y = 0; y < content.height; y += 1) rows.blit(createTextSurface(y === 0 ? prefix : lead), 0, y);
    rows.blit(clipSurface(content, available), prefix.length, 0);
    return [rows];
  }
  return wrapLines(content, available).map((line, index) => createTextSurface(`${index === 0 ? prefix : lead}${line}`));
}

/** Slot text wrapped to `width`, or a Surface clipped to it. */
function contentRows(content: SlotContent, width: number): readonly Surface[] {
  return prefixedRows('', content, width);
}

/** Slot text as one badge per wrapped line (each fits `width`), or a Surface clipped to `width`. */
function badgeRows(content: SlotContent, width: number, variant: BadgeVariant): readonly Surface[] {
  if (typeof content !== 'string') return [clipSurface(content, width)];
  return wrapLines(content, width - 2).map((line) => badge(line, { variant }));
}

export type { SlotContent };
export { badgeRows, clipSurface, contentRows, prefixedRows, wrapLines };
