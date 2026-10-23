import { readFileSync } from 'node:fs';
import { RasterFont, RasterFontGlyph, layoutRasterText } from '../../packages/bijou-tui/src/index.js';

// This atlas protocol stores bit-packed coverage in canonical base64.
type FontMaskEncodingKind = 'base64';
const MASK_ENCODING = 'base64' satisfies FontMaskEncodingKind;

function object(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) throw new Error('Invalid title font record.');
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function number(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('Invalid title font coordinate.');
  return value;
}

function glyph(value: unknown): RasterFontGlyph {
  const g = object(value);
  if (typeof g.mask !== 'string') throw new Error('Missing title glyph mask.');
  const mask = Buffer.from(g.mask, MASK_ENCODING);
  if (mask.toString(MASK_ENCODING) !== g.mask) throw new Error('Invalid title glyph mask.');
  return new RasterFontGlyph({
    advance: number(g.advance),
    left: number(g.left) + number(g.advance) / 2, top: number(g.top),
    width: number(g.width), height: number(g.height),
    columns: number(g.columns), rows: number(g.rows),
  }, mask);
}

const raw = JSON.parse(readFileSync(new URL('../../assets/jacquard12-bijou.json', import.meta.url), 'utf8')) as unknown;
const data = object(raw);
const EXPECTED_FONT = { family: 'Jacquard 12', version: 1 };
if (data.family !== EXPECTED_FONT.family || data.version !== EXPECTED_FONT.version
  || !Array.isArray(data.glyphs) || data.glyphs.length < 1 || data.glyphs.length > 32) {
  throw new Error('Invalid Jacquard title font asset.');
}
if (typeof data.text !== 'string' || Array.from(data.text).length !== data.glyphs.length) {
  throw new Error('Invalid title font character lookup.');
}
const characters = Array.from(data.text);
export const CYLINDER_FONT = new RasterFont({
  family: EXPECTED_FONT.family,
  lineHeight: 100,
  glyphs: new Map(data.glyphs.map((value, index) => [characters[index] ?? '', glyph(value)])),
});
export const CYLINDER_LAYOUT = layoutRasterText(data.text, CYLINDER_FONT);
export const CYLINDER_ADVANCE = CYLINDER_LAYOUT.advance;
