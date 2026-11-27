import type { Surface } from '../../ports/surface.js';
import { sectionContent, type StandardDrawInput } from './draw-input.js';
import { slotValueText } from './render.part03.js';
import { drawDirection, drawRows, fitText, joinInline, span, textWidth, type DrawRow, type DrawSpan } from './draw-rows.js';

const CONNECTOR = ' ── ';

/** The path's step labels: each list item's text, or the whole slot text as one step. */
function pathSteps(input: StandardDrawInput): readonly string[] {
  const raw = input.slots?.['path'];
  if (Array.isArray(raw)) {
    const steps = raw
      .map((item) => slotValueText(item))
      .filter((item): item is string => item !== undefined && item.trim() !== '');
    if (steps.length > 0) return steps;
  }
  return [sectionContent(input.sections, 'path') ?? ''];
}

function stepSpan(label: string, index: number, current: number, width: number): DrawSpan {
  if (index === current) return span(fitText(`● ${label}`, width), 'bold');
  const mark = index < current ? '✓' : '○';
  return span(fitText(`${mark} ${label}`, width), ...(index < current ? [] : ['dim']));
}

function stepperRows(steps: readonly string[], current: number, width: number): DrawRow[] {
  const line = steps.map((label, index) => stepSpan(label, index, current, width));
  const lineWidth = line.reduce((sum, part) => sum + textWidth(part.text), 0) + CONNECTOR.length * (line.length - 1);
  if (lineWidth <= width) {
    return [line.flatMap((part, index) => (index === 0 ? [part] : [span(CONNECTOR, 'dim'), part]))];
  }
  return line.map((part) => [part]);
}

/**
 * Draws `PathProgressBlock` as a stepper: steps before the one named by
 * `current` are marked `✓`, that step `●`, and later steps `○`, joined by `──`
 * on one row, or one step per row when the row would not fit. A last row reads
 * `Step <step> of <total>`, then `current` when it names no step, then `status`.
 * Under `rtl` the steps run right to left from the right edge; each step
 * keeps its mark before its label, as `stepper` does.
 */
export function drawPathProgress(input: StandardDrawInput): Surface {
  const width = input.bounds.width;
  const direction = drawDirection();
  const text = (id: string): string => sectionContent(input.sections, id) ?? '';
  const steps = pathSteps(input);
  const current = steps.indexOf(text('current'));

  const position = `Step ${text('step')} of ${text('total')}`;
  const unnamed = current === -1 ? text('current') : undefined;
  const summary = joinInline([position, unnamed, sectionContent(input.sections, 'status')], direction, ' · ');
  return drawRows([...stepperRows(steps, current, width), [span(fitText(summary, width), 'dim')]], width, direction);
}
