import { describe, expect, it } from 'vitest';
import { collectDogfoodI18nDebt, collectDogfoodMarkdownLocalizationDebt } from '../examples/docs/i18n-debt.js';
import { runDogfoodI18nDebtInventory } from './dogfood-i18n-debt.js';

describe('DOGFOOD i18n debt inventory', () => {
  it('reports a nonzero exit when a touched file still has raw string debt', () => {
      const stdout: string[] = [];
      const stderr: string[] = [];
      const inventory = collectDogfoodI18nDebt({
        sources: [{
          surface: 'fixture',
          path: 'examples/docs/fixture.ts',
          text: "const title = 'Raw English Title';",
        }],
      });

      const exitCode = runDogfoodI18nDebtInventory({
        inventory,
        changedPaths: ['examples/docs/fixture.ts'],
        baseline: { total: 1, bySurface: { fixture: 1 } },
        markdownInventory: collectDogfoodMarkdownLocalizationDebt({ sources: [] }),
        markdownBaseline: { total: 0, byLocale: {} },
        stdout: (text) => stdout.push(text),
        stderr: (text) => stderr.push(text),
      });

      expect(exitCode).toBe(1);
      expect(stdout).toEqual([]);
      expect(stderr.join('')).toContain('new DOGFOOD source examples/docs/fixture.ts has 1 raw string debt entry');
    });

  it('reports a nonzero exit when Markdown localization debt exceeds a supplied baseline', () => {
      const stdout: string[] = [];
      const stderr: string[] = [];
      const markdownInventory = collectDogfoodMarkdownLocalizationDebt({
        sources: [{
          surface: 'fixture',
          path: 'examples/docs/fixture.ts',
          text: "const guide = readMarkdownDoc('./content/guide.md');",
        }],
        locales: ['en', 'fr'],
        defaultLocale: 'en',
        fileExists: () => false,
      });

      const exitCode = runDogfoodI18nDebtInventory({
        inventory: collectDogfoodI18nDebt({ sources: [] }),
        changedPaths: [],
        baseline: { total: 0, bySurface: {} },
        markdownInventory,
        markdownBaseline: { total: 0, byLocale: { fr: 0 } },
        stdout: (text) => stdout.push(text),
        stderr: (text) => stderr.push(text),
      });

      expect(exitCode).toBe(1);
      expect(stdout).toEqual([]);
      expect(stderr.join('')).toContain('markdown fr 1 exceeds baseline 0');
    });
});
