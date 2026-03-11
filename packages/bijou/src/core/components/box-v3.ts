import { createSurface, type Surface, type Cell } from '../../ports/surface.js';
import { resolveSafeCtx as resolveCtx } from '../resolve-ctx.js';
import { segmentGraphemes } from '../text/grapheme.js';
import { type BoxOptions } from './box.js';

const BORDER = { tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│' };

/**
 * Render a bordered box around a Surface.
 * 
 * Returns a new Surface containing the box and the nested content.
 */
export function boxV3(content: Surface | string, options: BoxOptions = {}): Surface {
  const ctx = resolveCtx(options.ctx);
  const { title, width: fixedWidth, padding = {} } = options;
  
  const pt = padding.top ?? 0;
  const pb = padding.bottom ?? 0;
  const pl = padding.left ?? 0;
  const pr = padding.right ?? 0;

  let contentSurf: Surface;
  if (typeof content === 'string') {
    const lines = content.split(/\r?\n/);
    const h = lines.length;
    const w = Math.max(...lines.map(l => segmentGraphemes(l).length), 0);
    contentSurf = createSurface(w, h);
    lines.forEach((line, y) => {
      const gs = segmentGraphemes(line);
      gs.forEach((char, x) => contentSurf.set(x, y, { char }));
    });
  } else {
    contentSurf = content;
  }

  const innerW = contentSurf.width + pl + pr;
  const innerH = contentSurf.height + pt + pb;
  
  const outerW = fixedWidth ?? (innerW + 2);
  const outerH = innerH + 2;
  
  const surface = createSurface(outerW, outerH);
  surface.fill({ char: options.fillChar || ' ' });

  const borderToken = options.borderToken || ctx?.border('primary');
  const borderCell: Cell = { 
    char: ' ', 
    fg: borderToken?.hex ?? '#ffffff', 
    bg: borderToken?.bg, 
    modifiers: borderToken?.modifiers as any 
  };

  // Draw borders
  for (let x = 0; x < outerW; x++) {
    surface.set(x, 0, { ...borderCell, char: BORDER.h });
    surface.set(x, outerH - 1, { ...borderCell, char: BORDER.h });
  }
  for (let y = 0; y < outerH; y++) {
    surface.set(0, y, { ...borderCell, char: BORDER.v });
    surface.set(outerW - 1, y, { ...borderCell, char: BORDER.v });
  }
  surface.set(0, 0, { ...borderCell, char: BORDER.tl });
  surface.set(outerW - 1, 0, { ...borderCell, char: BORDER.tr });
  surface.set(0, outerH - 1, { ...borderCell, char: BORDER.bl });
  surface.set(outerW - 1, outerH - 1, { ...borderCell, char: BORDER.br });

  // Draw title
  if (title) {
    const titleText = ' ' + title + ' ';
    const titleGs = segmentGraphemes(titleText);
    for (let i = 0; i < Math.min(titleGs.length, outerW - 4); i++) {
      surface.set(i + 2, 0, { ...borderCell, char: titleGs[i]! });
    }
  }

  // Blit content
  surface.blit(contentSurf, pl + 1, pt + 1);

  return surface;
}
