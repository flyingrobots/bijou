// Licensed under the Apache License, Version 2.0, like the rest of this repository.
import * as loaded from 'opentype.js';
import { flatten, type Polygons } from './font-outline.js';

/** What the host supplies: the bytes of one font file, or a rejection. The demos never learn where they came from. */
export type FontPort = () => Promise<ArrayBuffer | Uint8Array>;

/** A glyph's outline at a size, and how far it moves the pen. */
export interface Glyph {
  readonly paths: Polygons;
  readonly advance: number;
}

/** A parsed font: its outlines, with the library behind it hidden. Reading a missing one is a value, never a throw. */
export type Typeface =
  | {
    readonly status: 'ready';
    /** The outlines of a whole line of text at `size`, pen at the origin, y down. */
    text(text: string, size: number): Polygons;
    /** One character's outline and advance at `size`. A character the font lacks is the font's own fallback glyph. */
    glyph(char: string, size: number): Glyph;
  }
  | { readonly status: 'missing'; readonly reason: string };

/** The face a host gets when it supplies no font. */
export const NO_TYPEFACE: Typeface = { status: 'missing', reason: 'no font was supplied' };

type Api = typeof loaded;

function isApi(value: unknown): value is Api {
  return typeof value === 'object' && value !== null && typeof Reflect.get(value, 'parse') === 'function';
}

/** The library as a browser bundle (named exports) or Node (a `default`) hands it over. */
function api(): Api {
  if (isApi(loaded)) return loaded;
  const inner: unknown = Reflect.get(loaded, 'default');
  if (isApi(inner)) return inner;
  throw new Error('the font library exposes no parse function');
}

const CACHE_LIMIT = 512;

function memo<T>(make: (key: string) => T): (key: string) => T {
  const seen = new Map<string, T>();
  return (key) => {
    const hit = seen.get(key);
    if (hit !== undefined) return hit;
    if (seen.size >= CACHE_LIMIT) seen.clear();
    const made = make(key);
    seen.set(key, made);
    return made;
  };
}

function toBuffer(bytes: ArrayBuffer | Uint8Array): ArrayBuffer {
  return bytes instanceof Uint8Array ? Uint8Array.from(bytes).buffer : bytes;
}

/** Ask the port for the font and parse it. A rejection, a throw or bytes that are no font give a `missing` face. */
export async function loadTypeface(port: FontPort): Promise<Typeface> {
  try {
    const font = api().parse(toBuffer(await port()));
    const texts = memo((key) => flatten(font.getPath(key.slice(key.indexOf(':') + 1), 0, 0, Number(key.slice(0, key.indexOf(':')))).commands));
    const glyphs = memo((key): Glyph => {
      const size = Number(key.slice(0, key.indexOf(':')));
      const glyph = font.charToGlyph(key.slice(key.indexOf(':') + 1));
      return { paths: flatten(glyph.getPath(0, 0, size).commands), advance: (glyph.advanceWidth ?? 0) * (size / font.unitsPerEm) };
    });
    return {
      status: 'ready',
      text: (text, size) => texts(`${String(size)}:${text}`),
      glyph: (char, size) => glyphs(`${String(size)}:${char}`),
    };
  } catch (error) {
    return { status: 'missing', reason: error instanceof Error ? error.message : String(error) };
  }
}
