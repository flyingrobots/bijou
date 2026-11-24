import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ciWorkflowPolicyFromYaml } from './ci-workflow-policy.js';

const workflow = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');

describe('CI isolation policy', () => {
  it('rejects the old host full-suite command', () => {
    const unsealed = workflow.replace(
      "node scripts/docker-seal/run.mjs --isolated-ci --node-version ${{ matrix.node-version }} -- bash -lc 'npm run build && BIJOU_VITEST_SHARD=${{ matrix.shard }}/12 npm run test:run'",
      'BIJOU_VITEST_SHARD=${{ matrix.shard }}/12 npm run test:run',
    );

    expect(() => ciWorkflowPolicyFromYaml(unsealed)).toThrow('Full test suite must enter the sealed runner');
  });

  it('rejects substituting a Linux container for Windows coverage', () => {
    // The Windows lane is switched off (flyingrobots/bijou#788), so this adds one back with the wrong runner.
    const wrongKernel = workflow.replace(
      '            sealed-runner: run.mjs --isolated-ci\n',
      '            sealed-runner: run.mjs --isolated-ci\n          - label: windows\n            os: windows-2022\n            sealed-runner: run.mjs --isolated-ci\n',
    );
    expect(wrongKernel).not.toBe(workflow);

    expect(() => ciWorkflowPolicyFromYaml(wrongKernel)).toThrow('Windows coverage requires the native Windows sealed runner');
  });

  it('admits a Windows lane that uses the native Windows runner', () => {
    const restored = workflow.replace(
      '            sealed-runner: run.mjs --isolated-ci\n',
      '            sealed-runner: run.mjs --isolated-ci\n          - label: windows\n            os: windows-2022\n            sealed-runner: windows.mjs\n',
    );
    expect(ciWorkflowPolicyFromYaml(restored).focusedPlatforms).toEqual(['ubuntu-latest', 'windows-2022']);
  });

  it('admits the maintained platform matrix', () => {
    expect(ciWorkflowPolicyFromYaml(workflow).focusedPlatforms).toContain('ubuntu-latest');
  });
});
