export interface RasterFontGlyphGeometry {
  readonly advance: number;
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
  readonly columns: number;
  readonly rows: number;
}

/** Immutable geometry and an owned coverage texture for one font glyph. */
export class RasterFontGlyph {
  public readonly geometry: RasterFontGlyphGeometry;
  readonly #mask: Uint8Array;

  public constructor(geometry: RasterFontGlyphGeometry, mask: Uint8Array) {
    const { advance, left, top, width, height, columns, rows } = geometry;
    const owned = { advance, left, top, width, height, columns, rows };
    for (const value of Object.values(owned)) {
      if (!Number.isFinite(value)) throw new Error('Non-finite font glyph geometry.');
    }
    if (width <= 0 || height <= 0 || advance < 0
      || !Number.isInteger(columns) || !Number.isInteger(rows)
      || columns < 1 || rows < 1 || columns > 2048 || rows > 2048
      || mask.length !== Math.ceil(columns * rows / 8)) {
      throw new Error('Invalid font glyph coverage dimensions.');
    }
    this.geometry = Object.freeze(owned);
    this.#mask = new Uint8Array(mask);
    Object.freeze(this);
  }

  public sample(x: number, y: number): boolean {
    const g = this.geometry;
    const px = Math.floor((x - g.left) * g.columns / g.width);
    const py = Math.floor((y - g.top) * g.rows / g.height);
    if (px < 0 || py < 0 || px >= g.columns || py >= g.rows) return false;
    const index = py * g.columns + px;
    return ((this.#mask[Math.floor(index / 8)] ?? 0) & (1 << (index % 8))) !== 0;
  }
}
