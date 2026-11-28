import type { Surface } from '../../ports/surface.js';
import { mirrorGlyph } from '../direction/directional-glyph.js';
import type { StandardDrawInput } from './draw-input.js';
import { drawDirection, drawLines, inlineLines, partLine, span, textLine, type DrawLine, type SlotPart } from './draw-rows.js';
import { listParts, slotPart } from './draw-slots.js';

const OPEN_STATES: ReadonlySet<string> = new Set(['open', 'expanded']);
const INDENT = 2;

function headingLines(marker: string, label: SlotPart, count: SlotPart, countWord: string, missingState: string | undefined): DrawLine[] {
  if (typeof label === 'string' && typeof count === 'string') {
    const state = missingState === undefined ? [] : [span(' · ', 'bold'), span(missingState, 'bold')];
    return [textLine([
      span(marker, 'bold'), span(' '), span(label, 'bold'), span(' · ', 'bold'), span(`${count} ${countWord}`, 'bold'), ...state,
    ])];
  }
  return inlineLines([marker, label, count, countWord, missingState], ' ', 'bold');
}

/**
 * Draws `ProgressiveDisclosureBlock` as a disclosure. Closed (any `state`
 * other than `open` or `expanded`), it shows `▶ <label> · <count> hidden` and
 * the `summary` below; open, it shows `▼ <label> · <count> shown` and each of
 * `details` on its own indented row. An unknown `state` token (a translated
 * one, for example) draws closed; a missing `state` shows its missing-slot text
 * in the heading. Text wraps to the width and nested Surfaces are blitted.
 * Under `rtl` the marker follows the label at the right edge, `▶` becomes `◀`,
 * and rows are indented from the right.
 */
export function drawProgressiveDisclosure(input: StandardDrawInput): Surface {
  const width = input.bounds.width;
  const direction = drawDirection();
  const state = input.sections.find((section) => section.id === 'state');
  const open = state !== undefined && state.present && OPEN_STATES.has(state.content);

  const heading = headingLines(
    open ? '▼' : mirrorGlyph('▶', direction),
    slotPart(input.sections, 'label') ?? '',
    slotPart(input.sections, 'hiddenCount') ?? '',
    open ? 'shown' : 'hidden',
    state !== undefined && !state.present ? state.content : undefined,
  );
  const summary = slotPart(input.sections, 'summary');
  const body = open
    ? listParts(input, 'details').map((detail) => partLine(detail, INDENT))
    : summary === undefined ? [] : [partLine(summary, INDENT, 'dim')];
  return drawLines([...heading, ...body], width, direction);
}
