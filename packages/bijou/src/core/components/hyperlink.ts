import type { BijouContext } from '../../ports/context.js';
import { resolveSafeCtx as resolveCtx } from '../resolve-ctx.js';

/** Configuration options for the {@link hyperlink} component. */
export interface HyperlinkOptions {
  /** Fallback format when OSC 8 links are unavailable. Defaults to `'both'`. */
  readonly fallback?: 'url' | 'text' | 'both';
  /** Bijou context for rendering mode and theme resolution. */
  readonly ctx?: BijouContext;
}

/**
 * Render a clickable terminal hyperlink using OSC 8 escape sequences.
 *
 * Adapts output by mode:
 * - `interactive`/`static`: OSC 8 clickable link (`\x1b]8;;url\x1b\\text\x1b]8;;\x1b\\`).
 * - `pipe`/no context: configurable fallback format.
 * - `accessible`: `text (url)` format for screen readers.
 *
 * @param text - Display text for the link.
 * @param url - Target URL.
 * @param options - Rendering options including fallback format and context.
 * @returns The formatted hyperlink string.
 */
export function hyperlink(text: string, url: string, options?: HyperlinkOptions): string {
  const ctx = resolveCtx(options?.ctx);
  const fallback = options?.fallback ?? 'both';

  // No context → use fallback format
  if (!ctx) return formatFallback(text, url, fallback);

  const mode = ctx.mode;

  // Interactive/static: OSC 8 clickable link
  if (mode === 'interactive' || mode === 'static') {
    return `\x1b]8;;${url}\x1b\\${text}\x1b]8;;\x1b\\`;
  }

  // Pipe: use fallback format
  if (mode === 'pipe') return formatFallback(text, url, fallback);

  // Accessible: always text (url) for screen readers
  if (mode === 'accessible') return `${text} (${url})`;

  return formatFallback(text, url, fallback);
}

/**
 * Format a link using the specified fallback strategy.
 *
 * @param text - Display text.
 * @param url - Target URL.
 * @param fallback - Which parts to include: `'url'`, `'text'`, or `'both'`.
 * @returns The formatted fallback string.
 */
function formatFallback(text: string, url: string, fallback: 'url' | 'text' | 'both'): string {
  switch (fallback) {
    case 'url': return url;
    case 'text': return text;
    case 'both': return `${text} (${url})`;
  }
}
