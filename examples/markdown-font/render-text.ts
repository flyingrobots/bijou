import { surfaceToString, type BijouContext } from '@flyingrobots/bijou';
import { layoutRasterText, rasterizeText, rasterToGlyphSurface, type RasterFont } from '../../packages/bijou-tui/src/index.js';

/** Wrap by actual glyph geometry, then render the requested pixel height. */
export function renderRasterText(text: string, font: RasterFont, ctx: BijouContext, width: number, size: number, charge: (cells: number) => void): string {
  const lines: string[] = [];
  let line = '';
  const fits = (value: string): boolean => {
    const layout = layoutRasterText(value, font);
    return Math.ceil(layout.width * size / layout.height) <= width * 2;
  };
  for (const word of text.split(/\s+/u)) {
    const candidate = line === '' ? word : `${line} ${word}`;
    if (line !== '' && !fits(candidate)) { lines.push(line); line = ''; }
    for (const character of (line === '' ? word : ` ${word}`)) {
      if (line !== '' && !fits(line + character)) { lines.push(line); line = ''; }
      line += character;
    }
  }
  if (line !== '') lines.push(line);
  const rows = Math.ceil(size / 4);
  return lines.map((value) => {
    charge(width * rows);
    const frame = rasterizeText(value, font, { height: size });
    const columns = Math.min(width, Math.ceil(frame.width / 2));
    const surface = rasterToGlyphSurface(frame, {
      columns, rows, renderer: { kind: 'braille' }, colorMode: 'none',
      fit: 'contain', cellAspectRatio: 0.5,
    });
    const color = ctx.border('primary').hex;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) surface.set(x, y, { ...surface.get(x, y), fg: color });
    }
    return surfaceToString(surface, ctx.style);
  }).join('\n');
}
