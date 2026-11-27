import type { Surface } from '../../ports/surface.js';
import { mirrorGlyph } from '../direction/directional-glyph.js';
import { sectionContent, type StandardDrawInput } from './draw-input.js';
import { alignText, drawDirection, fitText, drawRows, joinInline, span, textWidth, type DrawRow } from './draw-rows.js';

/**
 * Draws `PeerNavigationBlock` as one navigation row: the previous peer with a
 * mark pointing to the logical start, the current peer in the centre, and the
 * next peer with a mark pointing to the logical end. Under `rtl` the row runs
 * right to left and the marks mirror (`←` becomes `→`). `route` and `status`,
 * when present, follow on a second row.
 */
export function drawPeerNavigation(input: StandardDrawInput): Surface {
  const width = input.bounds.width;
  const direction = drawDirection();
  const text = (id: string): string => sectionContent(input.sections, id) ?? '';
  const previous = joinInline([mirrorGlyph('←', direction), text('previous')], direction);
  const next = joinInline([text('next'), mirrorGlyph('→', direction)], direction);
  const natural = textWidth(previous) + textWidth(text('current')) + textWidth(next) + 2 <= width;
  const third = Math.floor((width - 2) / 3);
  const start = natural ? textWidth(previous) : third;
  const end = natural ? textWidth(next) : third;
  const navigation: DrawRow = [
    span(alignText(previous, start, 'start', direction)),
    span(' '),
    span(alignText(text('current'), width - start - end - 2, 'center', direction), 'bold'),
    span(' '),
    span(alignText(next, end, 'end', direction)),
  ];

  const route = sectionContent(input.sections, 'route');
  const status = sectionContent(input.sections, 'status');
  const rows: DrawRow[] = [navigation];
  if (route !== undefined || status !== undefined) {
    rows.push([span(fitText(joinInline([route, status], direction, ' · '), width), 'dim')]);
  }
  return drawRows(rows, width, direction);
}
