import type { Surface } from '../../ports/surface.js';
import { mirrorGlyph } from '../direction/directional-glyph.js';
import { sectionContent, type StandardDrawInput } from './draw-input.js';
import { slotValueText } from './render.part03.js';
import { drawDirection, drawRows, fitText, joinInline, span, type DrawRow } from './draw-rows.js';

const OPEN_STATES: ReadonlySet<string> = new Set(['open', 'expanded']);
const INDENT = '  ';

/** The detail lines: each list item's text, or the whole slot text as one line. */
function detailLines(input: StandardDrawInput): readonly string[] {
  const raw = input.slots?.['details'];
  if (Array.isArray(raw)) {
    return raw
      .map((item) => slotValueText(item))
      .filter((item): item is string => item !== undefined && item.trim() !== '');
  }
  const details = sectionContent(input.sections, 'details');
  return details === undefined ? [] : [details];
}

/**
 * Draws `ProgressiveDisclosureBlock` as a disclosure. Closed (any `state`
 * other than `open` or `expanded`), it shows `▶ <label> · <count> hidden` and
 * the `summary` below; open, it shows `▼ <label> · <count> shown` and each of
 * `details` on its own indented row. An unknown `state` token (a translated
 * one, for example) draws closed; a missing `state` shows its missing-slot text
 * in the heading. Under `rtl` the marker follows the label at the right
 * edge, `▶` becomes `◀`, and rows are indented from the right.
 */
export function drawProgressiveDisclosure(input: StandardDrawInput): Surface {
  const width = input.bounds.width;
  const direction = drawDirection();
  const text = (id: string): string => sectionContent(input.sections, id) ?? '';
  const state = text('state');
  const open = OPEN_STATES.has(state);

  const marker = open ? '▼' : mirrorGlyph('▶', direction);
  const count = `${text('hiddenCount')} ${open ? 'shown' : 'hidden'}`;
  const heading = joinInline([
    joinInline([marker, text('label')], direction),
    count,
    input.sections.some((section) => section.id === 'state' && !section.present) ? state : undefined,
  ], direction, ' · ');

  const body = open ? detailLines(input) : [sectionContent(input.sections, 'summary')];
  const rows: DrawRow[] = [[span(fitText(heading, width), 'bold')]];
  for (const line of body) {
    if (line === undefined) continue;
    rows.push([span(INDENT), span(fitText(line, width - INDENT.length), ...(open ? [] : ['dim']))]);
  }
  return drawRows(rows, width, direction);
}
