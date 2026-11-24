// Licensed under the Apache License, Version 2.0, like the rest of this repository.

/** One step of a seeded generator: the value in [0, 1) and the next seed. A demo keeps the seed in its state. */
export function nextRandom(seed: number): readonly [number, number] {
  const next = (seed + 0x6d2b79f5) >>> 0;
  let t = Math.imul(next ^ (next >>> 15), 1 | next);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return [((t ^ (t >>> 14)) >>> 0) / 0x100000000, next];
}
