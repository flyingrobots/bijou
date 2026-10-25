import type { BijouContext } from '../../ports/context.js';
import { graphemeWidth, stripAnsi } from '../text/grapheme.js';
import { parseInline, wordWrap } from './markdown-parse.js';
import { sliceStyledVisibleRange } from './markdown-inline-slice.js';

export function wrapInlineMarkdown(
  text: string,
  width: number,
  ctx: BijouContext,
): string[] {
  const rendered = parseInline(text, ctx);
  if (ctx.mode === 'interactive' || ctx.mode === 'static') {
    return wrapStyledInlineText(rendered, width).map((line) => (
      ctx.style.styled(ctx.semantic('primary'), line)
    ));
  }
  return wordWrap(rendered, width);
}

interface VisibleRange {
  readonly start: number;
  readonly end: number;
}

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

  for (const [index, word] of words.entries()) {
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
