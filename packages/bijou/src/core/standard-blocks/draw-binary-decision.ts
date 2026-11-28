import type { Surface } from '../../ports/surface.js';
import { sectionContent, type StandardDrawInput } from './draw-input.js';
import { BOLD, formRow, stackRows, type FormRowPart } from './draw-form-rows.js';
import { INDENT, RADIO_SELECTED, RADIO_UNSELECTED, labelRow, textRow } from './draw-choice.js';

type Side = 'yes' | 'no';

const SIDES: ReadonlyMap<string, Side> = new Map([
  ['yes', 'yes'], ['y', 'yes'], ['true', 'yes'],
  ['no', 'no'], ['n', 'no'], ['false', 'no'],
]);

/** Glyphs that introduce the consequence, confirmation and disabled-reason rows. */
const NOTE_GLYPHS: readonly (readonly [string, string])[] = [
  ['consequence', '→'],
  ['confirmation', '✓'],
  ['disabledReason', '⊘'],
];

function choice(side: Side, selected: Side | undefined): FormRowPart {
  const marked = side === selected;
  return { text: `${marked ? RADIO_SELECTED : RADIO_UNSELECTED} ${side}`, ...(marked ? { style: BOLD } : {}) };
}

/**
 * Draws `BinaryDecisionBlock` as a yes/no choice: the label, both choices
 * with the selected one filled and bold, then the consequence, confirmation
 * and disabled reason. A selection that is neither yes nor no is shown as its
 * own row, with neither choice filled.
 */
export function drawBinaryDecision(input: StandardDrawInput): Surface {
  const width = input.bounds.width;
  const selectedText = sectionContent(input.sections, 'selected') ?? '';
  const selected = SIDES.get(selectedText.trim().toLowerCase());
  const rows = [
    labelRow(input, width),
    formRow([{ text: INDENT }, choice('yes', selected), { text: '  ' }, choice('no', selected)], width),
  ];
  if (selected === undefined && selectedText !== '') rows.push(textRow(selectedText, width));
  for (const [id, glyph] of NOTE_GLYPHS) {
    const note = sectionContent(input.sections, id);
    if (note !== undefined) rows.push(textRow(`${glyph} ${note}`, width));
  }
  return stackRows(rows, width);
}
