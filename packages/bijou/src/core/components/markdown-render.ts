import type { BijouContext } from '../../ports/context.js';
import type { BlockType } from './markdown-parse.js';
import { parseInline } from './markdown-parse.js';
import { separator } from './separator.js';
import { table } from './table.js';
import { renderByMode } from '../mode-render.js';
import { fitMarkdownTableWidths } from './markdown-table-widths.js';
import { wrapInlineMarkdown } from './markdown-inline-wrap.js';

export function renderBlocks(
  blocks: BlockType[],
  ctx: BijouContext,
  width: number,
): string {
  const mode = ctx.mode;
  const lines: string[] = [];

  for (const block of blocks) {
    switch (block.type) {
      case 'blank':
        lines.push('');
        break;

      case 'heading': {
        const text = parseInline(block.text, ctx);
        const headingLine = renderByMode(ctx.mode, {
          accessible: () => `Heading level ${String(block.level)}: ${text}`,
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
        const wrapped = wrapInlineMarkdown(block.text, width, ctx);
        lines.push(...wrapped);
        lines.push('');
        break;
      }

      case 'bullet-list': {
        for (const item of block.items) {
          const bullet = mode === 'pipe' ? '- ' : '  \u2022 ';
          const indentWidth = width - bullet.length;
          const wrapped = wrapInlineMarkdown(item, indentWidth > 0 ? indentWidth : width, ctx);
          const [first = '', ...rest] = wrapped;
          lines.push(bullet + first);
          for (const line of rest) {
            lines.push(' '.repeat(bullet.length) + line);
          }
        }
        lines.push('');
        break;
      }

      case 'numbered-list': {
        // Pre-compute max prefix width so all continuation lines align
        const lastNum = block.items.length;
        const maxPrefix = mode === 'pipe' ? `${String(lastNum)}. ` : `  ${String(lastNum)}. `;
        const uniformIndent = maxPrefix.length;
        for (const [n, item] of block.items.entries()) {
          const itemNumber = String(n + 1);
          const prefix = mode === 'pipe' ? `${itemNumber}. ` : `  ${itemNumber}. `;
          const paddedPrefix = prefix.padEnd(uniformIndent);
          const indentWidth = width - uniformIndent;
          const wrapped = wrapInlineMarkdown(item, indentWidth > 0 ? indentWidth : width, ctx);
          const [first = '', ...rest] = wrapped;
          lines.push(paddedPrefix + first);
          for (const line of rest) {
            lines.push(' '.repeat(uniformIndent) + line);
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
