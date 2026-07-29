import { isBlockStart, isTableSeparatorRow, normalizeTableCells, parseTableRow } from './markdown-parse.part01.js';
import type { BlockType } from './markdown-parse.part01.js';

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
    const line = lines[i] ?? '';

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
      while (i < lines.length && !(lines[i] ?? '').trimStart().startsWith('```')) {
        codeLines.push(lines[i++] ?? '');
      }
      if (i < lines.length) i++; // skip closing ```
      blocks.push({ type: 'code-block', lang, lines: codeLines });
      continue;
    }

    // Horizontal rule (supports interspersed spaces: * * *, - - -, _ _ _)
    if (/^([-*_]\s*){3,}$/.test(line.trim())) {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    // Heading
    const headingMatch = /^(#{1,4})\s+(.+)$/.exec(line);
    if (headingMatch) {
      blocks.push({ type: 'heading', level: (headingMatch[1] ?? '').length, text: headingMatch[2] ?? '' });
      i++;
      continue;
    }

    // Blockquote
    if (line.trimStart().startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && (lines[i] ?? '').trimStart().startsWith('>')) {
        const ql = lines[i++] ?? '';
        quoteLines.push(ql.replace(/^\s*>\s?/, ''));
        if (i < lines.length && (lines[i] ?? '').trim() === '') break;
      }
      blocks.push({ type: 'blockquote', lines: quoteLines });
      continue;
    }

    // Bullet list
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i] ?? '')) {
        items.push((lines[i++] ?? '').replace(/^\s*[-*]\s+/, ''));
      }
      blocks.push({ type: 'bullet-list', items });
      continue;
    }

    // Numbered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i] ?? '')) {
        items.push((lines[i++] ?? '').replace(/^\s*\d+\.\s+/, ''));
      }
      blocks.push({ type: 'numbered-list', items });
      continue;
    }

    // GFM-style pipe table
    const headerCells = parseTableRow(line);
    const separatorLine = lines[i + 1];
    if (headerCells && separatorLine && isTableSeparatorRow(separatorLine, headerCells.length)) {
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length) {
        const rowLine = lines[i] ?? '';
        const rowCells = parseTableRow(rowLine);
        if (!rowCells || isTableSeparatorRow(rowLine, headerCells.length)) break;
        rows.push(normalizeTableCells(rowCells, headerCells.length));
        i++;
      }
      blocks.push({ type: 'table', headers: headerCells, rows });
      continue;
    }

    // Paragraph: collect consecutive non-special lines
    let text = line;
    i++;
    while (i < lines.length && (lines[i] ?? '').trim() !== '' && !isBlockStart(lines[i] ?? '', lines[i + 1])) {
      text += ' ' + (lines[i++] ?? '');
    }
    blocks.push({ type: 'paragraph', text });
  }

  return blocks;
}

// ── Inline parser ──────────────────────────────────────────────────

const CODE_SPAN_PLACEHOLDER_RE = /\uE000C(\d+)\uE001/gu;

export { CODE_SPAN_PLACEHOLDER_RE };
