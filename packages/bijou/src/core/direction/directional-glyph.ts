import type { LayoutDirection } from './direction.js';

export function mirrorGlyph(glyph: string, direction: LayoutDirection): string {
  throw new Error(`not implemented: ${JSON.stringify([glyph, direction])}`);
}

export function mirrorGlyphs(text: string, direction: LayoutDirection): string {
  throw new Error(`not implemented: ${JSON.stringify([text, direction])}`);
}
