// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// Helpers shared by the two "Generating SVGs" ports (after makio135, Observable): his randInt, and his
// getRandomPalette() followed by shuffle(), drawn here from the embedded QUAD_PALETTES.
import { nextRandom } from '../random.js';
import { QUAD_PALETTES } from './palettes.js';

/** As makio135's randInt: `randInt(a)` in [0, a), `randInt(a, b)` in [a, b), floored. The value and the next seed. */
export function randInt(seed: number, a: number, b?: number): readonly [number, number] {
  const [r, next] = nextRandom(seed);
  const lo = b === undefined ? 0 : a;
  const hi = b ?? a;
  return [Math.floor(lo + r * (hi - lo)), next];
}

/** A fresh 32-bit seed drawn from `seed`, for a second generator that must not shadow the first. The seed and the next. */
export function forkSeed(seed: number): readonly [number, number] {
  const [r, next] = nextRandom(seed);
  return [Math.floor(r * 0x100000000), next];
}

/** A shuffled palette: `colours[0]` is the ground, the rest are the inks. */
export interface MakioPalette {
  readonly name: string;
  readonly colours: readonly string[];
}

/** A palette picked and shuffled from the seed, as the originals' `shuffle(getRandomPalette())`. */
export function rollPalette(seed: number): readonly [MakioPalette, number] {
  const [pick, s1] = randInt(seed, QUAD_PALETTES.length);
  const source = QUAD_PALETTES[pick] ?? QUAD_PALETTES[0];
  const colours = [source?.background ?? '#ffffff', ...(source?.colors ?? ['#000000'])];
  let s = s1;
  for (let i = colours.length - 1; i > 0; i -= 1) {
    const [j, next] = randInt(s, i + 1);
    s = next;
    [colours[i], colours[j]] = [colours[j] ?? '#000000', colours[i] ?? '#000000'];
  }
  return [{ name: source?.name ?? '', colours }, s];
}
