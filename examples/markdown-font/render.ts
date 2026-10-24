import { stripAnsi, surfaceToString, type BijouContext } from '@flyingrobots/bijou';
import { parseBlocks, parseInline, type BlockType } from '../../packages/bijou/src/core/components/markdown-parse.js';
import { renderBlocks } from '../../packages/bijou/src/core/components/markdown-render.js';
import { layoutRasterText, rasterTextSurface, type RasterFont } from '../../packages/bijou-tui/src/index.js';

export interface MarkdownFontOptions {
  readonly width: number;
  readonly raster: boolean;
  readonly fontForText: (text: string) => RasterFont | undefined;
}

/** Reuse Bijou's block parser so fenced examples of H1 syntax remain code. */
export function renderMarkdownFont(source: string, ctx: BijouContext, options: MarkdownFontOptions): string {
  if (!Number.isInteger(options.width) || options.width < 1 || options.width > 240) {
    throw new RangeError('Document width must be between 1 and 240 columns.');
  }
  const normalized = source.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  const blocks = parseBlocks(normalized);
  if (!options.raster || ctx.mode === 'accessible') return renderBlocks(blocks, ctx, options.width);
  const chunks: string[] = [];
  let pending: BlockType[] = [];
  const flush = (): void => {
    const output = renderBlocks(pending, ctx, options.width);
    if (output.trim() !== '') chunks.push(output.replace(/^\n+|\n+$/gu, ''));
    pending = [];
  };
  for (const block of blocks) {
    if (block.type === 'heading' && block.level === 1 && options.width >= 20) {
      const text = stripAnsi(parseInline(block.text.replace(/\s+#+\s*$/, ''), ctx)).replace(/\s+/gu, ' ').trim();
      const font = options.fontForText(text);
      if (font !== undefined) {
        flush();
        chunks.push(renderHeading(text, font, ctx, options.width));
        continue;
      }
    }
    pending.push(block);
  }
  flush();
  return chunks.join('\n\n').trimEnd();
}

function renderHeading(text: string, font: RasterFont, ctx: BijouContext, width: number): string {
  const lines: string[] = [];
  let line = '';
  // A six-row heading uses 24 vertical pixels and two horizontal samples per cell.
  const maxAdvance = width * 2 * font.lineHeight / 24;
  for (const word of text.split(/\s+/u)) {
    const candidate = line === '' ? word : `${line} ${word}`;
    if (line !== '' && layoutRasterText(candidate, font).width > maxAdvance) {
      lines.push(line);
      line = '';
    }
    for (const character of (line === '' ? word : ` ${word}`)) {
      if (line !== '' && layoutRasterText(line + character, font).width > maxAdvance) {
        lines.push(line);
        line = '';
      }
      line += character;
    }
  }
  if (line !== '') lines.push(line);
  return lines.map((value) => {
    const surface = rasterTextSurface(value, font, {
      columns: width, rows: 6, renderer: { kind: 'braille' },
      fg: ctx.border('primary').hex,
    });
    return surfaceToString(surface, ctx.style);
  }).join('\n');
}
