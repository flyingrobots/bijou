import type { Surface } from '../../ports/surface.js';
import { sectionContent, type StandardDrawInput } from './draw-input.js';
import { drawDirection, drawRows, fitText, joinInline, span, textWidth, type DrawRow } from './draw-rows.js';

const LINK_MARK = '↗';
const INDENT = '  ';

/**
 * Draws `LinkDestinationBlock` as a link: `↗ <label> (<destination>)` on one
 * row, the same `text (url)` form `hyperlink` falls back to, with the label
 * underlined. When that row does not fit, the destination moves to its own
 * indented row. `kind` and `status`, when present, follow as `kind · status`.
 * Under `rtl` the row runs right to left from the right edge.
 */
export function drawLinkDestination(input: StandardDrawInput): Surface {
  const width = input.bounds.width;
  const direction = drawDirection();
  const label = joinInline([LINK_MARK, sectionContent(input.sections, 'label') ?? ''], direction);
  const destination = `(${sectionContent(input.sections, 'destination') ?? ''})`;

  const rows: DrawRow[] = [];
  if (textWidth(label) + 1 + textWidth(destination) <= width) {
    rows.push([span(label, 'underline'), span(' '), span(destination, 'dim')]);
  } else {
    rows.push([span(fitText(label, width), 'underline')]);
    rows.push([span(INDENT), span(fitText(destination, width - INDENT.length), 'dim')]);
  }

  const kind = sectionContent(input.sections, 'kind');
  const status = sectionContent(input.sections, 'status');
  if (kind !== undefined || status !== undefined) {
    rows.push([span(fitText(joinInline([kind, status], direction, ' · '), width), 'dim')]);
  }
  return drawRows(rows, width, direction);
}
