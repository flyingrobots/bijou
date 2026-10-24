import opentype from 'opentype.js';
import { RasterFont, RasterFontGlyph } from '../../packages/bijou-tui/src/index.js';
import { rasterizeSvgToRgba } from '../docs/svg-raster.js';

/** Demo adapter: decode TTF/OTF files outside Bijou core. */
export class FontRasterizer {
  readonly #font: opentype.Font;
  readonly #family: string;
  readonly #glyphs = new Map<string, RasterFontGlyph>();

  public constructor(bytes: Uint8Array, family: string) {
    if (bytes.length === 0 || bytes.length > 8_388_608) throw new Error('Fonts must be between 1 byte and 8 MiB.');
    this.#font = opentype.parse(Uint8Array.from(bytes).buffer);
    this.#family = family;
  }

  /** Unsupported text stays readable through the normal Markdown heading renderer. */
  public forText(text: string): RasterFont | undefined {
    if (text.length > 256 || text.trim() === '') return undefined;
    const glyphs = new Map<string, RasterFontGlyph>();
    for (const character of text) {
      const code = character.codePointAt(0) ?? 0;
      if (code < 32 || (code >= 127 && code <= 159) || this.#font.charToGlyphIndex(character) === 0) return undefined;
      let glyph = this.#glyphs.get(character);
      if (glyph === undefined) {
        glyph = compileGlyph(this.#font, character);
        if (this.#glyphs.size < 512) this.#glyphs.set(character, glyph);
      }
      glyphs.set(character, glyph);
    }
    return new RasterFont({ family: this.#family, lineHeight: 48, glyphs });
  }
}

function compileGlyph(font: opentype.Font, character: string): RasterFontGlyph {
  const glyph = font.charToGlyph(character);
  const advance = (glyph.advanceWidth ?? 0) * 48 / font.unitsPerEm;
  const bounds = glyph.getPath(0, 0, 48).getBoundingBox();
  const width = Math.max(1, bounds.x2 - bounds.x1);
  const height = Math.max(1, bounds.y2 - bounds.y1);
  if (![advance, width, height, bounds.x1, bounds.y1].every(Number.isFinite)) throw new Error('Invalid font geometry.');
  const columns = Math.min(256, Math.ceil(width * 2));
  const rows = Math.min(256, Math.ceil(height * 2));
  const mask = new Uint8Array(Math.ceil(columns * rows / 8));
  if (glyph.path.commands.length > 0) {
    // Serialize coordinates directly: OpenType.js 2's numeric formatter can emit NaN.
    let x = 0;
    let y = 0;
    const commands = glyph.getPath(-bounds.x1, -bounds.y1, 48).commands;
    if (commands.length > 100_000) throw new Error('Glyph outline is too complex.');
    const path = commands.map((command) => {
      const fromX = x;
      const fromY = y;
      if (command.type !== 'Z') { x = command.x; y = command.y; }
      switch (command.type) {
        case 'M': case 'L': return `${command.type}${coordinate(command.x)} ${coordinate(command.y)}`;
        case 'Q': return `Q${coordinate(command.x1)} ${coordinate(command.y1)} ${coordinate(command.x)} ${coordinate(command.y)}`;
        case 'Z': return 'Z';
        case 'C': return Array.from({ length: 16 }, (_, index) => {
          const t = (index + 1) / 16;
          const u = 1 - t;
          const px = u ** 3 * fromX + 3 * u ** 2 * t * command.x1 + 3 * u * t ** 2 * command.x2 + t ** 3 * command.x;
          const py = u ** 3 * fromY + 3 * u ** 2 * t * command.y1 + 3 * u * t ** 2 * command.y2 + t ** 3 * command.y;
          return `L${coordinate(px)} ${coordinate(py)}`;
        }).join('');
      }
    }).join('');
    const frame = rasterizeSvgToRgba(`<svg viewBox="0 0 ${String(width)} ${String(height)}"><path d="${path}"/></svg>`, { width: columns, height: rows });
    for (let index = 0; index < columns * rows; index++) {
      if ((frame.data[index * 4 + 3] ?? 0) === 0) continue;
      const byte = Math.floor(index / 8);
      mask[byte] = (mask[byte] ?? 0) | (1 << (index % 8));
    }
  }
  return new RasterFontGlyph({ advance, left: bounds.x1, top: bounds.y1, width, height, columns, rows }, mask);
}

function coordinate(value: number): string {
  if (!Number.isFinite(value) || Math.abs(value) > 1_000_000) throw new Error('Invalid font path coordinate.');
  // The shared SVG parser expects decimal notation, including values near zero.
  return value.toFixed(6);
}
