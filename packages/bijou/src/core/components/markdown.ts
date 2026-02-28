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
import { getDefaultContext } from '../../context.js';
import { separator } from './separator.js';
import { hyperlink } from './hyperlink.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MarkdownOptions {
  /** Wrap width. Defaults to `ctx.runtime.columns`. */
  width?: number;
  ctx?: BijouContext;
}

type BlockType =
  | { type: 'heading'; level: number; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'bullet-list'; items: string[] }
  | { type: 'numbered-list'; items: string[] }
  | { type: 'code-block'; lang: string; lines: string[] }
  | { type: 'blockquote'; lines: string[] }
  | { type: 'hr' }
  | { type: 'blank' };

// ---------------------------------------------------------------------------
// Block-level parser
// ---------------------------------------------------------------------------

function parseBlocks(source: string): BlockType[] {
  const lines = source.split('\n');
  const blocks: BlockType[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!;

    // Blank line
    if (line.trim() === '') {
      blocks.push({ type: 'blank' });
      i++;
      continue;
    }

    // Code block (fenced)
    if (line.trimStart().startsWith('```')) {
      const lang = line.trimStart().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i]!.trimStart().startsWith('```')) {
        codeLines.push(lines[i]!);
        i++;
      }
      if (i < lines.length) i++; // skip closing ```
      blocks.push({ type: 'code-block', lang, lines: codeLines });
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line.trim())) {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({ type: 'heading', level: headingMatch[1]!.length, text: headingMatch[2]! });
      i++;
      continue;
    }

    // Blockquote
    if (line.trimStart().startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && (lines[i]!.trimStart().startsWith('>') || (lines[i]!.trim() !== '' && quoteLines.length > 0))) {
        const ql = lines[i]!;
        quoteLines.push(ql.replace(/^\s*>\s?/, ''));
        i++;
        if (i < lines.length && lines[i]!.trim() === '') break;
      }
      blocks.push({ type: 'blockquote', lines: quoteLines });
      continue;
    }

    // Bullet list
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i]!)) {
        items.push(lines[i]!.replace(/^\s*[-*]\s+/, ''));
        i++;
      }
      blocks.push({ type: 'bullet-list', items });
      continue;
    }

    // Numbered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i]!)) {
        items.push(lines[i]!.replace(/^\s*\d+\.\s+/, ''));
        i++;
      }
      blocks.push({ type: 'numbered-list', items });
      continue;
    }

    // Paragraph: collect consecutive non-special lines
    let text = line;
    i++;
    while (i < lines.length && lines[i]!.trim() !== '' && !isBlockStart(lines[i]!)) {
      text += ' ' + lines[i]!;
      i++;
    }
    blocks.push({ type: 'paragraph', text });
  }

  return blocks;
}

function isBlockStart(line: string): boolean {
  if (line.trimStart().startsWith('```')) return true;
  if (/^(#{1,4})\s+/.test(line)) return true;
  if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line.trim())) return true;
  if (line.trimStart().startsWith('>')) return true;
  if (/^\s*[-*]\s+/.test(line)) return true;
  if (/^\s*\d+\.\s+/.test(line)) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Inline parser
// ---------------------------------------------------------------------------

function parseInline(text: string, ctx: BijouContext, mode: string): string {
  if (mode === 'accessible') return parseInlineAccessible(text, ctx);
  if (mode === 'pipe') return parseInlinePlain(text);
  return parseInlineStyled(text, ctx);
}

function parseInlineStyled(text: string, ctx: BijouContext): string {
  let result = text;

  // Links: [text](url)
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, linkText: string, url: string) => {
    return hyperlink(linkText, url, { ctx });
  });

  // Bold: **text**
  result = result.replace(/\*\*([^*]+)\*\*/g, (_m, bold: string) => {
    return ctx.style.bold(bold);
  });

  // Italic: *text* (but not inside **)
  result = result.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, (_m, italic: string) => {
    return ctx.style.styled(ctx.theme.theme.semantic.muted, italic);
  });

  // Code spans: `text`
  result = result.replace(/`([^`]+)`/g, (_m, code: string) => {
    return ctx.style.styled(ctx.theme.theme.semantic.warning, code);
  });

  return result;
}

function parseInlinePlain(text: string): string {
  let result = text;

  // Links: [text](url) → text (url)
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');

  // Bold: **text** → text
  result = result.replace(/\*\*([^*]+)\*\*/g, '$1');

  // Italic: *text* → text
  result = result.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '$1');

  // Code: `text` → text
  result = result.replace(/`([^`]+)`/g, '$1');

  return result;
}

function parseInlineAccessible(text: string, _ctx: BijouContext): string {
  let result = text;

  // Links: [text](url) → Link: text (url)
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, 'Link: $1 ($2)');

  // Bold: **text** → text
  result = result.replace(/\*\*([^*]+)\*\*/g, '$1');

  // Italic: *text* → text
  result = result.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '$1');

  // Code: `text` → text
  result = result.replace(/`([^`]+)`/g, '$1');

  return result;
}

// ---------------------------------------------------------------------------
// Word wrapping
// ---------------------------------------------------------------------------

function wordWrap(text: string, width: number): string[] {
  if (width <= 0) return [text];
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if (current.length === 0) {
      current = word;
    } else if (current.length + 1 + word.length <= width) {
      current += ' ' + word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current.length > 0) lines.push(current);
  return lines.length > 0 ? lines : [''];
}

// ---------------------------------------------------------------------------
// Block renderer
// ---------------------------------------------------------------------------

function renderBlocks(
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
        for (let n = 0; n < block.items.length; n++) {
          const prefix = mode === 'pipe' ? `${n + 1}. ` : `  ${n + 1}. `;
          const indentWidth = width - prefix.length;
          const wrapped = wordWrap(block.items[n]!, indentWidth > 0 ? indentWidth : width);
          lines.push(prefix + parseInline(wrapped[0]!, ctx, mode));
          for (let i = 1; i < wrapped.length; i++) {
            lines.push(' '.repeat(prefix.length) + parseInline(wrapped[i]!, ctx, mode));
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

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

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
 */
export function markdown(source: string, options?: MarkdownOptions): string {
  const ctx = options?.ctx ?? getDefaultContext();
  const width = options?.width ?? ctx.runtime.columns;

  if (source.trim() === '') return '';

  const blocks = parseBlocks(source);
  return renderBlocks(blocks, ctx, width);
}
