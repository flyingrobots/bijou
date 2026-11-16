import { createSurface, type Surface } from '../../packages/bijou/src/index.js';
import { rasterizeSurface } from '../../packages/bijou-node/src/index.js';
import { MonoGlyphs } from './mono-font.js';

/** Box drawing, block elements, and Braille: Bijou's recorder draws these as exact shapes that join cell to cell. */
const SHAPES = /[─-▟⠀-⣿]/u;

export interface MonoRasterOptions {
  readonly cellWidth: number;
  readonly cellHeight: number;
  readonly foreground: string;
  readonly background: string;
}

/** A copy of the surface with every text cell's character replaced; shape cells and colours are kept. */
function withText(surface: Surface, isText: (char: string) => boolean, replacement: string): Surface {
  const out = createSurface(surface.width, surface.height);
  for (let y = 0; y < surface.height; y++) {
    for (let x = 0; x < surface.width; x++) {
      const cell = surface.get(x, y);
      out.set(x, y, isText(cell.char) ? { ...cell, char: replacement } : cell);
    }
  }
  return out;
}

/**
 * Rasterize a frame with text in JetBrains Mono. Bijou's recorder still paints backgrounds and shape glyphs; a
 * second pass with each text cell filled solid gives the colour the recorder would use for that text (with dim
 * and inverse applied), and the glyph's coverage blends that colour over the background.
 */
export function rasterizeMono(surface: Surface, glyphs: MonoGlyphs, options: MonoRasterOptions): Uint8Array {
  const isText = (char: string): boolean => char !== '' && char !== ' ' && !SHAPES.test(char);
  const base = rasterizeSurface(withText(surface, isText, ' '), options);
  const solid = rasterizeSurface(withText(surface, isText, '█'), options);
  const { cellWidth: cw, cellHeight: ch } = options;
  const rowBytes = surface.width * cw * 4;
  for (let y = 0; y < surface.height; y++) {
    for (let x = 0; x < surface.width; x++) {
      const cell = surface.get(x, y);
      if (cell.empty || !isText(cell.char)) continue;
      const mask = glyphs.mask(cell.char, (cell.modifiers ?? []).includes('bold'));
      if (mask === undefined) continue;
      const centre = (y * ch + (ch >> 1)) * rowBytes + (x * cw + (cw >> 1)) * 4;
      const fg = [solid[centre] ?? 0, solid[centre + 1] ?? 0, solid[centre + 2] ?? 0];
      for (let py = 0; py < ch; py++) {
        for (let px = 0; px < cw; px++) {
          const a = Math.min(1, mask[py * cw + px] ?? 0);
          if (a === 0) continue;
          const i = (y * ch + py) * rowBytes + (x * cw + px) * 4;
          for (let k = 0; k < 3; k++) base[i + k] = Math.round((base[i + k] ?? 0) * (1 - a) + (fg[k] ?? 0) * a);
        }
      }
    }
  }
  return base;
}
