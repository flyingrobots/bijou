import type { BijouContext } from '../../ports/context.js';
import type { TokenValue } from '../theme/tokens.js';
import type { AccordionSection } from './accordion.js';
import { mirrorGlyphs } from '../direction/directional-glyph.js';
import { alignEnd } from './rtl-align.js';

/** Header styling shared by the right-to-left renderer. */
export interface AccordionRtlStyle {
  readonly indicatorToken: TokenValue;
  readonly titleToken: TokenValue;
  readonly bgFill: ((text: string) => string) | undefined;
  readonly ctx: BijouContext;
}

/**
 * Render an accordion for right-to-left layout: the disclosure glyph follows
 * the title on the right edge (`▶` mirrors to `◀`, `▼` is not directional and
 * stays), content is indented from the right, and lines are right-aligned to
 * the widest line. Section blocks stay separated by one empty line.
 */
export function renderAccordionRtl(sections: AccordionSection[], s: AccordionRtlStyle): string {
  const lines = sections.flatMap((section, i) => {
    const glyph = mirrorGlyphs(section.expanded ? '▼' : '▶', 'rtl');
    const indicator = s.ctx.style.styled(s.indicatorToken, glyph);
    const title = s.ctx.style.styled(s.titleToken, section.title);
    const header = `${title} ${indicator}`;
    const head = s.bgFill ? s.bgFill(header) : header;
    const body = section.expanded ? section.content.split('\n').map((line) => `${line}  `) : [];
    return [...(i > 0 ? [''] : []), head, ...body];
  });
  return alignEnd(lines);
}
