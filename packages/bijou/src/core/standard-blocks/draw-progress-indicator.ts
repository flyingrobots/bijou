import { progressBar } from '../components/progress.js';
import { createSurface, type Surface } from '../../ports/surface.js';
import type { StandardDrawInput } from './draw-input.js';
import { concatPieces, flow, inlinePiece, sectionAtoms, textAtoms } from './draw-status-flow.js';
import { componentRow, findSection, hasSlot, stackRows, visualContext } from './draw-status-shared.js';
import type { RenderSection } from './render.part01.js';

/** The percent label (`100%` at most, padded to four columns) and its gap. */
const LABEL_COLUMNS = 5;

/** The leading number of `60%`, `42.5` or `60`, clamped to 0..100; 0 when there is none. */
function parsePercent(text: string): number {
  const value = Number.parseFloat(text);
  return Number.isNaN(value) ? 0 : Math.max(0, Math.min(100, value));
}

/** `progressBar` with its percent label; the same glyphs when no visual context exists. */
function drawBar(percent: number, width: number): Surface {
  const barWidth = width - LABEL_COLUMNS;
  const ctx = visualContext();
  if (ctx !== undefined) {
    return componentRow(progressBar(percent, { ctx, width: barWidth }), width);
  }
  const filled = Math.min(barWidth, Math.max(0, Math.round((percent / 100) * barWidth)));
  const label = `${String(Math.round(percent))}%`.padStart(4);
  return componentRow(`${label} ${'█'.repeat(filled)}${'⠐'.repeat(barWidth - filled)}`, width);
}

/** `value/total` as inline pieces (`/5` when only the total is set), and as flowing atoms for a narrow row. */
function amountParts(value: RenderSection | undefined, total: RenderSection | undefined, width: number) {
  const slash = textAtoms('/', width);
  const pieces = [
    ...(hasSlot(value) ? [inlinePiece(value)] : []),
    ...(hasSlot(total) ? [...slash, inlinePiece(total)] : []),
  ];
  const atoms = [
    ...sectionAtoms(hasSlot(value) ? value : undefined, width),
    ...(hasSlot(total) ? [...slash, ...sectionAtoms(total, width)] : []),
  ];
  return { pieces, atoms };
}

/**
 * The label, wrapped, with `value/total` at the end of its first row. An
 * amount wider than half the row moves to rows of its own.
 */
function headingRows(
  label: RenderSection | undefined,
  amount: ReturnType<typeof amountParts>,
  width: number,
): Surface {
  const inline = amount.pieces.length === 0 ? undefined : concatPieces(amount.pieces);
  const beside = inline !== undefined && inline.width * 2 <= width;
  const labelWidth = beside ? width - inline.width - 1 : width;
  const labelBlock = flow(sectionAtoms(label, labelWidth), labelWidth);
  if (!beside) {
    return inline === undefined ? labelBlock : stackRows([labelBlock, flow(amount.atoms, width)], width);
  }
  const heading = createSurface(width, Math.max(labelBlock.height, inline.height));
  heading.blit(labelBlock, 0, 0);
  heading.blit(inline, width - inline.width, 0);
  return heading;
}

/** The bar for `percent`, with the slot's own text under it when it holds no number. */
function percentRows(percent: RenderSection | undefined, width: number): readonly Surface[] {
  if (percent?.present !== true) return [flow(sectionAtoms(percent, width), width)];
  const bar = drawBar(parsePercent(percent.content), width);
  return Number.isNaN(Number.parseFloat(percent.content)) ? [bar, flow(sectionAtoms(percent, width), width)] : [bar];
}

/**
 * Draws `ProgressIndicatorBlock` as the label with `value/total` above a
 * progress bar whose filled length follows `percent`.
 */
function drawProgressIndicator(input: StandardDrawInput): Surface {
  const width = input.bounds.width;
  const amount = amountParts(findSection(input.sections, 'value'), findSection(input.sections, 'total'), width);
  return stackRows([
    headingRows(findSection(input.sections, 'label'), amount, width),
    ...percentRows(findSection(input.sections, 'percent'), width),
  ], width);
}

export { drawProgressIndicator };
