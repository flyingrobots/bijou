import { createSurface, type Surface } from '../../ports/surface.js';
import { badge, type BadgeVariant } from '../components/badge.js';
import { parseAnsiToSurface } from '../render/differ-ansi.js';
import { graphemeWidth, sanitizePlainTerminalText, stripAnsi, wrapToWidth } from '../text/index.js';
import type { RenderSection } from './render.part01.js';

/** A Surface placed in a flowing row, or `'gap'` for one more blank column (dropped at a row start). */
type FlowAtom = Surface | 'gap';

/** `surface`, clipped to `width` columns when it is wider. Its cells keep their styling. */
function clipSurface(surface: Surface, width: number): Surface {
  if (surface.width <= width) return surface;
  const clipped = createSurface(Math.max(0, width), surface.height);
  clipped.blit(surface, 0, 0);
  return clipped;
}

/** The words of untrusted text as one-row atoms; a word longer than `width` is broken between graphemes. */
function textAtoms(text: string, width: number): readonly Surface[] {
  return sanitizePlainTerminalText(text)
    .split(/\s+/u)
    .filter((word) => word !== '')
    .flatMap((word) => wrapToWidth(word, width))
    .filter((piece) => piece !== '')
    .map((piece) => parseAnsiToSurface(piece, graphemeWidth(piece), 1));
}

/** One styled atom for a string Component's output, or its plain words when it is wider than `width`. */
function styledAtoms(styled: string, width: number): readonly Surface[] {
  const columns = graphemeWidth(stripAnsi(styled));
  return columns <= width ? [parseAnsiToSurface(styled, columns, 1)] : textAtoms(stripAnsi(styled), width);
}

/** A slot as atoms: a Surface value is blitted (clipped to `width`); text is split into words. */
function sectionAtoms(section: RenderSection | undefined, width: number): readonly Surface[] {
  if (section === undefined) return [];
  return typeof section.visualContent === 'string'
    ? textAtoms(section.content, width)
    : [clipSurface(section.visualContent, width)];
}

/** A badge, or several badges of at most `width` columns when the text is wider than the row. */
function badgeAtoms(text: string, variant: BadgeVariant, width: number): readonly Surface[] {
  const pill = badge(text, { variant });
  if (pill.width <= width) return [pill];
  return wrapToWidth(sanitizePlainTerminalText(text), Math.max(1, width - 2)).map((piece) => badge(piece, { variant }));
}

interface Placement {
  readonly atom: Surface;
  readonly x: number;
  readonly y: number;
}

/**
 * Flows atoms left to right, one space apart, onto as many rows as they need,
 * so no slot text is cut at the row edge. The result is exactly `width` wide.
 */
function flow(atoms: readonly FlowAtom[], width: number): Surface {
  const placed: Placement[] = [];
  let x = 0;
  let y = 0;
  let lineHeight = 1;
  let gap = 1;
  for (const atom of atoms) {
    if (atom === 'gap') {
      if (x > 0) gap += 1;
      continue;
    }
    if (atom.width === 0) continue;
    let start = x === 0 ? 0 : x + gap;
    if (x > 0 && start + atom.width > width) {
      y += lineHeight;
      lineHeight = 1;
      start = 0;
    }
    placed.push({ atom, x: start, y });
    x = start + atom.width;
    lineHeight = Math.max(lineHeight, atom.height);
    gap = 1;
  }
  const surface = createSurface(width, y + lineHeight);
  for (const { atom, x: atomX, y: atomY } of placed) {
    surface.blit(atom, atomX, atomY);
  }
  return surface;
}

export type { FlowAtom };
export { badgeAtoms, clipSurface, flow, sectionAtoms, styledAtoms, textAtoms };
