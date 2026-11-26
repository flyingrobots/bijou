// Licensed under the Apache License, Version 2.0, like the rest of this repository.
import { nextRandom } from '../random.js';

/**
 * A stream of values in [0, 1) from the seeded generator, started at the model's seed plus a number the caller
 * derives from the cell, sub-pixel and frame. The same inputs give the same stream, so a frame stays a pure function of the model.
 */
export function sampler(modelSeed: number, salt: number): () => number {
  let seed = (modelSeed + salt) >>> 0;
  return () => {
    const [value, next] = nextRandom(seed);
    seed = next;
    return value;
  };
}
