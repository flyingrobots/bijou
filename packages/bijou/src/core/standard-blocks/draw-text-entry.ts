import { boxSurface } from '../components/box-v3.js';
import type { Surface } from '../../ports/surface.js';
import { sectionContent, type StandardDrawInput } from './draw-input.js';
import { BOLD, DIM, formRow, stackRows, type FormRowPart } from './draw-form-rows.js';

function inputText(input: StandardDrawInput): FormRowPart {
  const value = sectionContent(input.sections, 'value') ?? '';
  const placeholder = sectionContent(input.sections, 'placeholder');
  return value === '' && placeholder !== undefined
    ? { text: placeholder, style: DIM }
    : { text: value };
}

/**
 * Draws `TextEntryBlock` as a form field: the field label, a bordered input
 * holding the value (or the dimmed placeholder when the value is empty), and
 * the validation line when there is one. It renders state only.
 */
export function drawTextEntry(input: StandardDrawInput): Surface {
  const width = input.bounds.width;
  const field = sectionContent(input.sections, 'field') ?? '';
  const validation = sectionContent(input.sections, 'validation');
  const box = boxSurface(formRow([inputText(input)], width - 4), {
    width,
    padding: { left: 1, right: 1 },
  });
  const rows = [formRow([{ text: field, style: BOLD }], width), box];
  if (validation !== undefined) rows.push(formRow([{ text: validation }], width));
  return stackRows(rows, width);
}
