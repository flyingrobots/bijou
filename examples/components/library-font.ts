import { readFileSync } from 'node:fs';
import { RasterFont, RasterFontGlyph } from '../../packages/bijou-tui/src/index.js';

type FontMaskEncodingKind = 'base64';
const MASK_ENCODING = 'base64' satisfies FontMaskEncodingKind;
// The content digest is the atlas protocol's immutable source identifier.
type FontSourceId = '8cd08d97e89c24d0aa92edd2f0f4c8ee6195eee9b7c9f154865a58b02f0c1c0d';
const SOURCE_DIGEST = '8cd08d97e89c24d0aa92edd2f0f4c8ee6195eee9b7c9f154865a58b02f0c1c0d' satisfies FontSourceId;
const EXPECTED_FONT = {
  family: 'DM Sans',
  sha256: SOURCE_DIGEST,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function record(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) throw new Error('Invalid title font record.');
  return value;
}

function number(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('Invalid title font metric.');
  return value;
}

function entry(value: unknown): [string, RasterFontGlyph] {
  const g = record(value);
  if (typeof g['character'] !== 'string' || typeof g['mask'] !== 'string') throw new Error('Invalid title font glyph.');
  const mask = Buffer.from(g['mask'], MASK_ENCODING);
  if (mask.toString(MASK_ENCODING) !== g['mask']) throw new Error('Invalid title coverage encoding.');
  return [g['character'], new RasterFontGlyph({
    advance: number(g['advance']), left: number(g['left']), top: number(g['top']),
    width: number(g['width']), height: number(g['height']), columns: number(g['columns']), rows: number(g['rows']),
  }, mask)];
}

const raw: unknown = JSON.parse(readFileSync(new URL('../../assets/dm-sans-ascii.json', import.meta.url), 'utf8'));
const data = record(raw);
if (data['version'] !== 1 || data['family'] !== EXPECTED_FONT.family || !Array.isArray(data['glyphs']) || data['glyphs'].length !== 95
  || data['fontSha256'] !== EXPECTED_FONT.sha256) {
  throw new Error('Invalid DM Sans title atlas.');
}

export const TITLE_FONT = new RasterFont({
  family: data['family'], lineHeight: number(data['lineHeight']), glyphs: new Map(data['glyphs'].map(entry)),
});
