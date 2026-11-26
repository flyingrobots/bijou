import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ciWorkflowPolicyFromYaml } from './ci-workflow-policy.js';
import { chunkFiles, isIncludedTestFile, parseShard } from './vitest-shards.mjs';

// flyingrobots/bijou#907. The full suite ran its chunks one after another on
// one runner. A shard is a share of the suite's files, so several runners can
// each take one. scripts/vitest-shard-balance.test.ts pins that the shards
// partition the files; these cases pin the shard value, the chunks and CI.
const files = Array.from({ length: 1000 }, (_, index) => `tests/f${String(index).padStart(4, '0')}.test.ts`);

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

  it('chunks a list in order, losing nothing', () => {
    const chunks = chunkFiles(files, 48);
    expect(chunks).toHaveLength(21);
    expect(chunks.flat()).toEqual(files);
    expect(chunkFiles([], 48)).toEqual([]);
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
    const missing = workflow.replace(/shard: \[1, 2, 3, /u, 'shard: [1, 2, ');
    expect(missing).not.toBe(workflow);
    expect(() => ciWorkflowPolicyFromYaml(missing)).toThrow('Full test suite shards must be 1 to');
  });

  it('refuses a workflow whose command names another shard count than the matrix has', () => {
    const wrong = workflow.replace(/\$\{\{ matrix\.shard \}\}\/\d+ npm run test:run/u, '${{ matrix.shard }}/99 npm run test:run');
    expect(wrong).not.toBe(workflow);
    expect(() => ciWorkflowPolicyFromYaml(wrong)).toThrow('Full test suite shards must be 1 to');
  });
});
