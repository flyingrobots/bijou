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
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'code-block'; lang: string; lines: string[] }
  | { type: 'blockquote'; lines: string[] }
  | { type: 'hr' }
  | { type: 'blank' };

function parseTableRow(line: string): string[] | null {
  const trimmed = line.trim();
  if (!trimmed.includes('|')) return null;

  const rawCells: string[] = [];
  let current = '';

  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i] ?? '';
    if (char === '\\' && trimmed[i + 1] === '|') {
      current += '|';
      i++;
      continue;
    }
    if (char === '|') {
      rawCells.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  rawCells.push(current);

  let cells = rawCells;
  if (trimmed.startsWith('|')) cells = cells.slice(1);
  if (trimmed.endsWith('|')) cells = cells.slice(0, -1);

  const normalized = cells.map((cell) => cell.trim());
  return normalized.length > 0 ? normalized : null;
}

function isTableSeparatorRow(line: string, expectedColumns: number): boolean {
  const cells = parseTableRow(line);
  if (cells?.length !== expectedColumns) return false;
  return cells.every((cell) => /^:?-{3,}:?$/.test(cell.replace(/\s+/g, '')));
}

function normalizeTableCells(cells: string[], expectedColumns: number): string[] {
  if (cells.length === expectedColumns) return cells;
  if (cells.length > expectedColumns) return cells.slice(0, expectedColumns);
  return [...cells, ...Array.from({ length: expectedColumns - cells.length }, () => '')];
}

function isTableStart(line: string, nextLine?: string): boolean {
  const headerCells = parseTableRow(line);
  return Boolean(headerCells && nextLine && isTableSeparatorRow(nextLine, headerCells.length));
}

/**
 * Test whether a line begins a new block-level element.
 *
 * Used by the paragraph collector to determine when to stop accumulating lines.
 *
 * @param line - The line to test.
 * @returns `true` if the line starts a code fence, heading, HR, blockquote, or list.
 */
function isBlockStart(line: string, nextLine?: string): boolean {
  if (line.trimStart().startsWith('```')) return true;
  if (/^(#{1,4})\s+/.test(line)) return true;
  if (/^([-*_]\s*){3,}$/.test(line.trim())) return true;
  if (line.trimStart().startsWith('>')) return true;
  if (/^\s*[-*]\s+/.test(line)) return true;
  if (/^\s*\d+\.\s+/.test(line)) return true;
  if (isTableStart(line, nextLine)) return true;
  return false;
}

export { isBlockStart, isTableSeparatorRow, normalizeTableCells, parseTableRow };
