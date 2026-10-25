import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { FontRasterizer } from '../examples/markdown-font/font-rasterizer.js';

const SOURCE = new URL('../assets/fonts/space-grotesk/SpaceGrotesk.ttf', import.meta.url);
const OUTPUT = new URL('../assets/space-grotesk-ascii.json', import.meta.url);
const PIN = 'acad6de1fc93436f5c0f1f4137751ef04f1aea3063e7036535970ffcfbd79f72';
const bytes = readFileSync(SOURCE);
if (createHash('sha256').update(bytes).digest('hex') !== PIN) throw new Error('Space Grotesk font digest mismatch.');
const text = Array.from({ length: 95 }, (_, index) => String.fromCharCode(32 + index)).join('');
const font = new FontRasterizer(bytes, 'Space Grotesk').forText(text);
if (font === undefined) throw new Error('Space Grotesk ASCII coverage is incomplete.');
const glyphs = Array.from(text, (character) => {
  const glyph = font.glyph(character);
  const g = glyph.geometry;
  const mask = new Uint8Array(Math.ceil(g.columns * g.rows / 8));
  for (let y = 0; y < g.rows; y++) {
    for (let x = 0; x < g.columns; x++) {
      if (!glyph.sample(g.left + (x + 0.5) * g.width / g.columns, g.top + (y + 0.5) * g.height / g.rows)) continue;
      const bit = y * g.columns + x;
      mask[Math.floor(bit / 8)] = (mask[Math.floor(bit / 8)] ?? 0) | (1 << (bit % 8));
    }
  }
  return { character, ...g, mask: Buffer.from(mask).toString('base64') };
});
const json = JSON.stringify({ version: 1, family: font.family, lineHeight: font.lineHeight, fontSha256: PIN, glyphs }) + '\n';
if (process.argv.includes('--check')) {
  if (readFileSync(OUTPUT, 'utf8') !== json) throw new Error('Space Grotesk ASCII atlas is stale.');
} else writeFileSync(OUTPUT, json);
