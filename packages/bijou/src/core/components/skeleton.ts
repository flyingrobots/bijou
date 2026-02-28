import type { BijouContext } from '../../ports/context.js';
import { getDefaultContext } from '../../context.js';

/** Configuration for rendering a skeleton placeholder. */
export interface SkeletonOptions {
  /** Character width of each skeleton line (defaults to 20). */
  width?: number;
  /** Number of placeholder lines to render (defaults to 1). */
  lines?: number;
  /** Bijou context for I/O, styling, and mode detection. */
  ctx?: BijouContext;
}

/**
 * Resolve the provided context or fall back to the global default.
 *
 * @param ctx - Optional context override.
 * @returns The resolved {@link BijouContext}.
 */
function resolveCtx(ctx?: BijouContext): BijouContext {
  if (ctx) return ctx;
  return getDefaultContext();
}

/**
 * Render a skeleton loading placeholder.
 *
 * Output adapts to the current output mode:
 * - `interactive` / `static` — muted light-shade block characters (`\u2591`).
 * - `pipe` — empty string (no output).
 * - `accessible` — `"Loading..."` text.
 *
 * @param options - Skeleton configuration.
 * @returns The rendered skeleton string.
 */
export function skeleton(options: SkeletonOptions = {}): string {
  const ctx = resolveCtx(options.ctx);
  const mode = ctx.mode;

  if (mode === 'pipe') return '';
  if (mode === 'accessible') return 'Loading...';

  const width = options.width ?? 20;
  const lines = options.lines ?? 1;
  const token = ctx.theme.theme.semantic.muted;
  const line = ctx.style.styled(token, '\u2591'.repeat(width));

  return Array.from({ length: lines }, () => line).join('\n');
}
