import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ciWorkflowPolicyFromYaml } from './ci-workflow-policy.js';
import { chunkFiles, isIncludedTestFile, parseShard, selectShard } from './vitest-shards.mjs';

// flyingrobots/bijou#907. The full suite ran its chunks one after another on
// one runner. A shard is a share of those chunks, so several runners can each
// take one. These cases pin that the shards partition the chunks.
const files = Array.from({ length: 1000 }, (_, index) => `tests/f${String(index).padStart(4, '0')}.test.ts`);

function lcg(seed: number): () => number {
  let state = seed;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state;
  };
}

describe('vitest shards', () => {
  it('parses k/n and refuses anything else', () => {
    expect(parseShard(undefined)).toBeUndefined();
    expect(parseShard('')).toBeUndefined();
    expect(parseShard('1/4')).toEqual({ index: 1, count: 4 });
    expect(parseShard('4/4')).toEqual({ index: 4, count: 4 });
    for (const bad of ['0/4', '5/4', '1/0', '1', 'a/b', '1/4/2', '-1/4', '1.5/4', ' 1/4']) {
      expect(() => parseShard(bad), bad).toThrow('BIJOU_VITEST_SHARD');
    }
  });

  it('gives every chunk to exactly one shard, for 1, 4 and 25 shards', () => {
    const chunks = chunkFiles(files, 48);
    for (const count of [1, 4, 25]) {
      const taken = Array.from({ length: count }, (_, index) => selectShard(chunks, { index: index + 1, count }));
      expect(taken.flat(2).sort()).toEqual([...files].sort());
      expect(taken.flat(2)).toHaveLength(files.length);
    }
  });

  it('with no shard, runs every chunk', () => {
    expect(selectShard(chunkFiles(files, 48), undefined).flat()).toEqual(files);
  });

  it('gives a shard nothing when there are more shards than chunks', () => {
    const chunks = chunkFiles(files.slice(0, 50), 48);
    expect(chunks).toHaveLength(2);
    expect(selectShard(chunks, { index: 3, count: 4 })).toEqual([]);
    expect(selectShard(chunks, { index: 1, count: 4 }).flat()).toHaveLength(48);
  });

  it('spreads the chunks evenly: shard sizes differ by at most one chunk', () => {
    const chunks = chunkFiles(files, 48);
    const sizes = [1, 2, 3, 4].map((index) => selectShard(chunks, { index, count: 4 }).length);
    expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1);
  });

  it('partitions seeded file lists at seeded sizes and shard counts', () => {
    const next = lcg(907);
    for (let round = 0; round < 200; round++) {
      const list = files.slice(0, next() % 1000);
      const size = 1 + (next() % 60);
      const count = 1 + (next() % 30);
      const chunks = chunkFiles(list, size);
      const taken = Array.from({ length: count }, (_, index) => selectShard(chunks, { index: index + 1, count })).flat(2);
      expect(taken.sort(), `${String(list.length)} files, size ${String(size)}, ${String(count)} shards`).toEqual([...list].sort());
    }
  });

  it('keeps the suite’s file rule', () => {
    expect(isIncludedTestFile('packages/bijou/src/a.test.ts')).toBe(true);
    expect(isIncludedTestFile('bench/src/a.test.ts')).toBe(true);
    expect(isIncludedTestFile('scripts/a.test.ts')).toBe(true);
    expect(isIncludedTestFile('tests/a/b.test.ts')).toBe(true);
    expect(isIncludedTestFile('examples/web-gpu/e2e/a.e2e.ts')).toBe(false);
    expect(isIncludedTestFile('packages/bijou/dist/a.test.ts')).toBe(false);
  });
});

describe('the CI workflow runs every shard', () => {
  const workflow = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');

  it('runs the full suite as shards 1 to N of N, for both Node versions, in the sealed runner', () => {
    const policy = ciWorkflowPolicyFromYaml(workflow);

    expect(policy.suiteJob.nodeVersions).toEqual([20, 22]);
    expect(policy.suiteJob.shardCount).toBeGreaterThanOrEqual(2);
    expect(policy.suiteJob.shards).toEqual(Array.from({ length: policy.suiteJob.shardCount }, (_, index) => index + 1));
    expect(policy.testJob.testRunCommand).toContain('--isolated-ci');
    expect(policy.testJob.testRunCommand).toContain(`BIJOU_VITEST_SHARD=\${{ matrix.shard }}/${String(policy.suiteJob.shardCount)} npm run test:run`);
  });

  it('refuses a workflow whose shard list leaves one out', () => {
    const missing = workflow.replace(/shard: \[1, 2, 3, 4\]/u, 'shard: [1, 2, 4]');
    expect(missing).not.toBe(workflow);
    expect(() => ciWorkflowPolicyFromYaml(missing)).toThrow('Full test suite shards must be 1 to');
  });

  it('refuses a workflow whose command names another shard count than the matrix has', () => {
    const wrong = workflow.replace('${{ matrix.shard }}/4 npm run test:run', '${{ matrix.shard }}/5 npm run test:run');
    expect(wrong).not.toBe(workflow);
    expect(() => ciWorkflowPolicyFromYaml(wrong)).toThrow('Full test suite shards must be 1 to');
  });
});
