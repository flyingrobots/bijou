import type { Surface } from '../../ports/surface.js';
import type { StandardDrawInput } from './draw-input.js';
import { findSection, pieceSurface, sectionPiece } from './draw-slot.js';
import { emphasisStyle, linesSurface, stackBlocks } from './draw-text.js';

const ACCENT_GLYPH = '━';
const RULE_LEAD = 2;

/**
 * The accent rule. A missing decoration shows its missing-slot text inside
 * the rule when it fits, and wrapped on the rows under a plain rule when not.
 */
function accentRule(input: StandardDrawInput, width: number): readonly Surface[] {
  const decoration = findSection(input.sections, 'decoration');
  const plain = linesSurface([ACCENT_GLYPH.repeat(width)], width, emphasisStyle('accent'));
  if (decoration === undefined || decoration.present) return [plain];
  const label = ` ${decoration.content} `;
  if (RULE_LEAD * 2 + label.length > width) return [plain, pieceSurface(decoration.content, width)];
  const rule = `${ACCENT_GLYPH.repeat(RULE_LEAD)}${label}`.padEnd(width, ACCENT_GLYPH);
  return [linesSurface([rule], width, emphasisStyle('accent'))];
}

/**
 * Draws `BrandEmphasisBlock` as the brand in bold accent, an accent rule under
 * it, and the tagline. `role` and `selected` stay in the facts and lower modes.
 */
export function drawBrandEmphasis(input: StandardDrawInput): Surface {
  const width = input.bounds.width;
  return stackBlocks([
    pieceSurface(sectionPiece(findSection(input.sections, 'brand')), width, emphasisStyle('accent')),
    ...accentRule(input, width),
    pieceSurface(sectionPiece(findSection(input.sections, 'tagline')), width),
  ], width, 0);
}
