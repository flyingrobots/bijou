import { separatorSurface } from '../components/separator-v3.js';
import { createSurface, type Surface } from '../../ports/surface.js';
import { sectionContent, type StandardDrawInput } from './draw-input.js';

const RULE_GLYPH = '─';
const STYLE_GLYPHS: ReadonlyMap<string, string> = new Map([
  ['rule', RULE_GLYPH],
  ['heavy', '━'],
  ['double', '═'],
  ['dashed', '╌'],
]);

/** Restyles the rule runs at each end of the row, leaving the label's own text alone. */
function restyleRule(rule: Surface, glyph: string): void {
  if (glyph === RULE_GLYPH) return;
  const restyleFrom = (start: number, step: number): void => {
    for (let x = start; x >= 0 && x < rule.width; x += step) {
      const cell = rule.get(x, 0);
      if (cell.char !== RULE_GLYPH) return;
      rule.set(x, 0, { ...cell, char: glyph });
    }
  };
  restyleFrom(0, 1);
  restyleFrom(rule.width - 1, -1);
}

/**
 * Draws `DividerBlock` as one labelled rule. `style` picks the line glyph
 * (`rule`, `heavy`, `double`, `dashed`; anything else draws `rule`), and
 * `density: 'spacious'` adds a blank row above and below it.
 */
export function drawDivider(input: StandardDrawInput): Surface {
  const width = input.bounds.width;
  const rule = separatorSurface({ label: sectionContent(input.sections, 'label') ?? '', width });
  const style = sectionContent(input.sections, 'style');
  restyleRule(rule, (style === undefined ? undefined : STYLE_GLYPHS.get(style)) ?? RULE_GLYPH);

  if (sectionContent(input.sections, 'density') !== 'spacious') {
    return rule;
  }

  const spaced = createSurface(width, 3);
  spaced.blit(rule, 0, 1);
  return spaced;
}
