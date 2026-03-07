/**
 * Terminal markdown renderer.
 *
 * Two-pass: block-level parse (line-by-line), then inline parse within each block.
 * Reuses existing components: `separator()` for HRs, `hyperlink()` for links.
 *
 * Supported syntax: headings (# through ####), bold, italic, code spans,
 * bullet lists, numbered lists, code blocks, horizontal rules, links,
 * blockquotes.
 */

import type { BijouContext } from '../../ports/context.js';
import { resolveCtx } from '../resolve-ctx.js';
import { parseBlocks } from './markdown-parse.js';
import { renderBlocks } from './markdown-render.js';

// ── Types ──────────────────────────────────────────────────────────

/** Configuration options for the {@link markdown} renderer. */
export interface MarkdownOptions {
  /** Wrap width in columns. Defaults to `ctx.runtime.columns`. */
  width?: number;
  /** Bijou context for rendering mode and theme resolution. */
  ctx?: BijouContext;
}

// ── Public API ─────────────────────────────────────────────────────

/**
 * Render a markdown string for terminal display.
 *
 * Supports headings, bold, italic, code spans, bullet/numbered lists,
 * code blocks, horizontal rules, links, and blockquotes.
 *
 * Mode degradation:
 * - `interactive`: full styled output with colors and Unicode
 * - `pipe`: plain text with minimal formatting
 * - `accessible`: structured text with explicit labels
 *
 * @param source - Raw markdown source text.
 * @param options - Rendering options (wrap width, context).
 * @returns The rendered terminal string.
 */
export function markdown(source: string, options?: MarkdownOptions): string {
  const safeSource = source ?? '';
  if (safeSource.trim() === '') return '';

  const ctx = resolveCtx(options?.ctx);
  const rawWidth = options?.width ?? ctx.runtime.columns;
  const width = Math.max(1, Number.isFinite(rawWidth) ? rawWidth : ctx.runtime.columns);

  const blocks = parseBlocks(safeSource);
  return renderBlocks(blocks, ctx, width);
}
