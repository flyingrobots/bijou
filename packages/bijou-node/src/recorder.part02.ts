import { FONT, GLYPH_MAP, fillRect, setPixel } from './recorder.part01.js';
import type { Rgb } from './recorder.part01.js';

function drawBitmapGlyph(
  rgba: Uint8Array,
  width: number,
  height: number,
  x: number,
  y: number,
  char: string,
  color: Rgb,
): void {
  const glyphIndex = GLYPH_MAP.get(char);
  if (glyphIndex == null) {
    fillRect(rgba, width, height, x + 1, y + 2, 3, 3, color);
    return;
  }

  const offset = glyphIndex * FONT.width;
  for (let col = 0; col < FONT.width; col++) {
    const bits = FONT.fontData[offset + col] ?? 0;
    for (let row = 0; row < FONT.height; row++) {
      if (((bits >> row) & 1) === 1) {
        setPixel(rgba, width, height, x + col, y + row, color);
      }
    }
  }
}

export { drawBitmapGlyph };
