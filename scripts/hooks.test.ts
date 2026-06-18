import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { readCiWorkflowPolicy } from './ci-workflow-policy.js';
import vitestConfig from '../vitest.config.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

describe('git hooks', () => {
  it('pre-push runs DOGFOOD i18n and size gates before typecheck, tests, and interactive smoke', () => {
    const hook = readFileSync(resolve(ROOT, 'scripts/hooks/pre-push'), 'utf8');
    const i18nCompleteIndex = hook.indexOf('npm run dogfood:i18n:complete');
    const i18nCheckIndex = hook.indexOf('npm run dogfood:i18n:check');
    const i18nDebtIndex = hook.indexOf('npm run dogfood:i18n:debt');
    const codeSizeIndex = hook.indexOf('npm run code:size');
    const typecheckIndex = hook.indexOf('npm run typecheck:test');
    const testIndex = hook.indexOf('npm test');
    const interactiveSmokeIndex = hook.indexOf('npm run verify:interactive-examples');

    expect(i18nCompleteIndex).toBeGreaterThanOrEqual(0);
    expect(i18nCheckIndex).toBeGreaterThan(i18nCompleteIndex);
    expect(i18nDebtIndex).toBeGreaterThan(i18nCheckIndex);
    expect(codeSizeIndex).toBeGreaterThan(i18nDebtIndex);
    expect(typecheckIndex).toBeGreaterThan(codeSizeIndex);
    expect(typecheckIndex).toBeGreaterThanOrEqual(0);
    expect(testIndex).toBeGreaterThan(typecheckIndex);
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
  });

  it('focused CI unit-test filters point at existing split docs-preview tests', () => {
    const policy = readCiWorkflowPolicy(resolve(ROOT, '.github/workflows/ci.yml'));
    const tokens = policy.focusedUnitTestsJob.focusedPortableRun.split(/\s+/u);
    const runIndex = tokens.indexOf('--run');
    const runPaths = tokens.slice(runIndex + 1);

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

  it('bounds the full Vitest worker pool for CI stability', () => {
    const config = vitestConfig as { test?: { maxWorkers?: unknown; testTimeout?: unknown } };

    expect(config.test?.maxWorkers).toBe(2);
    expect(config.test?.testTimeout).toBe(60_000);
  });
});
