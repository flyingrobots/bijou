import type { Surface } from '../../ports/surface.js';
import type { StandardDrawInput } from './draw-input.js';
import { drawDirection, drawLines, inlineLines, partLine, span, textLine, textWidth, type DrawLine, type SlotPart } from './draw-rows.js';
import { slotPart } from './draw-slots.js';

const LINK_MARK = '↗';
const INDENT = 2;

function linkLines(label: SlotPart, destination: SlotPart, width: number): DrawLine[] {
  if (typeof label === 'string' && typeof destination === 'string') {
    const target = `(${destination})`;
    if (textWidth(`${LINK_MARK} ${label} ${target}`) <= width) {
      return [textLine([span(LINK_MARK), span(' '), span(label, 'underline'), span(' '), span(target, 'dim')])];
    }
    return [textLine([span(LINK_MARK), span(' '), span(label, 'underline')]), textLine([span(target, 'dim')], INDENT)];
  }
  const labelLines = typeof label === 'string'
    ? [textLine([span(LINK_MARK), span(' '), span(label, 'underline')])]
    : [textLine([span(LINK_MARK)]), partLine(label, INDENT)];
  return [...labelLines, typeof destination === 'string' ? textLine([span(`(${destination})`, 'dim')], INDENT) : partLine(destination, INDENT)];
}

/**
 * Draws `LinkDestinationBlock` as a link: `↗ <label> (<destination>)` on one
 * row, the same `text (url)` form `hyperlink` falls back to, with the label
 * underlined. When that row does not fit, the destination moves to its own
 * indented row; long text wraps and nested Surfaces are blitted. `kind` and
 * `status`, when present, follow as `kind · status`. Under `rtl` rows run right
 * to left from the right edge.
 */
export function drawLinkDestination(input: StandardDrawInput): Surface {
  const width = input.bounds.width;
  const direction = drawDirection();
  const lines = [
    ...linkLines(slotPart(input.sections, 'label') ?? '', slotPart(input.sections, 'destination') ?? '', width),
    ...inlineLines([slotPart(input.sections, 'kind'), slotPart(input.sections, 'status')], ' · ', 'dim'),
  ];
  return drawLines(lines, width, direction);
}
