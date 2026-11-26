import { describe, expect, it } from 'vitest';
import { eslintInvocations, lintTargets, mergeEslintResults } from './code-dojo/eslint-results.mjs';

// The whole-tree lint ran out of V8 heap in hosted CI (job "Verify TypeScript
// doctrine", 2026-11-24, at about 2,000 MB) once the tree grew: one ESLint
// process held the typed program for every target at once. Each target is
// linted by a process of its own, and the results are merged.
describe('the ESLint ratchet lints one target per process', () => {
  it('plans one invocation per target, each with the target last and a cache of its own', () => {
    const plans = eslintInvocations('/repo', ['a/**/*.ts', 'b/**/*.ts']);

    expect(plans).toHaveLength(2);
    expect(plans.map((plan) => plan.args[plan.args.length - 1])).toEqual(['a/**/*.ts', 'b/**/*.ts']);
    const caches = plans.map((plan) => plan.args[plan.args.indexOf('--cache-location') + 1]);
    expect(new Set(caches).size).toBe(2);
    for (const plan of plans) expect(plan.args.filter((arg) => arg.endsWith('.ts'))).toHaveLength(1);
  });

  it('plans an invocation for every default target', () => {
    expect(eslintInvocations('/repo').map((plan) => plan.target)).toEqual([...lintTargets]);
  });

  it('merges the runs, keeping a file that two targets match once', () => {
    const file = (filePath: string, count: number) => ({
      filePath,
      errorCount: count,
      warningCount: 0,
      messages: Array.from({ length: count }, () => ({ ruleId: 'no-var' })),
    });
    const merged = mergeEslintResults([
      [file('/repo/a.ts', 1), file('/repo/b.ts', 2)],
      [file('/repo/b.ts', 2), file('/repo/c.ts', 3)],
    ]);

    expect(merged.map((result) => result.filePath)).toEqual(['/repo/a.ts', '/repo/b.ts', '/repo/c.ts']);
    expect(merged.reduce((sum, result) => sum + (result.errorCount ?? 0), 0)).toBe(6);
  });
});
