import type { Surface } from '../../ports/surface.js';
import { sectionContent, type StandardDrawInput } from './draw-input.js';
import { BOLD, formRow, missingText, slotItems, stackRows } from './draw-form-rows.js';

const RADIO_SELECTED = '◉';
const RADIO_UNSELECTED = '○';
const CHECKBOX_CHECKED = '☑';
const CHECKBOX_UNCHECKED = '☐';
const INDENT = '  ';

/** One option row: indent, mark and text. A marked row is bold. */
function optionRow(mark: string, text: string, marked: boolean, width: number): Surface {
  return formRow([{ text: INDENT }, { text: `${mark} ${text}`, ...(marked ? { style: BOLD } : {}) }], width);
}

function textRow(text: string, width: number): Surface {
  return formRow([{ text }], width);
}

function labelRow(input: StandardDrawInput, width: number): Surface {
  return formRow([{ text: sectionContent(input.sections, 'label') ?? '', style: BOLD }], width);
}

function withValidation(rows: Surface[], input: StandardDrawInput, width: number): Surface {
  const validation = sectionContent(input.sections, 'validation');
  if (validation !== undefined) rows.push(textRow(validation, width));
  return stackRows(rows, width);
}

/**
 * Draws `SingleChoiceBlock` as a radio group: one row per option, with the
 * first option equal to `selected` filled and bold. A selection that matches
 * no option is shown as its own row below the options.
 */
export function drawSingleChoice(input: StandardDrawInput): Surface {
  const width = input.bounds.width;
  const selected = sectionContent(input.sections, 'selected') ?? '';
  const options = slotItems(input, 'options');
  const selectedIndex = options.indexOf(selected);
  const rows = [labelRow(input, width)];
  const missingOptions = missingText(input, 'options');
  if (missingOptions !== undefined) rows.push(textRow(missingOptions, width));
  options.forEach((option, index) => {
    const marked = index === selectedIndex;
    rows.push(optionRow(marked ? RADIO_SELECTED : RADIO_UNSELECTED, option, marked, width));
  });
  if (selectedIndex < 0 && selected !== '') rows.push(textRow(selected, width));
  return withValidation(rows, input, width);
}

function checkboxRows(input: StandardDrawInput, id: string, checked: boolean, width: number): Surface[] {
  const missing = missingText(input, id);
  if (missing !== undefined) return [textRow(missing, width)];
  const mark = checked ? CHECKBOX_CHECKED : CHECKBOX_UNCHECKED;
  return slotItems(input, id).map((item) => optionRow(mark, item, false, width));
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

export { INDENT, RADIO_SELECTED, RADIO_UNSELECTED, labelRow, textRow };
