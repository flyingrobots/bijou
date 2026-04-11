import { createSurface, segmentGraphemes, type BijouContext, type Surface } from '@flyingrobots/bijou';
import { parseHex, encodeModifiers } from '@flyingrobots/bijou/perf';

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

/**
 * Fill a surface with styled text graphemes. Shared implementation used by
 * both the create and paint paths to avoid logic duplication.
 */
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
    // Fill all cells first to clear stale content from previous paints,
    // then overwrite with the new graphemes.
    surface.fill({ char: ' ', empty: false });
    const graphemes = segmentGraphemes(text);
    for (let x = 0; x < Math.min(safeWidth, graphemes.length); x++) {
      surface.set(x, 0, { char: graphemes[x]!, empty: false });
    }
    return;
  }

  const token = resolveBCSSTextToken(ctx, identity, base);
  surface.fill({
    char: ' ',
    fg: token.hex,
    bg: token.bg,
    modifiers: token.modifiers,
    empty: false,
  });
  const graphemes = segmentGraphemes(text);
  const packed: boolean = 'buffer' in surface;
  const fg = packed && token.hex ? parseHex(token.hex) : undefined;
  if (fg) {
    const [fR, fG, fB] = fg;
    const bg = token.bg ? parseHex(token.bg) : undefined;
    let bR = -1, bG = 0, bB = 0;
    if (bg) { bR = bg[0]; bG = bg[1]; bB = bg[2]; }
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

/**
 * Repaint an existing surface in-place with styled text. Zero allocation
 * when the surface width already matches — only cell values are mutated.
 * Falls back to creating a new surface when the width changed (resize).
 */
export function paintStyledTextSurfaceWithBCSS(
  surface: Surface | undefined,
  text: string,
  width: number,
  ctx: BijouContext | undefined,
  identity: BCSSIdentity,
  base: StyledTextToken = {},
): Surface {
  const safeWidth = Number.isFinite(width) ? Math.max(0, Math.floor(width)) : 0;

  // Need a new surface if none exists or width changed.
  if (surface == null || surface.width !== safeWidth || surface.height !== 1) {
    return createStyledTextSurfaceWithBCSS(text, width, ctx, identity, base);
  }

  fillStyledText(surface, text, ctx, identity, base);
  return surface;
}
