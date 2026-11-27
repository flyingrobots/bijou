import { progressBar } from '../components/progress.js';
import { createSurface, type Surface } from '../../ports/surface.js';
import { graphemeWidth, sanitizePlainTerminalText } from '../text/index.js';
import { sectionContent, type StandardDrawInput } from './draw-input.js';
import { componentRow, hasText, stackRows, textRow, visualContext } from './draw-status-shared.js';

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

/** The label at the start of the row and `value/total` at its end. */
function headingRow(label: string, amount: string, width: number): Surface {
  const row = createSurface(width, 1);
  const amountWidth = Math.min(width, graphemeWidth(amount));
  row.blit(textRow(amount, amountWidth), width - amountWidth, 0);
  row.blit(textRow(label, Math.max(0, width - amountWidth - (amountWidth > 0 ? 1 : 0))), 0, 0);
  return row;
}

/**
 * Draws `ProgressIndicatorBlock` as the label with `value/total` above a
 * progress bar whose filled length follows `percent`.
 */
function drawProgressIndicator(input: StandardDrawInput): Surface {
  const width = input.bounds.width;
  const value = sectionContent(input.sections, 'value');
  const total = sectionContent(input.sections, 'total');
  const amount = hasText(value) ? sanitizePlainTerminalText(hasText(total) ? `${value}/${total}` : value) : '';
  const percent = input.sections.find((section) => section.id === 'percent');
  const bar = percent?.present === true
    ? drawBar(parsePercent(percent.content), width)
    : textRow(percent?.content ?? '', width);
  return stackRows([headingRow(sectionContent(input.sections, 'label') ?? '', amount, width), bar], width);
}

export { drawProgressIndicator };
