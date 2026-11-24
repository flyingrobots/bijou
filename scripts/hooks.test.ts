import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { readCiWorkflowPolicy } from './ci-workflow-policy.js';
import vitestConfig from '../vitest.config.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

describe('git hooks', () => {

  it('CI workflow policy is parsed from the test job instead of raw string scanning', () => {
    const workflow = readFileSync(resolve(ROOT, '.github/workflows/ci.yml'), 'utf8');
    const policy = readCiWorkflowPolicy(resolve(ROOT, '.github/workflows/ci.yml'));
    expect(policy.testJob.checkoutUses).toBe('actions/checkout@v6');
    expect(policy.testJob.checkoutFetchDepth).toBeGreaterThanOrEqual(2);
    expect(policy.testJob.i18nPolicyGateName).toBe('DOGFOOD i18n policy gate');
    expect(policy.testJob.i18nPolicyGateRun).toContain('npm run dogfood:i18n:complete -- --base FETCH_HEAD');
    expect(policy.testJob.i18nPolicyGateRun).toContain('npm run dogfood:i18n:debt -- --base FETCH_HEAD');
    expect(policy.testJob.i18nPolicyGateRun).toContain('npm run dogfood:i18n:complete -- --base HEAD^');
    expect(policy.testJob.i18nPolicyGateRun).toContain('npm run dogfood:i18n:debt -- --base HEAD^');
    expect(policy.testJob.i18nPolicyGateRun).toContain('npm run dogfood:i18n:check');
    expect(workflow).toContain('docs/*)');
    expect(policy.testJob.testRunCommand).toBe("node scripts/docker-seal/run.mjs --isolated-ci --node-version ${{ matrix.node-version }} -- bash -lc 'npm run build && BIJOU_VITEST_SHARD=${{ matrix.shard }}/8 npm run test:run'");
  });

  it('focused CI unit-test filters point at existing split docs-preview tests', () => {
    const policy = readCiWorkflowPolicy(resolve(ROOT, '.github/workflows/ci.yml'));
    const tokens = policy.focusedUnitTestsJob.focusedPortableRun.split(/\s+/u);
    const runIndex = tokens.indexOf('--run');
    const runPaths = tokens.slice(runIndex + 1);

    expect(policy.focusedUnitTestsJob.focusedPortableRun).toContain('npm run test:run -- --run');
    expect(policy.focusedUnitTestsJob.focusedPortableRun).toContain('node scripts/docker-seal/${{ matrix.sealed-runner }} -- node scripts/docker-seal/dispatch.mjs --build --');
    expect(policy.focusedUnitTestsJob.focusedPortableRun).not.toContain('npm test');
    expect(runIndex).toBeGreaterThanOrEqual(0);
    expect(runPaths).not.toContain('scripts/docs-preview.test.ts');
    expect(runPaths).toEqual(expect.arrayContaining([
      'packages/bijou-node/src/index.part01.test.ts',
      'scripts/docs-preview-components.part01.test.ts',
      'scripts/docs-preview-entry.part01.test.ts',
      'scripts/docs-preview-landing.part01.test.ts',
      'scripts/docs-preview-search.part01.test.ts',
      'scripts/docs-preview-theme.part01.test.ts',
    ]));
    for (const runPath of runPaths) {
      expect(existsSync(resolve(ROOT, runPath)), runPath).toBe(true);
    }
  });

  it('focused CI unit-test job uses read-only repository permissions', () => {
    const policy = readCiWorkflowPolicy(resolve(ROOT, '.github/workflows/ci.yml'));

    expect(policy.focusedUnitTestsJob.permissionsContents).toBe('read');
  });

  it('sealed CI retains both Node versions, and Linux coverage while the Windows lane is off', () => {
    const policy = readCiWorkflowPolicy(resolve(ROOT, '.github/workflows/ci.yml'));

    expect(policy.nodeVersions).toEqual([20, 22]);
    // The native Windows lane is switched off until flyingrobots/bijou#788 is fixed; README.md states it.
    expect(policy.focusedPlatforms).toEqual(['ubuntu-latest']);
  });



  it('Code Dojo workflow uses the standards-only verification lane', () => {
    const workflow = readFileSync(resolve(ROOT, '.github/workflows/code-dojo.yml'), 'utf8');
    const packageJson = readFileSync(resolve(ROOT, 'package.json'), 'utf8');

    expect(packageJson).toContain('"code-dojo:verify"');
    expect(workflow).toContain('npm run code-dojo:verify');
    expect(workflow).not.toContain('npm run code-dojo:ci');
  });

  it('bounds the full Vitest worker pool for CI stability', () => {
    const runner = readFileSync(resolve(ROOT, 'scripts/run-vitest.mjs'), 'utf8');
    const config = vitestConfig as { test?: { maxWorkers?: unknown; testTimeout?: unknown } };

    expect(config.test?.maxWorkers).toBe(2);
    expect(config.test?.testTimeout).toBe(60_000);
    expect(runner).toContain('BIJOU_VITEST_MAX_WORKERS');
  });

  it('exposes fast Code Dojo slice planning commands', () => {
    const packageJson = readFileSync(resolve(ROOT, 'package.json'), 'utf8');
    const fastLane = readFileSync(resolve(ROOT, 'scripts/code-dojo/fast.mjs'), 'utf8');
    const eslintResults = readFileSync(resolve(ROOT, 'scripts/code-dojo/eslint-results.mjs'), 'utf8');
    const testTypecheckConfig = readFileSync(resolve(ROOT, 'tsconfig.tests.json'), 'utf8');

    expect(packageJson).toContain('"code-dojo:eslint:offenders"');
    expect(packageJson).toContain('"code-dojo:fast"');
    expect(packageJson).toContain('"code-dojo:changed"');
    expect(packageJson).toContain('"code-dojo:slice"');
    expect(existsSync(resolve(ROOT, 'scripts/code-dojo/eslint-offenders.mjs'))).toBe(true);
    expect(existsSync(resolve(ROOT, 'scripts/code-dojo/fast.mjs'))).toBe(true);
    expect(existsSync(resolve(ROOT, 'scripts/code-dojo/changed.mjs'))).toBe(true);
    expect(existsSync(resolve(ROOT, 'scripts/code-dojo/slice.mjs'))).toBe(true);
    expect(fastLane).not.toContain('typecheck:test');
    expect(fastLane).not.toContain('test:run');
    expect(eslintResults).toContain('--cache-strategy');
    expect(eslintResults).toContain('content');
    expect(eslintResults).toContain('.cache/eslint/.eslintcache');
    expect(testTypecheckConfig).toContain('"incremental": true');
    expect(testTypecheckConfig).toContain('"tsBuildInfoFile": "tsconfig.tests.tsbuildinfo"');
  });
});
