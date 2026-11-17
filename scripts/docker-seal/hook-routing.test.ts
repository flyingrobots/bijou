import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

describe('sealed Git hook routing', () => {
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
    for (const pattern of ['docs/*)', 'examples/docs/*)', 'scripts/dogfood-*)']) expect(hook).toContain(pattern);
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

  it('pre-push composes Code Dojo without running the full test suite twice', () => {
    const hookShim = readFileSync(resolve(ROOT, '.githooks/pre-push'), 'utf8');
    const packageJson = readFileSync(resolve(ROOT, 'package.json'), 'utf8');

    expect(hookShim).toContain('docker-seal/dispatch.mjs -- sh scripts/docker-seal/prepush.sh');
    const sealedHook = readFileSync(resolve(ROOT, 'scripts/docker-seal/prepush.sh'), 'utf8');
    expect(sealedHook).toContain('npm run -s code-dojo:prepush');
    expect(sealedHook).toContain('scripts/hooks/pre-push');
    expect(packageJson).toMatch(/"test": "node scripts\/docker-seal\/dispatch\.mjs --build -- node scripts\/run-vitest\.mjs"/u);
    expect(packageJson).toMatch(/"test:run": "node scripts\/docker-seal\/dispatch\.mjs --build -- node scripts\/run-vitest\.mjs"/u);
    expect(packageJson).not.toMatch(/"code-dojo:prepush": "[^"]*npm test/u);
    expect(packageJson).not.toMatch(/"code-dojo:prepush": "[^"]*test:run/u);
    expect(packageJson).not.toMatch(/"test:run": "npm test"/u);
  });

  it('pre-commit delegates duplicate lint and code-size gates to Code Dojo', () => {
    const hookShim = readFileSync(resolve(ROOT, '.githooks/pre-commit'), 'utf8');
    const localHook = readFileSync(resolve(ROOT, 'scripts/hooks/pre-commit'), 'utf8');
    const packageJson = readFileSync(resolve(ROOT, 'package.json'), 'utf8');

    expect(hookShim).toContain('docker-seal/dispatch.mjs -- sh scripts/docker-seal/precommit.sh');
    const sealedHook = readFileSync(resolve(ROOT, 'scripts/docker-seal/precommit.sh'), 'utf8');
    expect(sealedHook).toContain('npm run -s code-dojo:precommit');
    expect(sealedHook).toContain('scripts/hooks/pre-commit');
    expect(packageJson).toMatch(/"code-dojo:precommit": "[^"]*npm run code:size[^"]*npm run lint/u);
    expect(localHook).not.toContain('npm run lint');
    expect(localHook).not.toContain('npm run code:size');
    expect(localHook).toContain('npm ls --all');
  });

});
