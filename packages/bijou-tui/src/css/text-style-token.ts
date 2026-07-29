import type {
  BijouContext,
  TextModifier,
  TokenValue,
} from '@flyingrobots/bijou';
import { parseHex } from '@flyingrobots/bijou/perf';

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

type BCSSStyles = Readonly<Record<string, string>>;

export function mergeBCSSModifiers(
  base: readonly string[] | undefined,
  styles: BCSSStyles,
): string[] | undefined {
  const modifiers = new Set(base ?? []);
  const fontWeight = styles['font-weight']?.trim().toLowerCase();
  if (
    fontWeight === 'bold' ||
    fontWeight === '700' ||
    fontWeight === '800' ||
    fontWeight === '900'
  ) {
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
    for (const modifier of [
      'underline',
      'curly-underline',
      'dotted-underline',
      'dashed-underline',
      'strikethrough',
      'strike',
    ]) {
      modifiers.delete(modifier);
    }
  } else if (decoration) {
    if (decoration.includes('underline')) modifiers.add('underline');
    if (decoration.includes('line-through')) {
      modifiers.add('strikethrough');
      modifiers.delete('strike');
    }
  }
  return modifiers.size > 0 ? Array.from(modifiers) : undefined;
}

function styleModifiers(
  modifiers: readonly string[] | undefined,
): TextModifier[] | undefined {
  return modifiers?.filter((modifier): modifier is TextModifier =>
    /^(?:bold|dim|strikethrough|inverse|(?:curly-|dotted-|dashed-)?underline)$/u.test(
      modifier,
    ),
  );
}

export function toStyleToken(token: StyledTextToken): TokenValue {
  return {
    hex: token.hex ?? '',
    bg: token.bg,
    fgRGB: token.fgRGB,
    bgRGB: token.bgRGB,
    modifiers: styleModifiers(token.modifiers),
  };
}

export function resolveBCSSTextToken(
  context: BijouContext,
  identity: BCSSIdentity,
  base: StyledTextToken = {},
): StyledTextToken {
  const styles = context.resolveBCSS(identity);
  const hex = styles['color'] ?? base.hex;
  const background = styles['background'] ?? base.bg;
  return {
    hex,
    bg: background,
    fgRGB:
      styles['color'] != null ? (hex ? parseHex(hex) : undefined) : base.fgRGB,
    bgRGB:
      styles['background'] != null
        ? background
          ? parseHex(background)
          : undefined
        : base.bgRGB,
    modifiers: mergeBCSSModifiers(base.modifiers, styles),
  };
}

export function styleTextWithBCSS(
  text: string,
  context: BijouContext | undefined,
  identity: BCSSIdentity,
  base: StyledTextToken = {},
): string {
  if (context === undefined) return text;
  const token = resolveBCSSTextToken(context, identity, base);
  if (
    token.hex == null &&
    token.bg == null &&
    (token.modifiers == null || token.modifiers.length === 0)
  ) {
    return text;
  }
  return context.style.styled(toStyleToken(token), text);
}
