import {
  createSurface,
  isPackedSurface,
  segmentGraphemes,
  type BijouContext,
  type Surface,
} from '@flyingrobots/bijou';
import { parseHex, encodeModifiers } from '@flyingrobots/bijou/perf';
import {
  resolveBCSSTextToken,
  type BCSSIdentity,
  type StyledTextToken,
} from './text-style-token.js';

function fillStyledText(
  surface: Surface,
  text: string,
  ctx: BijouContext | undefined,
  identity: BCSSIdentity,
  base: StyledTextToken,
): void {
  const safeWidth = surface.width;
  if (safeWidth === 0) return;

  if (!ctx) {
    surface.fill({ char: ' ', empty: false });
    const graphemes = segmentGraphemes(text);
    for (let x = 0; x < Math.min(safeWidth, graphemes.length); x++) {
      const grapheme = graphemes[x] ?? ' ';
      surface.set(x, 0, { char: grapheme, empty: false });
    }
    return;
  }

  const token = resolveBCSSTextToken(ctx, identity, base);
  surface.fill({
    char: ' ',
    fg: token.hex,
    bg: token.bg,
    fgRGB: token.fgRGB,
    bgRGB: token.bgRGB,
    modifiers: token.modifiers,
    empty: false,
  });
  const graphemes = segmentGraphemes(text);
  const packed = isPackedSurface(surface);
  const fg = packed
    ? (token.fgRGB ?? (token.hex ? parseHex(token.hex) : undefined))
    : undefined;
  if (packed && fg) {
    const [fR, fG, fB] = fg;
    const bg = token.bgRGB ?? (token.bg ? parseHex(token.bg) : undefined);
    let bR = -1,
      bG = 0,
      bB = 0;
    if (bg) {
      bR = bg[0];
      bG = bg[1];
      bB = bg[2];
    }
    const flags = token.modifiers ? encodeModifiers(token.modifiers) : 0;
    for (let x = 0; x < Math.min(safeWidth, graphemes.length); x++) {
      surface.setRGB(x, 0, graphemes[x] ?? ' ', fR, fG, fB, bR, bG, bB, flags);
    }
  } else {
    for (let x = 0; x < Math.min(safeWidth, graphemes.length); x++) {
      surface.set(x, 0, {
        char: graphemes[x] ?? ' ',
        fg: token.hex,
        bg: token.bg,
        modifiers: token.modifiers,
        empty: false,
      });
    }
  }
}

export {
  mergeBCSSModifiers,
  resolveBCSSTextToken,
  styleTextWithBCSS,
  toStyleToken,
} from './text-style-token.js';
export type { BCSSIdentity, StyledTextToken } from './text-style-token.js';

export function createStyledTextSurfaceWithBCSS(
  text: string,
  width: number,
  ctx: BijouContext | undefined,
  identity: BCSSIdentity,
  base: StyledTextToken = {},
): Surface {
  const safeWidth = Number.isFinite(width) ? Math.max(0, Math.floor(width)) : 0;
  const surface = createSurface(safeWidth, 1, { char: ' ', empty: false });
  fillStyledText(surface, text, ctx, identity, base);
  return surface;
}

export function paintStyledTextSurfaceWithBCSS(
  surface: Surface | undefined,
  text: string,
  width: number,
  ctx: BijouContext | undefined,
  identity: BCSSIdentity,
  base: StyledTextToken = {},
): Surface {
  const safeWidth = Number.isFinite(width) ? Math.max(0, Math.floor(width)) : 0;

  if (surface?.width !== safeWidth || surface.height !== 1) {
    return createStyledTextSurfaceWithBCSS(text, width, ctx, identity, base);
  }

  fillStyledText(surface, text, ctx, identity, base);
  return surface;
}
