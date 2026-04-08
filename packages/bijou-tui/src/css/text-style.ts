import { createSurface, segmentGraphemes, type BijouContext, type Surface } from '@flyingrobots/bijou';

// Inline encodeModifiers to avoid deep import
function encodeModifiers(mods: readonly string[] | undefined): number {
  if (!mods || mods.length === 0) return 0;
  const MAP: Record<string, number> = { bold: 1, dim: 2, strikethrough: 4, inverse: 8, underline: 16, 'curly-underline': 32, 'dotted-underline': 48, 'dashed-underline': 112 };
  let f = 0;
  for (const m of mods) f |= MAP[m] ?? 0;
  return f;
}

export interface StyledTextToken {
  hex?: string;
  bg?: string;
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

export function resolveBCSSTextToken(
  ctx: BijouContext,
  identity: BCSSIdentity,
  base: StyledTextToken = {},
): StyledTextToken {
  const styles = ctx.resolveBCSS(identity);
  return {
    hex: styles['color'] ?? base.hex,
    bg: styles['background'] ?? base.bg,
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
  const token: StyledTextToken = {
    hex: styles['color'] ?? base.hex,
    bg: styles['background'] ?? base.bg,
    modifiers: mergeBCSSModifiers(base.modifiers, styles),
  };

  if (token.hex == null && token.bg == null && (token.modifiers == null || token.modifiers.length === 0)) {
    return text;
  }

  return ctx.style.styled(token as any, text);
}

export function createStyledTextSurfaceWithBCSS(
  text: string,
  width: number,
  ctx: BijouContext | undefined,
  identity: BCSSIdentity,
  base: StyledTextToken = {},
): Surface {
  const safeWidth = Math.max(0, Math.floor(width));
  const surface = createSurface(safeWidth, 1, { char: ' ', empty: false });
  if (safeWidth === 0) return surface;

  if (!ctx) {
    const graphemes = segmentGraphemes(text ?? '');
    for (let x = 0; x < Math.min(safeWidth, graphemes.length); x++) {
      surface.set(x, 0, { char: graphemes[x]!, empty: false });
    }
    return surface;
  }

  const token = resolveBCSSTextToken(ctx, identity, base);
  surface.fill({
    char: ' ',
    fg: token.hex,
    bg: token.bg,
    modifiers: token.modifiers,
    empty: false,
  });
  const graphemes = segmentGraphemes(text ?? '');
  const packed: boolean = 'buffer' in surface;
  const hd = (c: number): number => c >= 97 ? c - 87 : c >= 65 ? c - 55 : c - 48;
  if (packed && token.hex?.length === 7) {
    const fR = (hd(token.hex.charCodeAt(1)) << 4) | hd(token.hex.charCodeAt(2));
    const fG = (hd(token.hex.charCodeAt(3)) << 4) | hd(token.hex.charCodeAt(4));
    const fB = (hd(token.hex.charCodeAt(5)) << 4) | hd(token.hex.charCodeAt(6));
    let bR = -1, bG = 0, bB = 0;
    if (token.bg?.length === 7) { bR = (hd(token.bg.charCodeAt(1)) << 4) | hd(token.bg.charCodeAt(2)); bG = (hd(token.bg.charCodeAt(3)) << 4) | hd(token.bg.charCodeAt(4)); bB = (hd(token.bg.charCodeAt(5)) << 4) | hd(token.bg.charCodeAt(6)); }
    const flags = token.modifiers ? encodeModifiers(token.modifiers) : 0;
    for (let x = 0; x < Math.min(safeWidth, graphemes.length); x++) {
      (surface as any).setRGB(x, 0, graphemes[x]!, fR, fG, fB, bR, bG, bB, flags);
    }
  } else {
    for (let x = 0; x < Math.min(safeWidth, graphemes.length); x++) {
      surface.set(x, 0, {
        char: graphemes[x]!,
        fg: token.hex,
        bg: token.bg,
        modifiers: token.modifiers,
        empty: false,
      });
    }
  }
  return surface;
}
