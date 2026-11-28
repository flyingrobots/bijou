import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const HOST_CHECKS = ['check-staged-files.mjs', 'check-core-purity.mjs', 'check-no-mocks.mjs', 'check-graft-receipts.mjs'] as const;

function packageScripts(): Readonly<Record<string, string>> {
  const parsed: unknown = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8'));
  if (typeof parsed !== 'object' || parsed === null || !('scripts' in parsed)) throw new Error('package.json has no scripts');
  const scripts: unknown = parsed.scripts;
  if (typeof scripts !== 'object' || scripts === null) throw new Error('package.json scripts is not an object');
  return Object.fromEntries(Object.entries(scripts).filter((entry): entry is [string, string] => typeof entry[1] === 'string'));
}

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

  it('verify:sealed runs the former pre-commit and pre-push gates in the seal, as the release gate', () => {
    const scripts = packageScripts();
    const sealedCommit = readFileSync(resolve(ROOT, 'scripts/docker-seal/precommit.sh'), 'utf8');
    const sealedPush = readFileSync(resolve(ROOT, 'scripts/docker-seal/prepush.sh'), 'utf8');

    expect(scripts['verify:sealed']).toBe(
      "node scripts/docker-seal/run.mjs --full-push -- sh -c 'sh scripts/docker-seal/precommit.sh && sh scripts/docker-seal/prepush.sh' < /dev/null",
    );
    expect(sealedCommit).toContain('npm run -s code-dojo:precommit');
    expect(sealedCommit).toContain('scripts/hooks/pre-commit');
    expect(sealedPush).toContain('npm run -s code-dojo:prepush');
    expect(sealedPush).toContain('scripts/hooks/pre-push');
    expect(scripts['test:run']).toBe('node scripts/docker-seal/dispatch.mjs --build -- node scripts/run-vitest.mjs');
  });

  it('pre-commit runs only the dependency-free Code Dojo checks on the host, with no container', () => {
    const hookShim = readFileSync(resolve(ROOT, '.githooks/pre-commit'), 'utf8');
    // The commands the hook runs; its comments may name other commands.
    const commands = hookShim.split('\n').filter((line) => !line.trimStart().startsWith('#')).join('\n');

    expect(commands).not.toContain('docker-seal');
    expect(commands).not.toMatch(/\bnpm\b|\bnpx\b/u);
    for (const check of HOST_CHECKS) {
      expect(commands).toContain(`node scripts/code-dojo/${check}`);
      // A host check may import only Node built-ins and other local scripts, so a worktree without node_modules can run it.
      const source = readFileSync(resolve(ROOT, 'scripts/code-dojo', check), 'utf8');
      const specifiers = [...source.matchAll(/from\s+['"]([^'"]+)['"]/gu)].map((match) => match[1] ?? '');
      expect(specifiers.filter((specifier) => !specifier.startsWith('node:') && !specifier.startsWith('.'))).toEqual([]);
    }
  });

  it('pre-push is not a local gate: GitHub CI verifies every push', () => {
    expect(existsSync(resolve(ROOT, '.githooks/pre-push'))).toBe(false);
  });
});
