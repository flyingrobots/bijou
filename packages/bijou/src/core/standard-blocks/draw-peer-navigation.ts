import type { Surface } from '../../ports/surface.js';
import type { InlineDirection } from '../direction/direction.js';
import { mirrorGlyph } from '../direction/directional-glyph.js';
import type { StandardDrawInput } from './draw-input.js';
import { centerText, drawDirection, drawLines, inlineLines, partLine, span, textLine, textWidth, type DrawLine, type SlotPart } from './draw-rows.js';
import { slotPart } from './draw-slots.js';

/** A peer with its mark on the outer side: `← previous` or `next →` (mirrored under `rtl`). */
function peerLines(part: SlotPart, mark: string, markFirst: boolean): DrawLine[] {
  if (typeof part !== 'string') return [textLine([span(mark)]), partLine(part, 2)];
  return [textLine(markFirst ? [span(mark), span(' '), span(part)] : [span(part), span(' '), span(mark)])];
}

function navigationRow(previous: string, current: string, next: string, width: number, direction: InlineDirection): DrawLine | undefined {
  const sides = textWidth(previous) + textWidth(next) + 6;
  if (sides + textWidth(current) > width) return undefined;
  return textLine([
    span(mirrorGlyph('←', direction)), span(' '), span(previous), span(' '),
    span(centerText(current, width - sides), 'bold'),
    span(' '), span(next), span(' '), span(mirrorGlyph('→', direction)),
  ]);
}

/**
 * Draws `PeerNavigationBlock` as one navigation row: the previous peer with a
 * mark pointing to the logical start, the current peer in the centre, and the
 * next peer with a mark pointing to the logical end. When that row does not fit,
 * or a peer is a nested Surface, each peer gets its own wrapping row. Under
 * `rtl` rows run right to left and the marks mirror (`←` becomes `→`).
 * `route` and `status`, when present, follow as `route · status`.
 */
export function drawPeerNavigation(input: StandardDrawInput): Surface {
  const width = input.bounds.width;
  const direction = drawDirection();
  const part = (id: string): SlotPart => slotPart(input.sections, id) ?? '';
  const [previous, current, next] = [part('previous'), part('current'), part('next')];

  const row = typeof previous === 'string' && typeof current === 'string' && typeof next === 'string'
    ? navigationRow(previous, current, next, width, direction)
    : undefined;
  const lines: DrawLine[] = row !== undefined ? [row] : [
    ...peerLines(previous, mirrorGlyph('←', direction), true),
    partLine(current, 2, 'bold'),
    ...peerLines(next, mirrorGlyph('→', direction), false),
  ];
  lines.push(...inlineLines([slotPart(input.sections, 'route'), slotPart(input.sections, 'status')], ' · ', 'dim'));
  return drawLines(lines, width, direction);
}
