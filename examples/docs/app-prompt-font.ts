import { RasterFont, RasterFontGlyph } from '../../packages/bijou-tui/src/index.js';
import PROMPT_ATLAS from '../../assets/space-grotesk-ascii.json' with { type: 'json' };
import { decodeCanonicalBase64 } from '../_shared/base64.js';

// The content digest is the atlas protocol's immutable source identifier.
type FontSourceId = 'acad6de1fc93436f5c0f1f4137751ef04f1aea3063e7036535970ffcfbd79f72';
const SOURCE_DIGEST = 'acad6de1fc93436f5c0f1f4137751ef04f1aea3063e7036535970ffcfbd79f72' satisfies FontSourceId;
const EXPECTED_FONT = {
  family: 'Space Grotesk',
  sha256: SOURCE_DIGEST,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function record(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) throw new Error('Invalid prompt font record.');
  return value;
}

function number(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('Invalid prompt font metric.');
  return value;
}

interface GlyphFields {
  readonly character?: unknown;
  readonly mask?: unknown;
  readonly advance?: unknown;
  readonly left?: unknown;
  readonly top?: unknown;
  readonly width?: unknown;
  readonly height?: unknown;
  readonly columns?: unknown;
  readonly rows?: unknown;
}

interface AtlasFields {
  readonly version?: unknown;
  readonly family?: unknown;
  readonly glyphs?: unknown;
  readonly fontSha256?: unknown;
  readonly lineHeight?: unknown;
}

function entry(value: unknown): [string, RasterFontGlyph] {
  const g: GlyphFields = record(value);
  if (typeof g.character !== 'string' || typeof g.mask !== 'string') throw new Error('Invalid prompt font glyph.');
  const mask = decodeCanonicalBase64(g.mask);
  if (mask === undefined) throw new Error('Invalid prompt coverage encoding.');
  return [g.character, new RasterFontGlyph({
    advance: number(g.advance), left: number(g.left), top: number(g.top),
    width: number(g.width), height: number(g.height), columns: number(g.columns), rows: number(g.rows),
  }, mask)];
}

const data: AtlasFields = record(PROMPT_ATLAS);
if (data.version !== 1 || data.family !== EXPECTED_FONT.family || !Array.isArray(data.glyphs) || data.glyphs.length !== 95
  || data.fontSha256 !== EXPECTED_FONT.sha256) {
  throw new Error('Invalid Space Grotesk prompt atlas.');
}

export const PROMPT_FONT = new RasterFont({
  family: data.family, lineHeight: number(data.lineHeight), glyphs: new Map(data.glyphs.map(entry)),
});
