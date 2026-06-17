import { describe, expect, it } from 'vitest';
import {
  collectDogfoodI18nDebt,
  collectDogfoodMarkdownLocalizationDebt,
} from '../examples/docs/i18n-debt.js';
import { runDogfoodI18nDebtInventory } from './dogfood-i18n-debt.js';

describe('DOGFOOD i18n debt base ref fallback', () => {
  it('falls back to local diffs when the default base ref is missing', () => {
    const gitCalls: string[] = [];
    const stdout: string[] = [];

    const exitCode = runDogfoodI18nDebtInventory({
      args: [],
      inventory: collectDogfoodI18nDebt({ sources: [] }),
      baseline: { total: 0, bySurface: {} },
      markdownInventory: collectDogfoodMarkdownLocalizationDebt({ sources: [] }),
      markdownBaseline: { total: 0, byLocale: {} },
      gitOutput(args) {
        gitCalls.push(args.join(' '));
        if (args[0] === 'merge-base') {
          throw new Error('missing origin/main');
        }
        if (args.join(' ') === 'diff --name-only --cached') {
          return 'examples/docs/cached.ts\n';
        }
        if (args.join(' ') === 'diff --name-only') {
          return 'examples/docs/worktree.ts\n';
        }
        throw new Error(`unexpected git command: ${args.join(' ')}`);
      },
      stdout: (text) => stdout.push(text),
    });

    expect(exitCode).toBe(0);
    expect(stdout.join('')).toContain('dogfood-i18n-debt: ok');
    expect(gitCalls).not.toContain('diff --name-only origin/main...HEAD');
  });
});
