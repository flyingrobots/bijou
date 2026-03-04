/**
 * Block-level renderer for parsed markdown elements.
 *
 * Handles mode-specific rendering (interactive, pipe, accessible) for each
 * block type and trims trailing blanks.
 */

import type { BijouContext } from '../../ports/context.js';
import type { BlockType } from './markdown-parse.js';
import { parseInline, wordWrap } from './markdown-parse.js';
import { separator } from './separator.js';

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
        const text = parseInline(block.text, ctx, mode);
        if (mode === 'accessible') {
          lines.push(`Heading level ${block.level}: ${text}`);
        } else if (mode === 'pipe') {
          lines.push('#'.repeat(block.level) + ' ' + text);
        } else {
          // Interactive: bold, h1 uses primary color
          const styled = ctx.style.bold(text);
          if (block.level === 1) {
            lines.push(ctx.style.styled(ctx.theme.theme.border.primary, styled));
          } else {
            lines.push(styled);
          }
        }
        lines.push('');
        break;
      }

      case 'paragraph': {
        const wrapped = wordWrap(block.text, width);
        lines.push(...wrapped.map(line => parseInline(line, ctx, mode)));
        lines.push('');
        break;
      }

      case 'bullet-list': {
        for (const item of block.items) {
          const bullet = mode === 'pipe' ? '- ' : '  \u2022 ';
          const indentWidth = width - bullet.length;
          const wrapped = wordWrap(item, indentWidth > 0 ? indentWidth : width);
          lines.push(bullet + parseInline(wrapped[0]!, ctx, mode));
          for (let i = 1; i < wrapped.length; i++) {
            lines.push(' '.repeat(bullet.length) + parseInline(wrapped[i]!, ctx, mode));
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
          lines.push(paddedPrefix + parseInline(wrapped[0]!, ctx, mode));
          for (let i = 1; i < wrapped.length; i++) {
            lines.push(' '.repeat(uniformIndent) + parseInline(wrapped[i]!, ctx, mode));
          }
        }
        lines.push('');
        break;
      }

      case 'code-block': {
        if (mode === 'pipe' || mode === 'accessible') {
          lines.push('```' + block.lang);
          lines.push(...block.lines);
          lines.push('```');
        } else {
          // Interactive: dim styling
          for (const codeLine of block.lines) {
            lines.push(ctx.style.styled(ctx.theme.theme.semantic.muted, '  ' + codeLine));
          }
        }
        lines.push('');
        break;
      }

      case 'blockquote': {
        for (const ql of block.lines) {
          const inlined = parseInline(ql, ctx, mode);
          if (mode === 'pipe' || mode === 'accessible') {
            lines.push('> ' + inlined);
          } else {
            const prefix = ctx.style.styled(ctx.theme.theme.border.muted, '\u2502 ');
            lines.push(prefix + ctx.style.styled(ctx.theme.theme.semantic.muted, inlined));
          }
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
