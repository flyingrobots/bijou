import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import opentype from 'opentype.js';
import { rasterizeSvgToRgba } from '../examples/docs/svg-raster.js';

const FONT = new URL('../assets/fonts/jacquard12/Jacquard12-Regular.ttf', import.meta.url);
const OUTPUT = new URL('../assets/jacquard12-bijou.json', import.meta.url);
const PIN = 'b1560583565a37f3d3a25cf2572df3efd2d773ecdcbb459dcd7ea0398cb840d1';
const bytes = readFileSync(FONT);
if (createHash('sha256').update(bytes).digest('hex') !== PIN) throw new Error('Jacquard 12 font digest mismatch.');
const font = opentype.parse(Uint8Array.from(bytes).buffer);
const text = 'Bijou';
const size = 100;
const wordBounds = font.getPath(text, 0, 0, size).getBoundingBox();
const centerY = (wordBounds.y1 + wordBounds.y2) / 2;
let offset = 0;
const glyphs = font.stringToGlyphs(text).map((glyph) => {
  const advance = (glyph.advanceWidth ?? 0) * size / font.unitsPerEm;
  const bounds = glyph.getPath(0, 0, size).getBoundingBox();
  const width = bounds.x2 - bounds.x1;
  const height = bounds.y2 - bounds.y1;
  if (advance <= 0 || width <= 0 || height <= 0) throw new Error('Empty Jacquard title glyph.');
  const path = glyph.getPath(-bounds.x1, -bounds.y1, size).toPathData(4);
  const svg = `<svg viewBox="0 0 ${String(width)} ${String(height)}"><path d="${path}"/></svg>`;
  const columns = Math.ceil(width * 2);
  const rows = Math.ceil(height * 2);
  const rgba = rasterizeSvgToRgba(svg, { width: columns, height: rows });
  const mask = new Uint8Array(Math.ceil(columns * rows / 8));
  for (let index = 0; index < columns * rows; index++) {
    if ((rgba.data[index * 4 + 3] ?? 0) > 0) {
      const byte = Math.floor(index / 8);
      mask[byte] = (mask[byte] ?? 0) | (1 << (index % 8));
    }
  }
  const result = {
    offset, advance, left: bounds.x1 - advance / 2, top: bounds.y1 - centerY,
    width, height, columns, rows, mask: Buffer.from(mask).toString('base64'),
  };
  offset += advance;
  return result;
});
const json = JSON.stringify({ version: 1, family: 'Jacquard 12', fontSha256: PIN, text, glyphs }) + '\n';
if (process.argv.includes('--check')) {
  if (readFileSync(OUTPUT, 'utf8') !== json) throw new Error('Jacquard title geometry is stale.');
} else {
  writeFileSync(OUTPUT, json);
}
