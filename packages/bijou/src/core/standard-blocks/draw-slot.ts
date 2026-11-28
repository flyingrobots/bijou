import { createSurface, type Surface } from '../../ports/surface.js';
import { createTextSurface, type CellTextStyle } from '../components/surface-text.js';
import type { RenderSection } from './render.part01.js';
import { isSurfaceSlotValue } from './render.part02.js';
import { slotValueText } from './render.part03.js';
import { linesSurface, wrappedLines } from './draw-text.js';

/** One drawn slot value: text to wrap, or a nested Surface (a child block) to blit with its own cells. */
export type SlotPiece = string | Surface;

/** Section `id`, when the block has it: required ones always, optional ones only when present. */
export function findSection(sections: readonly RenderSection[], id: string): RenderSection | undefined {
  return sections.find((section) => section.id === id);
}

/** The drawn value of `section`: its Surface, its text, or its missing-slot text. */
export function sectionPiece(section: RenderSection | undefined): SlotPiece {
  return section?.visualContent ?? '';
}

/** `surface`'s cells in a Surface exactly `width` wide, clipped at the right edge, never flattened to text. */
export function clippedSurface(surface: Surface, width: number): Surface {
  const clipped = createSurface(width, Math.max(1, surface.height));
  clipped.blit(surface, 0, 0);
  return clipped;
}

/** `piece` drawn exactly `width` wide: text wrapped at words in `style`, a Surface blitted unchanged. */
export function pieceSurface(piece: SlotPiece, width: number, style: CellTextStyle = {}): Surface {
  return typeof piece === 'string'
    ? linesSurface(wrappedLines(piece, width), width, style)
    : clippedSurface(piece, width);
}

/** `prefix`, then `piece` beside it; wrapped rows continue under the piece, not under the prefix. */
export function prefixedSurface(prefix: string, piece: SlotPiece, width: number, style: CellTextStyle = {}): Surface {
  const lead = createTextSurface(prefix);
  const body = pieceSurface(piece, Math.max(1, width - lead.width), style);
  const surface = createSurface(width, body.height);
  surface.blit(lead, 0, 0);
  surface.blit(body, lead.width, 0);
  return surface;
}

/**
 * The items of a list slot: one per entry that is a Surface or has text. Any
 * other value, or a list with nothing to draw, gives the section's own drawn
 * value (its missing-slot text when the slot is required and absent).
 */
export function listPieces(value: unknown, section: RenderSection | undefined): readonly SlotPiece[] {
  const items: SlotPiece[] = [];
  if (Array.isArray(value)) {
    for (const item of value) {
      if (isSurfaceSlotValue(item)) {
        items.push(item);
        continue;
      }
      const text = slotValueText(item);
      if (text !== undefined && text.trim() !== '') items.push(text);
    }
  }
  return items.length > 0 ? items : [sectionPiece(section)];
}

/** `label: value` rows for the present sections named by `ids`, each value wrapped or blitted beside its label. */
export function labelledSurfaces(sections: readonly RenderSection[], ids: readonly string[], width: number): Surface[] {
  return sections
    .filter((section) => ids.includes(section.id))
    .map((section) => prefixedSurface(`${section.label}: `, section.visualContent, width));
}
