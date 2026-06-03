import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

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

  it('CI runs the DOGFOOD i18n completeness and generated-catalog gates', () => {
    const workflow = readFileSync(resolve(ROOT, '.github/workflows/ci.yml'), 'utf8');

    expect(workflow).toContain('DOGFOOD i18n policy gate');
    expect(workflow).toContain('npm run dogfood:i18n:complete');
    expect(workflow).toContain('npm run dogfood:i18n:check');
  });

  it('CI fetches enough history before comparing DOGFOOD i18n source rows to HEAD^', () => {
    const workflow = readFileSync(resolve(ROOT, '.github/workflows/ci.yml'), 'utf8');
    const checkoutIndex = workflow.indexOf('- uses: actions/checkout@v6');
    const fetchDepthIndex = workflow.indexOf('fetch-depth: 2', checkoutIndex);
    const i18nGateIndex = workflow.indexOf('DOGFOOD i18n policy gate');
    const headParentBaseIndex = workflow.indexOf('npm run dogfood:i18n:complete -- --base HEAD^');

    expect(checkoutIndex).toBeGreaterThanOrEqual(0);
    expect(fetchDepthIndex).toBeGreaterThan(checkoutIndex);
    expect(fetchDepthIndex).toBeLessThan(i18nGateIndex);
    expect(headParentBaseIndex).toBeGreaterThan(i18nGateIndex);
  });
});
