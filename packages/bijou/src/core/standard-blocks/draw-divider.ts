import { separatorSurface } from '../components/separator-v3.js';
import { segmentSurfaceText } from '../components/surface-text.js';
import { sanitizePlainTerminalText } from '../text/index.js';
import { createSurface, type Surface } from '../../ports/surface.js';
import { sectionContent, type StandardDrawInput } from './draw-input.js';

const RULE_GLYPH = '─';
const STYLE_GLYPHS: ReadonlyMap<string, string> = new Map([
  ['rule', RULE_GLYPH],
  ['heavy', '━'],
  ['double', '═'],
  ['dashed', '╌'],
]);

/**
 * Restyles the rule cells, found from the layout `separatorSurface` uses (the
 * padded label centred, the rule on both sides), never from cell characters.
 * A label that fills the row leaves no rule to restyle.
 */
function restyleRule(rule: Surface, label: string, glyph: string): void {
  if (glyph === RULE_GLYPH) return;
  const safeLabel = sanitizePlainTerminalText(label);
  const labelCells = safeLabel.length > 0
    ? segmentSurfaceText(` ${safeLabel} `).length
    : 0;
  if (labelCells >= rule.width) return;
  const start = Math.floor((rule.width - labelCells) / 2);
  for (let x = 0; x < rule.width; x += 1) {
    if (x >= start && x < start + labelCells) continue;
    rule.set(x, 0, { ...rule.get(x, 0), char: glyph });
  }
}

/**
 * Draws `DividerBlock` as one labelled rule. `style` picks the line glyph
 * (`rule`, `heavy`, `double`, `dashed`; anything else draws `rule`), and
 * `density: 'spacious'` adds a blank row above and below it.
 */
export function drawDivider(input: StandardDrawInput): Surface {
  const width = input.bounds.width;
  const label = sectionContent(input.sections, 'label') ?? '';
  const rule = separatorSurface({ label, width });
  const style = sectionContent(input.sections, 'style');
  restyleRule(rule, label, (style === undefined ? undefined : STYLE_GLYPHS.get(style)) ?? RULE_GLYPH);

  if (sectionContent(input.sections, 'density') !== 'spacious') {
    return rule;
  }

  const spaced = createSurface(width, 3);
  spaced.blit(rule, 0, 1);
  return spaced;
}
