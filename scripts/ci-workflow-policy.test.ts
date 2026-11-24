import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ciWorkflowPolicyFromYaml } from './ci-workflow-policy.js';

const workflow = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');

describe('CI isolation policy', () => {
  it('rejects the old host full-suite command', () => {
    const unsealed = workflow.replace(
      "node scripts/docker-seal/run.mjs --isolated-ci --node-version ${{ matrix.node-version }} -- bash -lc 'npm run build && BIJOU_VITEST_SHARD=${{ matrix.shard }}/16 npm run test:run'",
      'BIJOU_VITEST_SHARD=${{ matrix.shard }}/16 npm run test:run',
    );

    expect(() => ciWorkflowPolicyFromYaml(unsealed)).toThrow('Full test suite must enter the sealed runner');
  });

  it('rejects substituting a Linux container for Windows coverage', () => {
    const wrongKernel = workflow.replace('sealed-runner: windows.mjs', 'sealed-runner: run.mjs --isolated-ci');

    expect(() => ciWorkflowPolicyFromYaml(wrongKernel)).toThrow('Windows coverage requires the native Windows sealed runner');
  });

  it('admits the maintained platform matrix', () => {
    expect(ciWorkflowPolicyFromYaml(workflow).focusedPlatforms).toContain('windows-2022');
  });
});
