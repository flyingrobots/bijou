import { createTextSurface, type CellTextStyle } from '../components/surface-text.js';
import { sanitizePlainTerminalText } from '../text/index.js';
import { createSurface, type Surface } from '../../ports/surface.js';
import type { StandardDrawInput } from './draw-input.js';
import { ownSlotValue, slotValueText } from './render.part03.js';

/** One run of text in a drawn form row, with its cell style. */
interface FormRowPart {
  readonly text: string;
  readonly style?: CellTextStyle;
}

const BOLD: CellTextStyle = Object.freeze({ modifiers: ['bold'] });
const DIM: CellTextStyle = Object.freeze({ modifiers: ['dim'] });

/**
 * One row exactly `width` columns wide. Each part is sanitized terminal text:
 * control bytes are dropped, line breaks become spaces, and text past the
 * right edge is clipped.
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

/** The section's missing-slot text when a required slot is absent, else undefined. */
function missingText(input: StandardDrawInput, id: string): string | undefined {
  const section = input.sections.find((candidate) => candidate.id === id);
  return section !== undefined && !section.present ? section.content : undefined;
}

/**
 * The items of a list slot: each array entry as text, or the whole value as
 * one item. Blank entries and absent slots give no items.
 */
function slotItems(input: StandardDrawInput, id: string): readonly string[] {
  const raw = ownSlotValue(input.slots, id);
  const values: readonly unknown[] = Array.isArray(raw) ? raw : [raw];
  return values
    .map((value) => slotValueText(value))
    .filter((text): text is string => text !== undefined && text.trim() !== '');
}

export type { FormRowPart };
export { BOLD, DIM, formRow, missingText, slotItems, stackRows };
