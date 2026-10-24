import { stripAnsi, type BijouContext } from '@flyingrobots/bijou';
import { parseBlocks, parseInline, type BlockType } from '../../packages/bijou/src/core/components/markdown-parse.js';
import { renderBlocks } from '../../packages/bijou/src/core/components/markdown-render.js';
import type { RasterFont } from '../../packages/bijou-tui/src/index.js';
import { MarkdownStyles, isTextElement, type TextElement } from './markdown-styles.js';
import { renderRasterText } from './render-text.js';

export interface MarkdownFontOptions {
  readonly width: number;
  readonly raster: boolean;
  readonly fontForText: (text: string, element: TextElement) => RasterFont | undefined;
  readonly styles?: MarkdownStyles;
}

export interface MarkdownPart {
  readonly text: string;
  readonly raster: boolean;
}

export function renderMarkdownFont(source: string, ctx: BijouContext, options: MarkdownFontOptions): string {
  return renderMarkdownParts(source, ctx, options).map((part) => part.text).join('\n\n').trimEnd();
}

/** Reuse Bijou's block parser so fenced examples of H1 syntax remain code. */
export function renderMarkdownParts(source: string, ctx: BijouContext, options: MarkdownFontOptions): readonly MarkdownPart[] {
  if (!Number.isInteger(options.width) || options.width < 1 || options.width > 240) {
    throw new RangeError('Document width must be between 1 and 240 columns.');
  }
  const normalized = source.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  const blocks = parseBlocks(normalized);
  if (!options.raster || ctx.mode === 'accessible') return [{ text: renderBlocks(blocks, ctx, options.width), raster: false }];
  const styles = options.styles ?? new MarkdownStyles();
  let cells = 0;
  const charge = (count: number): void => {
    cells += count;
    if (cells > 1_048_576) throw new Error('Raster document exceeds the 1048576-cell output budget. Reduce font sizes or document length.');
  };
  const chunks: MarkdownPart[] = [];
  let pending: BlockType[] = [];
  const flush = (): void => {
    const output = renderBlocks(pending, ctx, options.width);
    if (output.trim() !== '') chunks.push({ text: output.replace(/^\n+|\n+$/gu, ''), raster: false });
    pending = [];
  };
  for (const block of blocks) {
    const element = textElement(block);
    if (element !== undefined && (block.type === 'heading' || block.type === 'paragraph')
      && styles.for(element).font !== 'terminal' && options.width >= 20) {
      const content = block.type === 'heading' ? block.text.replace(/\s+#+\s*$/, '') : block.text;
      const text = stripAnsi(parseInline(content, ctx)).replace(/\s+/gu, ' ').trim();
      const font = block.type === 'heading' && text.length > 256 ? undefined : options.fontForText(text, element);
      if (font !== undefined) {
        flush();
        chunks.push({ text: renderRasterText(text, font, ctx, options.width, styles.for(element).size, charge), raster: true });
        continue;
      }
    }
    pending.push(block);
  }
  flush();
  return chunks;
}

function textElement(block: BlockType): TextElement | undefined {
  if (block.type === 'paragraph') return 'p';
  const tag = block.type === 'heading' ? `h${String(block.level)}` : '';
  return isTextElement(tag) ? tag : undefined;
}
