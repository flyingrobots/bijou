import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { readCiWorkflowPolicy } from './ci-workflow-policy.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

describe('git hooks', () => {
  it('pre-push runs DOGFOOD i18n gates before typecheck, tests, and interactive smoke', () => {
    const hook = readFileSync(resolve(ROOT, 'scripts/hooks/pre-push'), 'utf8');
    const i18nCompleteIndex = hook.indexOf('npm run dogfood:i18n:complete');
    const i18nCheckIndex = hook.indexOf('npm run dogfood:i18n:check');
    const typecheckIndex = hook.indexOf('npm run typecheck:test');
    const testIndex = hook.indexOf('npm test');
    const interactiveSmokeIndex = hook.indexOf('npm run verify:interactive-examples');

    expect(i18nCompleteIndex).toBeGreaterThanOrEqual(0);
    expect(i18nCheckIndex).toBeGreaterThan(i18nCompleteIndex);
    expect(typecheckIndex).toBeGreaterThan(i18nCheckIndex);
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
    expect(policy.testJob.i18nPolicyGateRun).toContain('npm run dogfood:i18n:complete -- --base HEAD^');
    expect(policy.testJob.i18nPolicyGateRun).toContain('npm run dogfood:i18n:check');
  });
});
