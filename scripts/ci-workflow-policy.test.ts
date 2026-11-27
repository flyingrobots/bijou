import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ciWorkflowPolicyFromYaml } from './ci-workflow-policy.js';

const workflow = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');

describe('CI isolation policy', () => {
  it('rejects the old host full-suite command', () => {
    const unsealed = workflow.replace(
      "node scripts/docker-seal/run.mjs --isolated-ci --node-version ${{ matrix.node-version }} -- bash -lc 'npm run build && BIJOU_VITEST_SHARD=${{ matrix.shard }}/8 npm run test:run'",
      'BIJOU_VITEST_SHARD=${{ matrix.shard }}/8 npm run test:run',
    );

    expect(() => ciWorkflowPolicyFromYaml(unsealed)).toThrow('Full test suite must enter the sealed runner');
  });

  it('rejects a Windows entry in the sealed focused matrix', () => {
    // Windows runs in job unit_windows, outside the seal (flyingrobots/bijou#932).
    const sealedWindows = workflow.replace(
      '            sealed-runner: run.mjs --isolated-ci\n',
      '            sealed-runner: run.mjs --isolated-ci\n          - label: windows\n            os: windows-2022\n            sealed-runner: run.mjs --isolated-ci\n',
    );
    expect(sealedWindows).not.toBe(workflow);

    expect(() => ciWorkflowPolicyFromYaml(sealedWindows)).toThrow('Windows runs in job unit_windows');
  });

  it('admits the maintained platform matrix', () => {
    expect(ciWorkflowPolicyFromYaml(workflow).focusedPlatforms).toContain('ubuntu-latest');
  });
});
