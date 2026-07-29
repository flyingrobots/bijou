import { FONT, GLYPH_MAP, fillRect, setPixel } from './recorder.part01.js';
import type { Rgb } from './recorder.part01.js';

function drawSpecialGlyph(
  rgba: Uint8Array,
  width: number,
  height: number,
  x: number,
  y: number,
  cellWidth: number,
  cellHeight: number,
  char: string,
  color: Rgb,
): boolean {
  const midX = x + Math.floor(cellWidth / 2);
  const midY = y + Math.floor(cellHeight / 2);
  const right = x + cellWidth - 2;
  const bottom = y + cellHeight - 2;

  switch (char) {
    case '─':
      fillRect(rgba, width, height, x + 1, midY, cellWidth - 2, 1, color);
      return true;
    case '│':
      fillRect(rgba, width, height, midX, y + 1, 1, cellHeight - 2, color);
      return true;
    case '┌':
      fillRect(rgba, width, height, midX, midY, right - midX + 1, 1, color);
      fillRect(rgba, width, height, midX, midY, 1, bottom - midY + 1, color);
      return true;
    case '┐':
      fillRect(rgba, width, height, x + 1, midY, midX - x, 1, color);
      fillRect(rgba, width, height, midX, midY, 1, bottom - midY + 1, color);
      return true;
    case '└':
      fillRect(rgba, width, height, midX, y + 1, 1, midY - y, color);
      fillRect(rgba, width, height, midX, midY, right - midX + 1, 1, color);
      return true;
    case '┘':
      fillRect(rgba, width, height, x + 1, midY, midX - x, 1, color);
      fillRect(rgba, width, height, midX, y + 1, 1, midY - y, color);
      return true;
    case '▎':
      fillRect(rgba, width, height, x + 1, y + 1, 1, cellHeight - 2, color);
      return true;
    default:
      return false;
  }
}

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

export { drawBitmapGlyph, drawSpecialGlyph };
