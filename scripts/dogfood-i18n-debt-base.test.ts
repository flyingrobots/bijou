import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  collectDogfoodI18nDebt,
  collectDogfoodMarkdownLocalizationDebt,
} from '../examples/docs/i18n-debt.js';
import { evaluateDogfoodTouchedI18nDebt } from '../examples/docs/i18n-debt-touched.js';
import { collectBaseDogfoodI18nDebt } from './dogfood-i18n-debt-base.js';
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

describe('DOGFOOD i18n debt base inventory of a split lineage', () => {
  // The base of a touched lineage child is the whole lineage at the base ref,
  // since copy may move between its files. Here the base ref is the working
  // tree itself, so nothing was added and the touch must pass.
  const touched = 'examples/docs/stories-helper-render-spring-timeline-preview.ts';
  const runGit = (args: readonly string[]): string => {
    if (args[0] === 'merge-base') return 'BASE\n';
    const [command, spec] = args;
    if (command === 'show' && spec?.startsWith('BASE:') === true) return readFileSync(spec.slice('BASE:'.length), 'utf8');
    throw new Error(`unexpected git command: ${args.join(' ')}`);
  };

  it('scans every file of the lineage a changed file belongs to', () => {
    const base = collectBaseDogfoodI18nDebt('origin/main', [touched], runGit);
    const paths = new Set(base.entries.map((entry) => entry.path));
    expect(paths).toContain(touched);
    expect(paths).toContain('examples/docs/stories-story-alert.ts');
  });

  it('finds no added copy when a lineage child is touched without new copy', () => {
    const base = collectBaseDogfoodI18nDebt('origin/main', [touched], runGit);
    const result = evaluateDogfoodTouchedI18nDebt(collectDogfoodI18nDebt(), [touched], base);
    expect(result.violations.filter((violation) => violation.includes('adds raw string'))).toEqual([]);
  });
});
