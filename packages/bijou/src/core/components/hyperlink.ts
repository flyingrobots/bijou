import type { BijouContext } from '../../ports/context.js';
import { getDefaultContext } from '../../context.js';

export interface HyperlinkOptions {
  readonly fallback?: 'url' | 'text' | 'both';  // default: 'both'
  readonly ctx?: BijouContext;
}

function resolveCtx(ctx?: BijouContext): BijouContext | undefined {
  if (ctx) return ctx;
  try {
    return getDefaultContext();
  } catch {
    return undefined;
  }
}

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

function formatFallback(text: string, url: string, fallback: 'url' | 'text' | 'both'): string {
  switch (fallback) {
    case 'url': return url;
    case 'text': return text;
    case 'both': return `${text} (${url})`;
  }
}
