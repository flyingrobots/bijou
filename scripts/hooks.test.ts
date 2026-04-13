import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

describe('git hooks', () => {
  it('pre-push runs typecheck:test before the full test suite', () => {
    const hook = readFileSync(resolve(ROOT, 'scripts/hooks/pre-push'), 'utf8');
    const typecheckIndex = hook.indexOf('npm run typecheck:test');
    const testIndex = hook.indexOf('npm test');

    expect(typecheckIndex).toBeGreaterThanOrEqual(0);
    expect(testIndex).toBeGreaterThan(typecheckIndex);
  });
});
