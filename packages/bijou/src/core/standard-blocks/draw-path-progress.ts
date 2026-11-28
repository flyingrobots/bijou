import type { Surface } from '../../ports/surface.js';
import type { StandardDrawInput } from './draw-input.js';
import { drawDirection, drawLines, inlineLines, partLine, span, textLine, textParts, textWidth, type DrawLine, type DrawSpan, type SlotPart } from './draw-rows.js';
import { listParts, partText, slotPart } from './draw-slots.js';

const CONNECTOR = ' ── ';

function markOf(index: number, current: number): string {
  if (index === current) return '●';
  return index < current ? '✓' : '○';
}

/** A step's mark and label as one span, so the mark stays before the label under `rtl`, as in `stepper`. */
function stepSpan(text: string, index: number, current: number): DrawSpan {
  const modifiers = index === current ? ['bold'] : index < current ? [] : ['dim'];
  return span(text === '' ? markOf(index, current) : `${markOf(index, current)} ${text}`, ...modifiers);
}

/** All steps on one row joined by `──`, when every step is text and the row fits. */
function stepperRow(steps: readonly SlotPart[], current: number, width: number): DrawLine | undefined {
  const texts = textParts(steps);
  if (texts === undefined || texts.length !== steps.length) return undefined;
  const spans = texts.flatMap((text, index) => [
    ...(index === 0 ? [] : [span(CONNECTOR, 'dim')]),
    stepSpan(text, index, current),
  ]);
  return spans.reduce((sum, part) => sum + textWidth(part.text), 0) <= width ? textLine(spans) : undefined;
}

/** One step per row: its mark and wrapping label, or its mark above a nested Surface. */
function stepLines(steps: readonly SlotPart[], current: number): DrawLine[] {
  return steps.flatMap((step, index) => (typeof step === 'string'
    ? [textLine([stepSpan(step, index, current)])]
    : [textLine([stepSpan('', index, current)]), partLine(step, 2)]));
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
  const steps = listParts(input, 'path');
  const named = slotPart(input.sections, 'current');
  const current = steps.findIndex((step) => typeof step === 'string' && step === partText(named));

  const [step, total] = [slotPart(input.sections, 'step') ?? '', slotPart(input.sections, 'total') ?? ''];
  const position = typeof step === 'string' && typeof total === 'string' ? [`Step ${step} of ${total}`] : ['Step', step, 'of', total];
  const summary = inlineLines([...position, current === -1 ? named : undefined, slotPart(input.sections, 'status')], ' · ', 'dim');
  const row = stepperRow(steps, current, width);
  return drawLines([...(row === undefined ? stepLines(steps, current) : [row]), ...summary], width, direction);
}
