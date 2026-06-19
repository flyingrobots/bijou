import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { readCiWorkflowPolicy } from './ci-workflow-policy.js';
import vitestConfig from '../vitest.config.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

describe('git hooks', () => {
  it('pre-push runs DOGFOOD i18n gates only for DOGFOOD-relevant pushes', () => {
    const hook = readFileSync(resolve(ROOT, 'scripts/hooks/pre-push'), 'utf8');
    const i18nCompleteIndex = hook.indexOf('npm run dogfood:i18n:complete');
    const i18nCheckIndex = hook.indexOf('npm run dogfood:i18n:check');
    const i18nDebtIndex = hook.indexOf('npm run dogfood:i18n:debt');
    const pathGateIndex = hook.indexOf('is_dogfood_relevant_path');
    const skipIndex = hook.indexOf('skipping DOGFOOD i18n gates');
    const fullPushIndex = hook.indexOf('BIJOU_FULL_PUSH');
    const codeSizeIndex = hook.indexOf('npm run code:size');
    const typecheckIndex = hook.indexOf('npm run typecheck:test');
    const testIndex = hook.indexOf('npm run test:run');
    const interactiveSmokeIndex = hook.indexOf('npm run verify:interactive-examples');

    expect(pathGateIndex).toBeGreaterThanOrEqual(0);
    expect(skipIndex).toBeGreaterThan(pathGateIndex);
    expect(fullPushIndex).toBeGreaterThan(pathGateIndex);
    expect(hook).toContain('examples/docs/*)');
    expect(hook).toContain('scripts/dogfood-*)');
    expect(i18nCompleteIndex).toBeGreaterThanOrEqual(0);
    expect(i18nCheckIndex).toBeGreaterThan(i18nCompleteIndex);
    expect(i18nDebtIndex).toBeGreaterThan(i18nCheckIndex);
    expect(codeSizeIndex).toBeGreaterThan(i18nDebtIndex);
    expect(typecheckIndex).toBeGreaterThan(codeSizeIndex);
    expect(typecheckIndex).toBeGreaterThanOrEqual(0);
    expect(testIndex).toBeGreaterThan(typecheckIndex);
    expect(hook).not.toContain('npm test');
    expect(interactiveSmokeIndex).toBeGreaterThan(testIndex);
  });

  it('CI workflow policy is parsed from the test job instead of raw string scanning', () => {
    const policy = readCiWorkflowPolicy(resolve(ROOT, '.github/workflows/ci.yml'));

    expect(policy.testJob.checkoutUses).toBe('actions/checkout@v6');
    expect(policy.testJob.checkoutFetchDepth).toBeGreaterThanOrEqual(2);
    expect(policy.testJob.i18nPolicyGateName).toBe('DOGFOOD i18n policy gate');
    expect(policy.testJob.i18nPolicyGateRun).toContain('npm run dogfood:i18n:complete -- --base FETCH_HEAD');
    expect(policy.testJob.i18nPolicyGateRun).toContain('npm run dogfood:i18n:debt -- --base FETCH_HEAD');
    expect(policy.testJob.i18nPolicyGateRun).toContain('npm run dogfood:i18n:complete -- --base HEAD^');
    expect(policy.testJob.i18nPolicyGateRun).toContain('npm run dogfood:i18n:debt -- --base HEAD^');
    expect(policy.testJob.i18nPolicyGateRun).toContain('npm run dogfood:i18n:check');
    expect(policy.testJob.testRunCommand).toBe('npm run test:run');
  });

  it('focused CI unit-test filters point at existing split docs-preview tests', () => {
    const policy = readCiWorkflowPolicy(resolve(ROOT, '.github/workflows/ci.yml'));
    const tokens = policy.focusedUnitTestsJob.focusedPortableRun.split(/\s+/u);
    const runIndex = tokens.indexOf('--run');
    const runPaths = tokens.slice(runIndex + 1);

    expect(policy.focusedUnitTestsJob.focusedPortableRun).toContain('npm run test:run -- --run');
    expect(policy.focusedUnitTestsJob.focusedPortableRun).not.toContain('npm test');
    expect(runIndex).toBeGreaterThanOrEqual(0);
    expect(runPaths).not.toContain('scripts/docs-preview.test.ts');
    expect(runPaths).toEqual(expect.arrayContaining([
      'scripts/docs-preview-components.test.ts',
      'scripts/docs-preview-entry.test.ts',
      'scripts/docs-preview-landing.test.ts',
      'scripts/docs-preview-search.test.ts',
      'scripts/docs-preview-theme.test.ts',
    ]));
    for (const runPath of runPaths) {
      expect(existsSync(resolve(ROOT, runPath)), runPath).toBe(true);
    }
  });

  it('focused CI unit-test job uses read-only repository permissions', () => {
    const policy = readCiWorkflowPolicy(resolve(ROOT, '.github/workflows/ci.yml'));

    expect(policy.focusedUnitTestsJob.permissionsContents).toBe('read');
  });

  it('pre-push composes Code Dojo without running the full test suite twice', () => {
    const hookShim = readFileSync(resolve(ROOT, '.githooks/pre-push'), 'utf8');
    const packageJson = readFileSync(resolve(ROOT, 'package.json'), 'utf8');

    expect(hookShim).toContain('npm run -s code-dojo:prepush');
    expect(hookShim).toContain('scripts/hooks/pre-push');
    expect(packageJson).toMatch(/"test": "node scripts\/run-vitest\.mjs"/u);
    expect(packageJson).toMatch(/"test:run": "node scripts\/run-vitest\.mjs"/u);
    expect(packageJson).not.toMatch(/"code-dojo:prepush": "[^"]*npm test/u);
    expect(packageJson).not.toMatch(/"code-dojo:prepush": "[^"]*test:run/u);
    expect(packageJson).not.toMatch(/"test:run": "npm test"/u);
  });

  it('pre-commit delegates duplicate lint and code-size gates to Code Dojo', () => {
    const hookShim = readFileSync(resolve(ROOT, '.githooks/pre-commit'), 'utf8');
    const localHook = readFileSync(resolve(ROOT, 'scripts/hooks/pre-commit'), 'utf8');
    const packageJson = readFileSync(resolve(ROOT, 'package.json'), 'utf8');

    expect(hookShim).toContain('npm run -s code-dojo:precommit');
    expect(hookShim).toContain('scripts/hooks/pre-commit');
    expect(packageJson).toMatch(/"code-dojo:precommit": "[^"]*npm run code:size[^"]*npm run lint/u);
    expect(localHook).not.toContain('npm run lint');
    expect(localHook).not.toContain('npm run code:size');
    expect(localHook).toContain('npm ls --all');
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
