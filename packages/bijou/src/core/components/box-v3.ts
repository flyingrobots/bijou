import { createSurface, type Surface, type Cell } from '../../ports/surface.js';
import { resolveSafeCtx as resolveCtx } from '../resolve-ctx.js';
import { segmentGraphemes } from '../text/grapheme.js';
import { type BoxOptions, type HeaderBoxOptions } from './box.js';
import { applyBCSSCellTextStyles } from './bcss-style.js';
import { createSegmentSurface, createTextSurface, tokenToCellStyle } from './surface-text.js';

const BORDER = { tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│' };

/**
 * Render a bordered box around a Surface.
 * 
 * Returns a new Surface containing the box and the nested content.
 */
export function boxSurface(content: Surface | string, options: BoxOptions = {}): Surface {
  const ctx = resolveCtx(options.ctx);
  const { title, width: fixedWidth, padding = {} } = options;
  const bcss = ctx?.resolveBCSS({ type: 'Box', id: options.id, classes: options.class?.split(' ') }) ?? {};
  
  const pt = padding.top ?? 0;
  const pb = padding.bottom ?? 0;
  const pl = padding.left ?? 0;
  const pr = padding.right ?? 0;

  let contentSurf: Surface;
  if (typeof content === 'string') {
    contentSurf = createTextSurface(content);
  } else {
    contentSurf = content;
  }

  const innerW = contentSurf.width + pl + pr;
  const innerH = contentSurf.height + pt + pb;
  
  const outerW = fixedWidth ?? (innerW + 2);
  const outerH = innerH + 2;
  
  const surface = createSurface(outerW, outerH);
  const fillStyle = applyBCSSCellTextStyles({
    fg: undefined,
    bg: undefined,
    modifiers: undefined,
  }, bcss);
  surface.fill({
    char: options.fillChar || ' ',
    bg: fillStyle.bg,
    fg: fillStyle.fg,
    modifiers: fillStyle.modifiers,
    empty: false,
  });

  const borderToken = options.borderToken || ctx?.border('primary');
  const borderStyle = applyBCSSCellTextStyles({
    fg: borderToken?.hex ?? '#ffffff',
    bg: borderToken?.bg,
    modifiers: borderToken?.modifiers as any,
  }, bcss);
  const borderCell: Cell = { 
    char: ' ', 
    fg: borderStyle.fg,
    bg: borderStyle.bg,
    modifiers: borderStyle.modifiers,
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
  if (title && outerW >= 4) {
    const titleText = ` ${title} `;
    const titleGs = segmentGraphemes(titleText);
    const available = outerW - 4;
    const titleLen = Math.min(titleGs.length, available);
    for (let i = 0; i < titleLen; i++) {
      surface.set(i + 2, 0, { ...borderCell, char: titleGs[i]! });
    }
  }

  // Blit content
  surface.blit(contentSurf, pl + 1, pt + 1);

  return surface;
}

export const boxV3 = boxSurface;

/**
 * Render a header box as a Surface for V3-native composition.
 *
 * Unlike {@link headerBox}, this always returns a Surface and is intended
 * for use inside framed apps or other surface-first render paths.
 */
export function headerBoxSurface(label: string, options: HeaderBoxOptions = {}): Surface {
  const ctx = resolveCtx(options.ctx);
  const safeLabel = label ?? '';
  const detail = options.detail ?? '';
  const labelToken = options.labelToken ?? ctx?.semantic('primary');
  const mutedToken = ctx?.semantic('muted');

  const segments = [];
  if (safeLabel.length > 0) {
    segments.push({ text: safeLabel, style: tokenToCellStyle(labelToken) });
  }
  if (detail.length > 0) {
    segments.push({
      text: safeLabel.length > 0 ? `  ${detail}` : detail,
      style: tokenToCellStyle(mutedToken),
    });
  }

  return boxSurface(createSegmentSurface(segments), options);
}
