import { createSurface, isPackedSurface, segmentGraphemes, type BijouContext, type Surface, type TextModifier, type TokenValue } from '@flyingrobots/bijou';
import { parseHex, encodeModifiers } from '@flyingrobots/bijou/perf';

export interface StyledTextToken {
  hex?: string;
  bg?: string;
  fgRGB?: [number, number, number];
  bgRGB?: [number, number, number];
  modifiers?: string[];
}

export interface BCSSIdentity {
  type: string;
  id?: string;
  classes?: string[];
}

type BCSSStyles = Record<string, string>;

export function mergeBCSSModifiers(
  base: readonly string[] | undefined,
  styles: BCSSStyles,
): string[] | undefined {
  const modifiers = new Set(base ?? []);

  const fontWeight = styles['font-weight']?.trim().toLowerCase();
  if (fontWeight === 'bold' || fontWeight === '700' || fontWeight === '800' || fontWeight === '900') {
    modifiers.add('bold');
  } else if (fontWeight === 'normal' || fontWeight === '400') {
    modifiers.delete('bold');
  }

  const fontStyle = styles['font-style']?.trim().toLowerCase();
  if (fontStyle === 'italic') {
    modifiers.add('italic');
  } else if (fontStyle === 'normal') {
    modifiers.delete('italic');
  }

  const decoration = styles['text-decoration']?.trim().toLowerCase();
  if (decoration === 'none') {
    modifiers.delete('underline');
    modifiers.delete('curly-underline');
    modifiers.delete('dotted-underline');
    modifiers.delete('dashed-underline');
    modifiers.delete('strikethrough');
    modifiers.delete('strike');
  } else if (decoration) {
    if (decoration.includes('underline')) {
      modifiers.add('underline');
    }
    if (decoration.includes('line-through')) {
      modifiers.add('strikethrough');
      modifiers.delete('strike');
    }
  }

  return modifiers.size > 0 ? Array.from(modifiers) : undefined;
}

function styleModifiers(modifiers: readonly string[] | undefined): TextModifier[] | undefined {
  return modifiers?.filter((modifier): modifier is TextModifier => /^(?:bold|dim|strikethrough|inverse|(?:curly-|dotted-|dashed-)?underline)$/u.test(modifier));
}

export function toStyleToken(token: StyledTextToken): TokenValue {
  return { hex: token.hex ?? '', bg: token.bg, fgRGB: token.fgRGB, bgRGB: token.bgRGB, modifiers: styleModifiers(token.modifiers) };
}

export function resolveBCSSTextToken(
  ctx: BijouContext,
  identity: BCSSIdentity,
  base: StyledTextToken = {},
): StyledTextToken {
  const styles = ctx.resolveBCSS(identity);
  const hex = styles['color'] ?? base.hex;
  const bg = styles['background'] ?? base.bg;
  return {
    hex,
    bg,
    fgRGB: styles['color'] != null ? (hex ? parseHex(hex) : undefined) : base.fgRGB,
    bgRGB: styles['background'] != null ? (bg ? parseHex(bg) : undefined) : base.bgRGB,
    modifiers: mergeBCSSModifiers(base.modifiers, styles),
  };
}

export function styleTextWithBCSS(
  text: string,
  ctx: BijouContext | undefined,
  identity: BCSSIdentity,
  base: StyledTextToken = {},
): string {
  if (!ctx) return text;
  const styles = ctx.resolveBCSS(identity);
  const hex = styles['color'] ?? base.hex;
  const bg = styles['background'] ?? base.bg;
  const token: StyledTextToken = {
    hex,
    bg,
    fgRGB: styles['color'] != null ? (hex ? parseHex(hex) : undefined) : base.fgRGB,
    bgRGB: styles['background'] != null ? (bg ? parseHex(bg) : undefined) : base.bgRGB,
    modifiers: mergeBCSSModifiers(base.modifiers, styles),
  };

  if (token.hex == null && token.bg == null && (token.modifiers == null || token.modifiers.length === 0)) {
    return text;
  }

  return ctx.style.styled(toStyleToken(token), text);
}

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
  const fg = packed ? (token.fgRGB ?? (token.hex ? parseHex(token.hex) : undefined)) : undefined;
  if (packed && fg) {
    const [fR, fG, fB] = fg;
    const bg = token.bgRGB ?? (token.bg ? parseHex(token.bg) : undefined);
    let bR = -1, bG = 0, bB = 0;
    if (bg) { bR = bg[0]; bG = bg[1]; bB = bg[2]; }
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
