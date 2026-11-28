import type { Surface } from '../../ports/surface.js';
import { sectionContent, type StandardDrawInput } from './draw-input.js';
import { BOLD, slotBlock, stackRows, type SlotVisual } from './draw-form-rows.js';
import { missingText, sectionVisual, slotItems } from './draw-slot-values.js';

const RADIO_SELECTED = '◉';
const RADIO_UNSELECTED = '○';
const CHECKBOX_CHECKED = '☑';
const CHECKBOX_UNCHECKED = '☐';
const INDENT = '  ';

/** One option row: indent and mark, then the option, wrapped under itself. A marked row is bold. */
function optionRow(mark: string, visual: SlotVisual, marked: boolean, width: number): Surface {
  const style = marked ? { style: BOLD } : {};
  return slotBlock(visual, width, { prefix: [{ text: INDENT }, { text: `${mark} `, ...style }], ...style });
}

function labelRow(input: StandardDrawInput, width: number): Surface {
  return slotBlock(sectionVisual(input, 'label') ?? '', width, { style: BOLD });
}

function withValidation(rows: Surface[], input: StandardDrawInput, width: number): Surface {
  const validation = sectionVisual(input, 'validation');
  if (validation !== undefined) rows.push(slotBlock(validation, width));
  return stackRows(rows, width);
}

/**
 * Draws `SingleChoiceBlock` as a radio group: one row per option, with the
 * first option equal to `selected` filled and bold. A selection that matches
 * no option is shown as its own row below the options. `mode` is a variant
 * token: every value, known or not, draws the radio group.
 */
export function drawSingleChoice(input: StandardDrawInput): Surface {
  const width = input.bounds.width;
  const selected = sectionContent(input.sections, 'selected') ?? '';
  const options = slotItems(input, 'options');
  const selectedIndex = options.findIndex((option) => option.text === selected);
  const rows = [labelRow(input, width)];
  const missingOptions = missingText(input, 'options');
  if (missingOptions !== undefined) rows.push(slotBlock(missingOptions, width));
  options.forEach((option, index) => {
    const marked = index === selectedIndex;
    rows.push(optionRow(marked ? RADIO_SELECTED : RADIO_UNSELECTED, option.visual, marked, width));
  });
  const selectedVisual = sectionVisual(input, 'selected');
  if (selectedIndex < 0 && selected !== '' && selectedVisual !== undefined) rows.push(slotBlock(selectedVisual, width));
  return withValidation(rows, input, width);
}

function checkboxRows(input: StandardDrawInput, id: string, checked: boolean, width: number): Surface[] {
  const missing = missingText(input, id);
  if (missing !== undefined) return [slotBlock(missing, width)];
  const mark = checked ? CHECKBOX_CHECKED : CHECKBOX_UNCHECKED;
  return slotItems(input, id).map((item) => optionRow(mark, item.visual, false, width));
}

/**
 * Draws `MultipleChoiceBlock` as a checklist: a checked box for every
 * `checked` option, then an empty box for every `unchecked` one.
 */
export function drawMultipleChoice(input: StandardDrawInput): Surface {
  const width = input.bounds.width;
  const rows = [
    labelRow(input, width),
    ...checkboxRows(input, 'checked', true, width),
    ...checkboxRows(input, 'unchecked', false, width),
  ];
  return withValidation(rows, input, width);
}

export { INDENT, RADIO_SELECTED, RADIO_UNSELECTED, labelRow };
