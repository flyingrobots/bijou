/**
 * Block-level and inline markdown parsing, plus word wrapping.
 *
 * Two-pass parser: block-level (line-by-line), then inline within each block.
 * Reuses `hyperlink()` for link rendering in styled mode.
 */

import type { BijouContext } from '../../ports/context.js';
import { hyperlink } from './hyperlink.js';
import { graphemeWidth } from '../text/grapheme.js';

// ── Types ──────────────────────────────────────────────────────────

/**
 * Discriminated union of parsed block-level markdown elements.
 *
 * Each variant carries the data needed for rendering that block type.
 */
export type BlockType =
  | { type: 'heading'; level: number; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'bullet-list'; items: string[] }
  | { type: 'numbered-list'; items: string[] }
  | { type: 'code-block'; lang: string; lines: string[] }
  | { type: 'blockquote'; lines: string[] }
  | { type: 'hr' }
  | { type: 'blank' };

// ── Block-level parser ─────────────────────────────────────────────

/**
 * Parse a markdown source string into an array of block-level elements.
 *
 * Recognizes fenced code blocks, horizontal rules, headings, blockquotes,
 * bullet lists, numbered lists, and paragraphs.
 *
 * @param source - Raw markdown source text.
 * @returns Array of parsed block elements.
 */
export function parseBlocks(source: string): BlockType[] {
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
      while (i < lines.length && lines[i]!.trimStart().startsWith('>')) {
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

/**
 * Test whether a line begins a new block-level element.
 *
 * Used by the paragraph collector to determine when to stop accumulating lines.
 *
 * @param line - The line to test.
 * @returns `true` if the line starts a code fence, heading, HR, blockquote, or list.
 */
function isBlockStart(line: string): boolean {
  if (line.trimStart().startsWith('```')) return true;
  if (/^(#{1,4})\s+/.test(line)) return true;
  if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line.trim())) return true;
  if (line.trimStart().startsWith('>')) return true;
  if (/^\s*[-*]\s+/.test(line)) return true;
  if (/^\s*\d+\.\s+/.test(line)) return true;
  return false;
}

// ── Inline parser ──────────────────────────────────────────────────

/**
 * Parse and render inline markdown syntax within a text fragment.
 *
 * Dispatches to mode-specific handlers for styled, plain, or accessible output.
 *
 * @param text - The inline text to parse.
 * @param ctx - Bijou context for styling.
 * @param mode - Current rendering mode.
 * @returns The rendered inline text.
 */
export function parseInline(text: string, ctx: BijouContext, mode: string): string {
  if (mode === 'accessible') return parseInlineAccessible(text, ctx);
  if (mode === 'pipe') return parseInlinePlain(text);
  return parseInlineStyled(text, ctx);
}

/**
 * Render inline markdown with terminal styling (interactive/static mode).
 *
 * Processes links, code spans, bold, and italic with theme-based colors.
 *
 * @param text - The inline text to parse.
 * @param ctx - Bijou context for styling.
 * @returns The styled inline text.
 */
function parseInlineStyled(text: string, ctx: BijouContext): string {
  let result = text;

  // Links: [text](url)
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, linkText: string, url: string) => {
    return hyperlink(linkText, url, { ctx });
  });

  // Code spans: extract and replace with placeholders to isolate from bold/italic
  const codeSpans: string[] = [];
  result = result.replace(/`([^`]+)`/g, (_m, code: string) => {
    const idx = codeSpans.length;
    codeSpans.push(ctx.style.styled(ctx.theme.theme.semantic.warning, code));
    return `\x00CODE${idx}\x00`;
  });

  // Bold: **text**
  result = result.replace(/\*\*(.+?)\*\*/g, (_m, bold: string) => {
    return ctx.style.bold(bold);
  });

  // Italic: *text* (but not inside **)
  result = result.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, (_m, italic: string) => {
    return ctx.style.styled(ctx.theme.theme.semantic.muted, italic);
  });

  // Restore code spans
  result = result.replace(/\x00CODE(\d+)\x00/g, (_m, idx: string) => codeSpans[Number(idx)]!);

  return result;
}

/**
 * Strip inline markdown syntax to plain text (pipe mode).
 *
 * Converts links to `text (url)` format and removes formatting markers.
 *
 * @param text - The inline text to parse.
 * @returns The plain-text inline text.
 */
function parseInlinePlain(text: string): string {
  let result = text;

  // Links: [text](url) → text (url)
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');

  // Code: extract and replace with placeholders to isolate from bold/italic
  const codeSpans: string[] = [];
  result = result.replace(/`([^`]+)`/g, (_m, code: string) => {
    const idx = codeSpans.length;
    codeSpans.push(code);
    return `\x00CODE${idx}\x00`;
  });

  // Bold: **text** → text
  result = result.replace(/\*\*(.+?)\*\*/g, '$1');

  // Italic: *text* → text
  result = result.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '$1');

  // Restore code spans
  result = result.replace(/\x00CODE(\d+)\x00/g, (_m, idx: string) => codeSpans[Number(idx)]!);

  return result;
}

/**
 * Parse inline markdown for screen-reader-friendly output (accessible mode).
 *
 * Prefixes links with `Link:` and strips formatting markers.
 *
 * @param text - The inline text to parse.
 * @param _ctx - Bijou context (unused, kept for signature consistency).
 * @returns The accessible inline text.
 */
function parseInlineAccessible(text: string, _ctx: BijouContext): string {
  let result = text;

  // Links: [text](url) → Link: text (url)
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, 'Link: $1 ($2)');

  // Code: extract and replace with placeholders to isolate from bold/italic
  const codeSpans: string[] = [];
  result = result.replace(/`([^`]+)`/g, (_m, code: string) => {
    const idx = codeSpans.length;
    codeSpans.push(code);
    return `\x00CODE${idx}\x00`;
  });

  // Bold: **text** → text
  result = result.replace(/\*\*(.+?)\*\*/g, '$1');

  // Italic: *text* → text
  result = result.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '$1');

  // Restore code spans
  result = result.replace(/\x00CODE(\d+)\x00/g, (_m, idx: string) => codeSpans[Number(idx)]!);

  return result;
}

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
