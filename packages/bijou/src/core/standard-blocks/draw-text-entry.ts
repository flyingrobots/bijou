import { boxSurface } from '../components/box-v3.js';
import type { Surface } from '../../ports/surface.js';
import { sectionContent, type StandardDrawInput } from './draw-input.js';
import { BOLD, DIM, slotBlock, stackRows } from './draw-form-rows.js';
import { sectionVisual } from './draw-slot-values.js';

function inputContent(input: StandardDrawInput, width: number): Surface {
  const value = sectionVisual(input, 'value') ?? '';
  const placeholder = sectionVisual(input, 'placeholder');
  const empty = sectionContent(input.sections, 'value') === '';
  return empty && placeholder !== undefined
    ? slotBlock(placeholder, width, { style: DIM })
    : slotBlock(value, width);
}

/**
 * Draws `TextEntryBlock` as a form field: the field label, a bordered input
 * holding the value (or the dimmed placeholder when the value is empty), and
 * the validation line when there is one. Long text wraps; a Surface value is
 * blitted with its styles. It renders state only.
 */
export function drawTextEntry(input: StandardDrawInput): Surface {
  const width = input.bounds.width;
  const validation = sectionVisual(input, 'validation');
  const box = boxSurface(inputContent(input, width - 4), {
    width,
    padding: { left: 1, right: 1 },
  });
  const rows = [slotBlock(sectionVisual(input, 'field') ?? '', width, { style: BOLD }), box];
  if (validation !== undefined) rows.push(slotBlock(validation, width));
  return stackRows(rows, width);
}
