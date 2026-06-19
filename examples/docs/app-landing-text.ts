import {
  createSurface,
  type Surface,
} from '../../packages/bijou/src/index.js';
import type { LandingTextModifiers } from './app-landing-types.js';

const BRAILLE_BLANK = '\u2800';
const TYPEOF_STRING = typeof '';
type SurfaceTextForegroundCallback = (x: number, y: number, char: string, width: number) => string | undefined;
type SurfaceTextModifiersCallback = (x: number, y: number, char: string, width: number) => readonly string[] | undefined;

function isStringInput(value: string | readonly (readonly string[])[]): value is string {
  return typeof value === TYPEOF_STRING;
}

function isForegroundCallback(
  value: string | SurfaceTextForegroundCallback | undefined,
): value is SurfaceTextForegroundCallback {
  return typeof value === typeof isForegroundCallback;
}

function isModifiersCallback(
  value: readonly string[] | SurfaceTextModifiersCallback | undefined,
): value is SurfaceTextModifiersCallback {
  return typeof value === typeof isModifiersCallback;
}

export function splitGlyphLines(text: string): readonly (readonly string[])[] {
  return text.split(/\r?\n/).map((lineText) => Array.from(lineText));
}

export function fitGlyphLinesToWidth(
  lines: readonly (readonly string[])[],
  maxWidth: number,
): readonly (readonly string[])[] {
  const width = Math.max(0, ...lines.map((lineText) => lineText.length));
  const targetWidth = Math.max(1, Math.min(width, Math.floor(maxWidth)));
  if (width <= targetWidth) return lines;

  return lines.map((lineText) => {
    const fitted: string[] = [];
    for (let x = 0; x < targetWidth; x++) {
      const sourceX = Math.min(width - 1, Math.floor((x / targetWidth) * width));
      fitted.push(lineText[sourceX] ?? ' ');
    }
    return fitted;
  });
}

export function transparentLogoGlyphs(lines: readonly (readonly string[])[]): readonly (readonly string[])[] {
  return lines.map((lineText) => lineText.map((char) => char === BRAILLE_BLANK ? ' ' : char));
}

export function createTransparentTextSurface(
  text: string | readonly (readonly string[])[],
  options: {
    readonly bg?: string;
    readonly fg?: string | ((x: number, y: number, char: string, width: number) => string | undefined);
    readonly modifiers?: readonly string[] | ((x: number, y: number, char: string, width: number) => readonly string[] | undefined);
    readonly transparentSpaces?: boolean;
  } = {},
): Surface {
  const lines: readonly (readonly string[])[] = isStringInput(text)
    ? splitGlyphLines(text)
    : text;
  const width = Math.max(1, ...lines.map((lineText) => lineText.length));
  const height = Math.max(1, lines.length);
  const surface = createSurface(width, height);
  const transparentSpaces = options.transparentSpaces ?? true;

  for (let y = 0; y < height; y++) {
    const lineText = lines[y] ?? [];
    for (let x = 0; x < width; x++) {
      const char = lineText[x] ?? ' ';
      if (char === ' ' && transparentSpaces) {
        surface.set(x, y, { char: ' ', empty: true });
        continue;
      }
      const fg = isForegroundCallback(options.fg) ? options.fg(x, y, char, width) : options.fg;
      const modifiers = isModifiersCallback(options.modifiers)
        ? options.modifiers(x, y, char, width)
        : options.modifiers;
      surface.set(x, y, {
        char,
        bg: options.bg,
        fg,
        modifiers: modifiers === undefined ? undefined : [...modifiers],
        empty: false,
      });
    }
  }

  return surface;
}

export function centerSurfaceHorizontally(content: Surface, width: number): Surface {
  const centered = createSurface(Math.max(1, width), Math.max(1, content.height));
  centered.blit(content, Math.max(0, Math.floor((centered.width - content.width) / 2)), 0);
  return centered;
}

export function createWordmarkSurface(
  lines: readonly (readonly string[])[],
  modifiers: LandingTextModifiers,
): Surface {
  return createTransparentTextSurface(lines, {
    modifiers: (_x, _y, char) => char === ' ' ? undefined : modifiers.bold,
  });
}
