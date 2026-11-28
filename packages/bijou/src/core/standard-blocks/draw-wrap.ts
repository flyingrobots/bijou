import { graphemeClusterWidth, sanitizePlainTerminalText, segmentGraphemes } from '../text/index.js';

/** One run of text in a drawn row, with optional cell modifiers. */
export interface DrawSpan {
  readonly text: string;
  readonly modifiers?: readonly string[];
}

/** One grapheme of a row, with the span it came from. */
export interface DrawCell {
  readonly grapheme: string;
  readonly width: number;
  readonly span: number;
  readonly modifiers: readonly string[] | undefined;
}

/** A wrapped line: its cells in reading (logical) order. */
export type WrappedLine = readonly DrawCell[];

function cellWidth(grapheme: string): number {
  return Math.max(1, graphemeClusterWidth(grapheme));
}

/** The sanitized graphemes of `text`, for width measurement and cell writes. */
export function graphemesOf(text: string): string[] {
  return segmentGraphemes(sanitizePlainTerminalText(text));
}

/** Display width of `text` after terminal-text sanitizing. */
export function textWidth(text: string): number {
  return graphemesOf(text).reduce((sum, grapheme) => sum + cellWidth(grapheme), 0);
}

function cellsOf(spans: readonly DrawSpan[]): DrawCell[] {
  return spans.flatMap((part, span) => graphemesOf(part.text).map((grapheme) => ({
    grapheme, width: cellWidth(grapheme), span, modifiers: part.modifiers,
  })));
}

function widthOf(cells: readonly DrawCell[]): number {
  return cells.reduce((sum, cell) => sum + cell.width, 0);
}

/** Splits cells into words (runs of non-space cells) and the gaps before them. */
function words(cells: readonly DrawCell[]): { gap: DrawCell[]; word: DrawCell[] }[] {
  const result: { gap: DrawCell[]; word: DrawCell[] }[] = [];
  let gap: DrawCell[] = [];
  let word: DrawCell[] = [];
  for (const cell of cells) {
    if (cell.grapheme.trim() === '') {
      if (word.length > 0) {
        result.push({ gap, word });
        gap = [];
        word = [];
      }
      gap.push(cell);
    } else {
      word.push(cell);
    }
  }
  if (word.length > 0) result.push({ gap, word });
  return result;
}

/** Cuts a word wider than `width` into pieces that each fit. */
function hardBreak(word: readonly DrawCell[], width: number): DrawCell[][] {
  const pieces: DrawCell[][] = [[]];
  for (const cell of word) {
    const last = pieces[pieces.length - 1] ?? [];
    if (last.length > 0 && widthOf(last) + cell.width > width) pieces.push([cell]);
    else last.push(cell);
  }
  return pieces;
}

/**
 * Wraps `spans` to lines at most `width` columns wide, breaking between words
 * and hard-breaking a word longer than a line. A row that fits stays as it is,
 * spaces included, so aligned rows keep their alignment. No text is dropped.
 */
export function wrapSpans(spans: readonly DrawSpan[], width: number): WrappedLine[] {
  const cells = cellsOf(spans);
  if (widthOf(cells) <= width) return [cells];
  const lines: DrawCell[][] = [];
  let line: DrawCell[] = [];
  for (const { gap, word } of words(cells)) {
    const joined = line.length === 0 ? word : [...line, ...gap, ...word];
    if (widthOf(joined) <= width) {
      line = joined;
      continue;
    }
    if (line.length > 0) lines.push(line);
    const pieces = hardBreak(word, width);
    lines.push(...pieces.slice(0, -1));
    line = pieces[pieces.length - 1] ?? [];
  }
  if (line.length > 0 || lines.length === 0) lines.push(line);
  return lines;
}
