import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { assignShards, parseWeights } from './vitest-shards.mjs';

// flyingrobots/bijou#907. Ten files were 46% of the suite's time, so shards cut
// by position were uneven (156 to 341 s). Shards are dealt by measured weight.
const files = Array.from({ length: 400 }, (_, index) => `tests/f${String(index).padStart(3, '0')}.test.ts`);

function lcg(seed: number): () => number {
  let state = seed;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state;
  };
}

describe('weighted shards', () => {
  it('puts every file in exactly one shard, whatever the weights say', () => {
    const next = lcg(907);
    for (let round = 0; round < 200; round++) {
      const list = files.slice(0, next() % 400);
      const count = 1 + (next() % 24);
      const weights = { defaultSeconds: 0.5, perFileSeconds: 0, files: Object.fromEntries(list.filter(() => next() % 5 === 0).map((file) => [file, (next() % 1400) / 10])) };
      const taken = assignShards(list, weights, count).flatMap((shard) => shard.files);
      expect(taken.sort(), `${String(list.length)} files, ${String(count)} shards`).toEqual([...list].sort());
    }
  });

  it('ignores a weight for a file that is not in the suite, and gives an unlisted file the default', () => {
    const shards = assignShards(['a.test.ts', 'b.test.ts'], { defaultSeconds: 2, perFileSeconds: 0.5, files: { 'gone.test.ts': 500, 'a.test.ts': 6 } }, 2);
    expect(shards).toEqual([{ files: ['a.test.ts'], seconds: 6.5 }, { files: ['b.test.ts'], seconds: 2.5 }]);
  });

  it('keeps the heaviest files apart: no shard is heavier than the mean plus the heaviest file', () => {
    const weights = { defaultSeconds: 0.5, perFileSeconds: 0, files: { [files[0] ?? '']: 135, [files[1] ?? '']: 83, [files[2] ?? '']: 44, [files[3] ?? '']: 25 } };
    const shards = assignShards(files, weights, 8);
    const total = shards.reduce((sum, shard) => sum + shard.seconds, 0);
    for (const shard of shards) expect(shard.seconds).toBeLessThanOrEqual(total / 8 + 135);
    const heavy = shards.filter((shard) => shard.files.some((file) => [files[0], files[1], files[2], files[3]].includes(file)));
    expect(heavy).toHaveLength(4);
  });

  it('is the same on every run, so every CI job computes the same split', () => {
    const weights = { defaultSeconds: 0.5, perFileSeconds: 0, files: { [files[7] ?? '']: 9, [files[8] ?? '']: 9 } };
    expect(assignShards([...files].reverse(), weights, 6)).toEqual(assignShards(files, weights, 6));
  });

  it('refuses a weights document of another shape', () => {
    expect(parseWeights('{"schema":"bijou.vitest-weights/1","defaultSeconds":0.4,"perFileSeconds":0.5,"files":{"a.test.ts":3}}')).toEqual({ defaultSeconds: 0.4, perFileSeconds: 0.5, files: { 'a.test.ts': 3 } });
    for (const bad of ['{}', '{"schema":"bijou.vitest-weights/1","defaultSeconds":1,"files":{}}', '{"schema":"other","defaultSeconds":1,"perFileSeconds":0.5,"files":{}}', '{"schema":"bijou.vitest-weights/1","defaultSeconds":0,"perFileSeconds":0.5,"files":{}}', '{"schema":"bijou.vitest-weights/1","defaultSeconds":1,"perFileSeconds":0.5,"files":{"a":"x"}}', '{"schema":"bijou.vitest-weights/1","defaultSeconds":1,"perFileSeconds":0.5,"files":[]}']) {
      expect(() => parseWeights(bad), bad).toThrow('bijou.vitest-weights/1');
    }
  });

  it('reads the checked-in weights file', () => {
    const weights = parseWeights(readFileSync(new URL('./vitest-weights.json', import.meta.url), 'utf8'));
    expect(Object.keys(weights.files).length).toBeGreaterThan(0);
  });
});
