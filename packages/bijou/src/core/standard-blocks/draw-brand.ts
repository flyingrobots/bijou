import type { Surface } from '../../ports/surface.js';
import { sectionContent, type StandardDrawInput } from './draw-input.js';
import { emphasisStyle, linesSurface, stackBlocks, wrappedLines } from './draw-text.js';

const ACCENT_GLYPH = '━';
const RULE_LEAD = 2;

/** The accent rule; a missing decoration shows its missing-slot text inside the rule. */
function accentRule(input: StandardDrawInput, width: number): Surface {
  const decoration = input.sections.find((section) => section.id === 'decoration');
  const label = decoration === undefined || decoration.present ? '' : ` ${decoration.content} `;
  const rule = `${ACCENT_GLYPH.repeat(RULE_LEAD)}${label}`.padEnd(width, ACCENT_GLYPH);
  return linesSurface([label === '' ? ACCENT_GLYPH.repeat(width) : rule], width, emphasisStyle('accent'));
}

/**
 * Draws `BrandEmphasisBlock` as the brand in bold accent, an accent rule under
 * it, and the tagline. `role` and `selected` stay in the facts and lower modes.
 */
export function drawBrandEmphasis(input: StandardDrawInput): Surface {
  const width = input.bounds.width;
  return stackBlocks([
    linesSurface(wrappedLines(sectionContent(input.sections, 'brand') ?? '', width), width, emphasisStyle('accent')),
    accentRule(input, width),
    linesSurface(wrappedLines(sectionContent(input.sections, 'tagline') ?? '', width), width),
  ], width, 0);
}
