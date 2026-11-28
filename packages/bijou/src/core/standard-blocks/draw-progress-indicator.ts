import { progressBar } from '../components/progress.js';
import { createSurface, type Surface } from '../../ports/surface.js';
import { graphemeWidth, sanitizePlainTerminalText } from '../text/index.js';
import type { StandardDrawInput } from './draw-input.js';
import { flow, sectionAtoms, textAtoms } from './draw-status-flow.js';
import { componentRow, findSection, hasSlot, stackRows, textRow, visualContext } from './draw-status-shared.js';
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

/**
 * The label, wrapped, with `value/total` at the end of its first row. An
 * amount wider than half the row moves to a row of its own.
 */
function headingRows(label: RenderSection | undefined, amount: string, width: number): Surface {
  const amountWidth = graphemeWidth(amount);
  const beside = amountWidth > 0 && amountWidth * 2 <= width;
  const labelWidth = beside ? width - amountWidth - 1 : width;
  const labelBlock = flow(sectionAtoms(label, labelWidth), labelWidth);
  if (!beside) {
    return amountWidth === 0 ? labelBlock : stackRows([labelBlock, flow(textAtoms(amount, width), width)], width);
  }
  const heading = createSurface(width, labelBlock.height);
  heading.blit(labelBlock, 0, 0);
  heading.blit(textRow(amount, amountWidth), width - amountWidth, 0);
  return heading;
}

/**
 * Draws `ProgressIndicatorBlock` as the label with `value/total` above a
 * progress bar whose filled length follows `percent`.
 */
function drawProgressIndicator(input: StandardDrawInput): Surface {
  const width = input.bounds.width;
  const value = findSection(input.sections, 'value');
  const total = findSection(input.sections, 'total');
  const amount = hasSlot(value)
    ? sanitizePlainTerminalText(hasSlot(total) ? `${value.content}/${total.content}` : value.content)
    : '';
  const percent = findSection(input.sections, 'percent');
  const bar = percent?.present === true
    ? drawBar(parsePercent(percent.content), width)
    : flow(sectionAtoms(percent, width), width);
  return stackRows([headingRows(findSection(input.sections, 'label'), amount, width), bar], width);
}

export { drawProgressIndicator };
