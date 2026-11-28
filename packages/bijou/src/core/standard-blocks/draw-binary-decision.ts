import type { Surface } from '../../ports/surface.js';
import { sectionContent, type StandardDrawInput } from './draw-input.js';
import { BOLD, formRow, slotBlock, stackRows, type FormRowPart } from './draw-form-rows.js';
import { INDENT, RADIO_SELECTED, RADIO_UNSELECTED, labelRow } from './draw-choice.js';
import { sectionVisual } from './draw-slot-values.js';

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
 * and disabled reason, each wrapped under its glyph. A selection that is
 * neither yes nor no is shown as its own row, with neither choice filled.
 */
export function drawBinaryDecision(input: StandardDrawInput): Surface {
  const width = input.bounds.width;
  const selectedText = sectionContent(input.sections, 'selected') ?? '';
  const selected = SIDES.get(selectedText.trim().toLowerCase());
  const rows = [
    labelRow(input, width),
    formRow([{ text: INDENT }, choice('yes', selected), { text: '  ' }, choice('no', selected)], width),
  ];
  const selectedVisual = sectionVisual(input, 'selected');
  if (selected === undefined && selectedText !== '' && selectedVisual !== undefined) {
    rows.push(slotBlock(selectedVisual, width));
  }
  for (const [id, glyph] of NOTE_GLYPHS) {
    const note = sectionVisual(input, id);
    if (note !== undefined) rows.push(slotBlock(note, width, { prefix: [{ text: `${glyph} ` }] }));
  }
  return stackRows(rows, width);
}
