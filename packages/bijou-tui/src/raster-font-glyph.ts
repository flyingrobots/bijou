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
    for (const value of [geometry.advance, geometry.left, geometry.top,
      geometry.width, geometry.height, geometry.columns, geometry.rows]) {
      if (!Number.isFinite(value)) throw new Error('Non-finite font glyph geometry.');
    }
    if (geometry.width <= 0 || geometry.height <= 0 || geometry.advance < 0
      || !Number.isInteger(geometry.columns) || !Number.isInteger(geometry.rows)
      || geometry.columns < 1 || geometry.rows < 1 || geometry.columns > 2048 || geometry.rows > 2048
      || mask.length !== Math.ceil(geometry.columns * geometry.rows / 8)) {
      throw new Error('Invalid font glyph coverage dimensions.');
    }
    this.geometry = Object.freeze({ ...geometry });
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
