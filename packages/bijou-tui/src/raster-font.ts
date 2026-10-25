import { RasterFontGlyph } from './raster-font-glyph.js';

/** Caller-supplied, precompiled glyph coverage. Font decoding stays outside the renderer. */
export interface RasterFontOptions {
  readonly family: string;
  readonly lineHeight: number;
  readonly glyphs: ReadonlyMap<string, RasterFontGlyph>;
  readonly fallback?: string;
}

/** Immutable font metrics and an owned character lookup; no filesystem or font parser. */
export class RasterFont {
  public readonly family: string;
  public readonly lineHeight: number;
  readonly #glyphs: ReadonlyMap<string, RasterFontGlyph>;
  readonly #fallback: string | undefined;

  public constructor(options: RasterFontOptions) {
    if (options.family.length === 0 || !Number.isFinite(options.lineHeight) || options.lineHeight <= 0
      || options.glyphs.size < 1 || options.glyphs.size > 4096) {
      throw new RangeError('Invalid raster font metrics or glyph count.');
    }
    for (const [character, glyph] of options.glyphs) {
      const codePoint = character.codePointAt(0);
      if (Array.from(character).length !== 1 || codePoint === undefined || codePoint < 32
        || (codePoint >= 127 && codePoint <= 159) || !(glyph instanceof RasterFontGlyph)) {
        throw new TypeError('Raster fonts require printable code points and validated glyphs.');
      }
    }
    if (options.fallback !== undefined && !options.glyphs.has(options.fallback)) {
      throw new RangeError('Raster font fallback glyph is missing.');
    }
    this.family = options.family;
    this.lineHeight = options.lineHeight;
    this.#glyphs = new Map(options.glyphs);
    this.#fallback = options.fallback;
    Object.freeze(this);
  }

  /** Missing characters throw unless the constructor explicitly selects a fallback. */
  public glyph(character: string): RasterFontGlyph {
    const glyph = this.#glyphs.get(character) ?? (this.#fallback === undefined ? undefined : this.#glyphs.get(this.#fallback));
    if (glyph === undefined) throw new RangeError(`Raster font has no glyph for ${JSON.stringify(character)}.`);
    return glyph;
  }
}

export interface PositionedRasterGlyph {
  readonly glyph: RasterFontGlyph;
  readonly x: number;
  readonly y: number;
}

export interface RasterTextLayout {
  readonly glyphs: readonly PositionedRasterGlyph[];
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
  readonly advance: number;
}

/** Code-point layout with explicit advances and newlines; no shaping, bidi or kerning. */
export function layoutRasterText(text: string, font: RasterFont): RasterTextLayout {
  if (text.length > 20000) throw new RangeError('Raster text exceeds 20000 UTF-16 code units.');
  const glyphs: PositionedRasterGlyph[] = [];
  let x = 0;
  let y = 0;
  let left = 0;
  let top = 0;
  let right = 0;
  let bottom = 0;
  let advance = 0;
  for (const character of text) {
    if (character === '\n') { x = 0; y += font.lineHeight; continue; }
    const glyph = font.glyph(character);
    const g = glyph.geometry;
    glyphs.push(Object.freeze({ glyph, x, y }));
    left = Math.min(left, x + g.left);
    top = Math.min(top, y + g.top);
    right = Math.max(right, x + g.left + g.width, x + g.advance);
    bottom = Math.max(bottom, y + g.top + g.height);
    x += g.advance;
    advance = Math.max(advance, x);
  }
  if (![left, top, right, bottom, advance, y].every(Number.isFinite)) throw new RangeError('Raster text metrics overflow.');
  return Object.freeze({ glyphs: Object.freeze(glyphs), left, top, width: right - left, height: bottom - top, advance });
}
