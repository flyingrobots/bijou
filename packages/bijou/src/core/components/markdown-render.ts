/**
 * Block-level renderer for parsed markdown elements.
 *
 * Handles mode-specific rendering (interactive, pipe, accessible) for each
 * block type and trims trailing blanks.
 */

import type { BijouContext } from '../../ports/context.js';
import { RESET_SGR } from '../ansi.js';
import {
  ANSI_OSC8_RE,
  ANSI_SGR_RE,
  graphemeClusterWidth,
  graphemeWidth,
  segmentGraphemes,
  stripAnsi,
} from '../text/grapheme.js';
import type { BlockType } from './markdown-parse.js';
import { parseInline, wordWrap } from './markdown-parse.js';
import { separator } from './separator.js';
import { measureInteractiveTableWidth, table } from './table.js';
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
          lines.push(bullet + wrapped[0]!);
          for (let i = 1; i < wrapped.length; i++) {
            lines.push(' '.repeat(bullet.length) + wrapped[i]!);
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
          const wrapped = wrapInlineMarkdown(block.items[n]!, indentWidth > 0 ? indentWidth : width, ctx);
          lines.push(paddedPrefix + wrapped[0]!);
          for (let i = 1; i < wrapped.length; i++) {
            lines.push(' '.repeat(uniformIndent) + wrapped[i]!);
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

  const fitted = [...desired];

  while (measureInteractiveTableWidth(fitted) > width) {
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

function wrapInlineMarkdown(
  text: string,
  width: number,
  ctx: BijouContext,
): string[] {
  const rendered = parseInline(text, ctx);
  if (ctx.mode === 'interactive' || ctx.mode === 'static') {
    return wrapStyledInlineText(rendered, width);
  }
  return wordWrap(rendered, width);
}

interface VisibleRange {
  readonly start: number;
  readonly end: number;
}

interface StyledInlineToken {
  readonly kind: 'control' | 'grapheme';
  readonly raw: string;
  readonly width?: number;
}

interface StyledInlineState {
  readonly sgr: readonly string[];
  readonly osc8?: string;
}

const OSC8_CLOSE = '\x1b]8;;\x1b\\';
const INLINE_CONTROL_RE = new RegExp(`${ANSI_SGR_RE.source}|${ANSI_OSC8_RE.source}`, 'g');

function wrapStyledInlineText(text: string, width: number): string[] {
  const plain = stripAnsi(text);
  const ranges = wrapVisibleRanges(plain, width);
  return ranges.map((range) => sliceStyledVisibleRange(text, range.start, range.end));
}

function wrapVisibleRanges(text: string, width: number): VisibleRange[] {
  if (text.length === 0) return [{ start: 0, end: 0 }];
  if (width <= 0) return [{ start: 0, end: graphemeWidth(text) }];

  const words = text.split(' ');
  const ranges: VisibleRange[] = [];
  let cursor = 0;
  let lineStart = 0;
  let lineEnd = 0;
  let lineWidth = 0;

  for (let index = 0; index < words.length; index++) {
    const word = words[index]!;
    const wordStart = cursor;
    const wordWidth = graphemeWidth(word);
    const wordEnd = wordStart + wordWidth;

    if (lineWidth === 0) {
      lineStart = wordStart;
      lineEnd = wordEnd;
      lineWidth = wordWidth;
    } else if (lineWidth + 1 + wordWidth <= width) {
      lineEnd = wordEnd;
      lineWidth += 1 + wordWidth;
    } else {
      ranges.push({ start: lineStart, end: lineEnd });
      lineStart = wordStart;
      lineEnd = wordEnd;
      lineWidth = wordWidth;
    }

    cursor = wordEnd;
    if (index < words.length - 1) {
      cursor += 1;
    }
  }

  if (lineWidth > 0) {
    ranges.push({ start: lineStart, end: lineEnd });
  }

  return ranges.length > 0 ? ranges : [{ start: 0, end: 0 }];
}

function tokenizeStyledInlineText(text: string): StyledInlineToken[] {
  const tokens: StyledInlineToken[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(INLINE_CONTROL_RE)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      const raw = text.slice(lastIndex, index);
      for (const grapheme of segmentGraphemes(raw)) {
        tokens.push({
          kind: 'grapheme',
          raw: grapheme,
          width: graphemeClusterWidth(grapheme),
        });
      }
    }

    tokens.push({ kind: 'control', raw: match[0] });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) {
    const raw = text.slice(lastIndex);
    for (const grapheme of segmentGraphemes(raw)) {
      tokens.push({
        kind: 'grapheme',
        raw: grapheme,
        width: graphemeClusterWidth(grapheme),
      });
    }
  }

  return tokens;
}

function sliceStyledVisibleRange(text: string, start: number, end: number): string {
  if (end <= start) return '';

  const state: { sgr: string[]; osc8?: string } = { sgr: [] };
  const tokens = tokenizeStyledInlineText(text);
  let visible = 0;
  let collecting = false;
  let result = '';

  for (const token of tokens) {
    if (token.kind === 'control') {
      if (collecting) {
        result += token.raw;
      }
      applyStyledInlineControl(state, token.raw);
      continue;
    }

    if (visible >= end) break;

    const tokenStart = visible;
    const tokenEnd = visible + (token.width ?? 0);
    if (tokenEnd > start && tokenStart < end) {
      if (!collecting) {
        collecting = true;
        result = buildStyledInlinePrefix(state);
      }
      result += token.raw;
    }
    visible = tokenEnd;
  }

  if (!collecting) return '';
  return result + buildStyledInlineSuffix(state);
}

function applyStyledInlineControl(
  state: { sgr: string[]; osc8?: string },
  raw: string,
): void {
  if (raw.startsWith('\x1b]8;;')) {
    state.osc8 = raw === OSC8_CLOSE ? undefined : raw;
    return;
  }

  if (raw === RESET_SGR || raw === '\x1b[m') {
    state.sgr = [];
    return;
  }

  state.sgr.push(raw);
}

function buildStyledInlinePrefix(state: StyledInlineState): string {
  return `${state.osc8 ?? ''}${state.sgr.join('')}`;
}

function buildStyledInlineSuffix(state: StyledInlineState): string {
  let suffix = '';
  if (state.osc8 != null) suffix += OSC8_CLOSE;
  if (state.sgr.length > 0) suffix += RESET_SGR;
  return suffix;
}
