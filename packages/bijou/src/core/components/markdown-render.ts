/**
 * Block-level renderer for parsed markdown elements.
 *
 * Handles mode-specific rendering (interactive, pipe, accessible) for each
 * block type and trims trailing blanks.
 */

import type { BijouContext } from '../../ports/context.js';
import { graphemeWidth, stripAnsi } from '../text/grapheme.js';
import type { BlockType } from './markdown-parse.js';
import { parseInline, wordWrap } from './markdown-parse.js';
import { separator } from './separator.js';
import { table } from './table.js';
import { renderByMode } from '../mode-render.js';

/**
 * Render an array of parsed block elements into a final terminal string.
 *
 * Handles mode-specific rendering for each block type and trims trailing blanks.
 *
 * @param blocks - Parsed block-level elements.
 * @param ctx - Bijou context for styling and mode.
 * @param width - Column width for word wrapping.
 * @returns The fully rendered markdown string.
 */
export function renderBlocks(
  blocks: BlockType[],
  ctx: BijouContext,
  width: number,
): string {
  const mode = ctx.mode;
  // `static` mode intentionally falls through to styled rendering (same as
  // `interactive`). Only `pipe` and `accessible` get special treatment.
  const lines: string[] = [];

  for (const block of blocks) {
    switch (block.type) {
      case 'blank':
        lines.push('');
        break;

      case 'heading': {
        const text = parseInline(block.text, ctx);
        const headingLine = renderByMode(ctx.mode, {
          accessible: () => `Heading level ${block.level}: ${text}`,
          pipe: () => '#'.repeat(block.level) + ' ' + text,
          interactive: () => {
            const styled = ctx.style.bold(text);
            return block.level === 1
              ? ctx.style.styled(ctx.border('primary'), styled)
              : styled;
          },
        }, block);
        lines.push(headingLine, '');
        break;
      }

      case 'paragraph': {
        // Known limitation: wordWrap runs on raw markdown source before
        // parseInline, so invisible markers like **bold** and [link](url)
        // consume wrap width. This can cause premature line breaks when
        // markdown-heavy text is near the wrap boundary. Fixing this
        // requires strip-for-measurement then wrap-raw then parse-after,
        // which is complex due to cross-word-boundary formatting spans.
        const wrapped = wordWrap(block.text, width);
        lines.push(...wrapped.map(line => parseInline(line, ctx)));
        lines.push('');
        break;
      }

      case 'bullet-list': {
        for (const item of block.items) {
          const bullet = mode === 'pipe' ? '- ' : '  \u2022 ';
          const indentWidth = width - bullet.length;
          const wrapped = wordWrap(item, indentWidth > 0 ? indentWidth : width);
          lines.push(bullet + parseInline(wrapped[0]!, ctx));
          for (let i = 1; i < wrapped.length; i++) {
            lines.push(' '.repeat(bullet.length) + parseInline(wrapped[i]!, ctx));
          }
        }
        lines.push('');
        break;
      }

      case 'numbered-list': {
        // Pre-compute max prefix width so all continuation lines align
        const lastNum = block.items.length;
        const maxPrefix = mode === 'pipe' ? `${lastNum}. ` : `  ${lastNum}. `;
        const uniformIndent = maxPrefix.length;
        for (let n = 0; n < block.items.length; n++) {
          const prefix = mode === 'pipe' ? `${n + 1}. ` : `  ${n + 1}. `;
          const paddedPrefix = prefix.padEnd(uniformIndent);
          const indentWidth = width - uniformIndent;
          const wrapped = wordWrap(block.items[n]!, indentWidth > 0 ? indentWidth : width);
          lines.push(paddedPrefix + parseInline(wrapped[0]!, ctx));
          for (let i = 1; i < wrapped.length; i++) {
            lines.push(' '.repeat(uniformIndent) + parseInline(wrapped[i]!, ctx));
          }
        }
        lines.push('');
        break;
      }

      case 'table': {
        const headers = block.headers.map((header) => parseInline(header, ctx));
        const rows = block.rows.map((row) => row.map((cell) => parseInline(cell, ctx)));
        const fittedWidths = fitMarkdownTableWidths(headers, rows, width);
        lines.push(table({
          columns: headers.map((header, index) => ({
            header,
            width: fittedWidths[index],
          })),
          rows,
          ctx,
        }));
        lines.push('');
        break;
      }

      case 'code-block': {
        const cbLines = renderByMode(ctx.mode, {
          pipe: () => ['```' + block.lang, ...block.lines, '```'],
          accessible: () => ['```' + block.lang, ...block.lines, '```'],
          interactive: () => block.lines.map(cl => ctx.style.styled(ctx.semantic('muted'), '  ' + cl)),
        }, block);
        lines.push(...cbLines, '');
        break;
      }

      case 'blockquote': {
        for (const ql of block.lines) {
          const inlined = parseInline(ql, ctx);
          const bqLine = renderByMode(ctx.mode, {
            pipe: () => '> ' + inlined,
            accessible: () => '> ' + inlined,
            interactive: () => {
              const prefix = ctx.style.styled(ctx.border('muted'), '\u2502 ');
              return prefix + ctx.style.styled(ctx.semantic('muted'), inlined);
            },
          }, block);
          lines.push(bqLine);
        }
        lines.push('');
        break;
      }

      case 'hr': {
        lines.push(separator({ width, ctx }));
        lines.push('');
        break;
      }
    }
  }

  // Trim trailing blank lines
  while (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop();
  }

  return lines.join('\n');
}

function fitMarkdownTableWidths(
  headers: readonly string[],
  rows: readonly (readonly string[])[],
  width: number,
): number[] {
  const columnCount = headers.length;
  if (columnCount === 0) return [];

  const desired = headers.map((header, index) => {
    let max = visibleTextWidth(header);
    for (const row of rows) {
      max = Math.max(max, visibleTextWidth(row[index] ?? ''));
    }
    return Math.max(1, max);
  });

  const borderOverhead = columnCount * 3 + 1;
  const availableWidth = Math.max(columnCount, width - borderOverhead);
  const fitted = [...desired];

  while (fitted.reduce((sum, columnWidth) => sum + columnWidth, 0) > availableWidth) {
    let widestIndex = -1;
    let widestWidth = -1;
    for (let index = 0; index < fitted.length; index++) {
      if (fitted[index]! > 1 && fitted[index]! > widestWidth) {
        widestIndex = index;
        widestWidth = fitted[index]!;
      }
    }
    if (widestIndex < 0) break;
    fitted[widestIndex]!--;
  }

  return fitted;
}

function visibleTextWidth(value: string): number {
  return graphemeWidth(stripAnsi(value));
}
