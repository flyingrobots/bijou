import { readFileSync } from 'node:fs';
import opentype from 'opentype.js';

/*
 * JetBrains Mono (SIL Open Font License, assets/fonts/jetbrains-mono) rasterized into terminal cells for the
 * GIF recorders. Each glyph becomes a coverage mask the size of one cell: 0 is background, 1 is foreground.
 */

const SUB = 4;
type Point = readonly [number, number];
type Edge = readonly [Point, Point];

function loadFont(file: string): opentype.Font {
  const bytes = readFileSync(new URL(`../../assets/fonts/jetbrains-mono/${file}`, import.meta.url));
  return opentype.parse(Uint8Array.from(bytes).buffer);
}

/** Flatten a glyph outline into straight edges, splitting curves into short segments. */
function edgesOf(path: opentype.Path): Edge[] {
  const edges: Edge[] = [];
  let start: Point = [0, 0];
  let at: Point = [0, 0];
  const line = (to: Point): void => { edges.push([at, to]); at = to; };
  for (const c of path.commands) {
    if (c.type === 'M') { start = [c.x, c.y]; at = start; } else if (c.type === 'L') {
      line([c.x, c.y]);
    } else if (c.type === 'Q') {
      const from = at;
      for (let i = 1; i <= 8; i++) {
        const t = i / 8; const u = 1 - t;
        line([u * u * from[0] + 2 * u * t * c.x1 + t * t * c.x, u * u * from[1] + 2 * u * t * c.y1 + t * t * c.y]);
      }
    } else if (c.type === 'C') {
      const from = at;
      for (let i = 1; i <= 12; i++) {
        const t = i / 12; const u = 1 - t;
        line([
          u * u * u * from[0] + 3 * u * u * t * c.x1 + 3 * u * t * t * c.x2 + t * t * t * c.x,
          u * u * u * from[1] + 3 * u * u * t * c.y1 + 3 * u * t * t * c.y2 + t * t * t * c.y,
        ]);
      }
    } else if (at[0] !== start[0] || at[1] !== start[1]) {
      line(start);
    }
  }
  return edges;
}

/** Coverage of each pixel by a non-zero-winding fill, sampled SUB×SUB times per pixel. */
function coverage(edges: readonly Edge[], width: number, height: number): Float32Array {
  const mask = new Float32Array(width * height);
  for (let sy = 0; sy < height * SUB; sy++) {
    const y = (sy + 0.5) / SUB;
    const crossings: { x: number; dir: number }[] = [];
    for (const [[x0, y0], [x1, y1]] of edges) {
      if ((y0 <= y && y1 > y) || (y1 <= y && y0 > y)) crossings.push({ x: x0 + ((y - y0) / (y1 - y0)) * (x1 - x0), dir: y1 > y0 ? 1 : -1 });
    }
    crossings.sort((a, b) => a.x - b.x);
    let winding = 0;
    for (let i = 0; i < crossings.length - 1; i++) {
      winding += crossings[i]?.dir ?? 0;
      if (winding === 0) continue;
      const from = Math.max(0, Math.ceil((crossings[i]?.x ?? 0) * SUB - 0.5));
      const to = Math.min(width * SUB - 1, Math.floor((crossings[i + 1]?.x ?? 0) * SUB - 0.5));
      for (let sx = from; sx <= to; sx++) {
        const i = Math.floor(sy / SUB) * width + Math.floor(sx / SUB);
        mask[i] = (mask[i] ?? 0) + 1 / (SUB * SUB);
      }
    }
  }
  return mask;
}

/** Glyph masks for one cell size, in regular and bold, cached per character. */
export class MonoGlyphs {
  readonly #fonts: { regular: opentype.Font; bold: opentype.Font };
  readonly #cache = new Map<string, Float32Array | null>();
  readonly #size: number;
  readonly #baseline: number;

  public constructor(public readonly cellWidth: number, public readonly cellHeight: number) {
    this.#fonts = { regular: loadFont('JetBrainsMono-Regular.ttf'), bold: loadFont('JetBrainsMono-Bold.ttf') };
    const font = this.#fonts.regular;
    // Size the font so one advance fills the cell width, and centre the ascender-to-descender box vertically.
    const advance = font.charToGlyph('M').advanceWidth ?? font.unitsPerEm * 0.6;
    this.#size = (cellWidth * font.unitsPerEm) / advance;
    const scale = this.#size / font.unitsPerEm;
    const textHeight = (font.ascender - font.descender) * scale;
    this.#baseline = (cellHeight - textHeight) / 2 + font.ascender * scale;
  }

  /** The coverage mask for a character, or undefined when the font has no glyph for it. */
  public mask(char: string, bold: boolean): Float32Array | undefined {
    const key = `${bold ? 'b' : 'r'}${char}`;
    const cached = this.#cache.get(key);
    if (cached !== undefined) return cached ?? undefined;
    const font = bold ? this.#fonts.bold : this.#fonts.regular;
    const mask = font.charToGlyphIndex(char) === 0 ? null
      : coverage(edgesOf(font.charToGlyph(char).getPath(0, this.#baseline, this.#size)), this.cellWidth, this.cellHeight);
    this.#cache.set(key, mask);
    return mask ?? undefined;
  }
}
