import { createTextSurface, type CellTextStyle } from '../components/surface-text.js';
import { sanitizePlainTerminalText } from '../text/index.js';
import { wrapToWidth } from '../text/wrap.js';
import { createSurface, type Surface } from '../../ports/surface.js';

/** One run of text in a drawn form row, with its cell style. */
interface FormRowPart {
  readonly text: string;
  readonly style?: CellTextStyle;
}

/** What a drawer shows for a slot: text, or the Surface a nested block drew. */
type SlotVisual = string | Surface;

const BOLD: CellTextStyle = Object.freeze({ modifiers: ['bold'] });
const DIM: CellTextStyle = Object.freeze({ modifiers: ['dim'] });

/**
 * One row exactly `width` columns wide, for short fixed text such as glyphs
 * and the yes and no choices. Each part is sanitized terminal text.
 */
function formRow(parts: readonly FormRowPart[], width: number): Surface {
  const row = createSurface(width, 1);
  let x = 0;
  for (const part of parts) {
    if (x >= width) break;
    const text = createTextSurface(sanitizePlainTerminalText(part.text), part.style ?? {});
    row.blit(text, x, 0);
    x += text.width;
  }
  return row;
}

function contentLines(visual: SlotVisual, width: number, style: CellTextStyle): readonly Surface[] {
  if (typeof visual !== 'string') return [visual];
  return wrapToWidth(sanitizePlainTerminalText(visual), width).map((line) => createTextSurface(line, style));
}

/** Options for {@link slotBlock}. */
interface SlotBlockOptions {
  /** Fixed text, such as an indent and a mark, drawn on the first row only. */
  readonly prefix?: readonly FormRowPart[];
  /** The cell style for text content. A Surface keeps its own styles. */
  readonly style?: CellTextStyle;
}

/**
 * A slot's content, `width` columns wide, after an optional prefix. Text is
 * sanitized and wrapped at words, hard-breaking a word longer than the row, so
 * no word is lost. A Surface is blitted cell by cell, clipped to the width.
 */
function slotBlock(visual: SlotVisual, width: number, options: SlotBlockOptions = {}): Surface {
  const prefix = formRow(options.prefix ?? [], width);
  const prefixWidth = (options.prefix ?? [])
    .reduce((sum, part) => sum + createTextSurface(sanitizePlainTerminalText(part.text)).width, 0);
  const x = Math.min(prefixWidth, width - 1);
  const contentWidth = width - x;
  const lines = contentLines(visual, contentWidth, options.style ?? {});
  const height = Math.max(1, lines.reduce((sum, line) => sum + line.height, 0));
  const block = createSurface(width, height);
  block.blit(prefix, 0, 0);
  let y = 0;
  for (const line of lines) {
    block.blit(line, x, y, 0, 0, contentWidth, line.height);
    y += line.height;
  }
  return block;
}

/** Stacks rows of the same width top to bottom. */
function stackRows(rows: readonly Surface[], width: number): Surface {
  const height = rows.reduce((sum, row) => sum + row.height, 0);
  const stacked = createSurface(width, Math.max(1, height));
  let y = 0;
  for (const row of rows) {
    stacked.blit(row, 0, y);
    y += row.height;
  }
  return stacked;
}

export type { FormRowPart, SlotVisual };
export { BOLD, DIM, formRow, slotBlock, stackRows };
