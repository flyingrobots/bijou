import { describe, expect, it } from 'vitest';
import { collectDogfoodI18nDebt, collectDogfoodMarkdownLocalizationDebt, evaluateDogfoodI18nDebtRatchet, evaluateDogfoodMarkdownLocalizationRatchet } from '../examples/docs/i18n-debt.js';
import { runDogfoodI18nDebtInventory } from './dogfood-i18n-debt.js';

describe('DOGFOOD i18n debt inventory', () => {
  it('counts missing DOGFOOD Markdown localizations by supported locale', () => {
      const inventory = collectDogfoodMarkdownLocalizationDebt({
        sources: [{
          surface: 'fixture',
          path: 'examples/docs/fixture.ts',
          text: [
            "const guide = readMarkdownDoc('./content/guide.md');",
            "const release = readMarkdownDocExcerpt(`../../docs/releases/${BIJOU_VERSION}/whats-new.md`, ['## Stop']);",
          ].join('\n'),
        }],
        locales: ['en', 'fr', 'es'],
        defaultLocale: 'en',
        templateValues: { BIJOU_VERSION: '7.0.0' },
        fileExists: (path) => path === 'examples/docs/content/guide.fr.md',
      });

      expect(inventory.documents.map((document) => document.path)).toEqual([
        'docs/releases/7.0.0/whats-new.md',
        'examples/docs/content/guide.md',
      ]);
      expect(inventory.entries.map((entry) => `${entry.locale}:${entry.path}`)).toEqual([
        'fr:docs/releases/7.0.0/whats-new.md',
        'es:docs/releases/7.0.0/whats-new.md',
        'es:examples/docs/content/guide.md',
      ]);
      expect(inventory.byLocale).toEqual([
        { locale: 'fr', count: 1 },
        { locale: 'es', count: 2 },
      ]);
      expect(Object.isFrozen(inventory.documents)).toBe(true);
      expect(Object.isFrozen(inventory.entries[0]?.candidates)).toBe(true);
    });

  it('honors DOGFOOD Markdown localization frontmatter paths and locale scope', () => {
      const inventory = collectDogfoodMarkdownLocalizationDebt({
        sources: [{
          surface: 'fixture',
          path: 'examples/docs/fixture.ts',
          text: "const guide = readMarkdownDoc('./content/guide.md');",
        }],
        locales: ['en', 'fr', 'es', 'de'],
        defaultLocale: 'en',
        readFile: (path) => {
          if (path !== 'examples/docs/content/guide.md') return '';
          return [
            '---',
            'dogfood:',
            '  localization:',
            '    sourceLocale: en',
            '    locales: [fr, es]',
            '    localized:',
            '      fr: ../localized/guide.fr.md',
            '      es:',
            '        path: ../localized/guide.es.md',
            '---',
            '# Guide',
          ].join('\n');
        },
        fileExists: (path) => path === 'examples/docs/localized/guide.fr.md',
      });

      expect(inventory.entries.map((entry) => `${entry.locale}:${entry.path}`)).toEqual([
        'es:examples/docs/content/guide.md',
      ]);
      expect(inventory.entries[0]?.candidates).toEqual([
        'examples/docs/localized/guide.es.md',
        'examples/docs/content/guide.es.md',
        'examples/docs/content/es/guide.md',
      ]);
      expect(inventory.byLocale).toEqual([{ locale: 'es', count: 1 }]);
    });

  it('groups the current DOGFOOD debt by source surface and stays within the explicit baseline', () => {
      const inventory = collectDogfoodI18nDebt();
      const result = evaluateDogfoodI18nDebtRatchet(inventory);

      expect(inventory.total).toBeGreaterThan(0);
      expect(inventory.bySurface.map((surface) => surface.surface)).toContain('docs-app');
      expect(inventory.bySurface.map((surface) => surface.surface)).toContain('component-stories');
      expect(result.ok).toBe(true);
      expect(result.violations).toEqual([]);
    });

  it('groups the current DOGFOOD Markdown localization debt by locale and stays within the explicit baseline', () => {
      const inventory = collectDogfoodMarkdownLocalizationDebt();
      const result = evaluateDogfoodMarkdownLocalizationRatchet(inventory);

      expect(inventory.documents.length).toBeGreaterThan(0);
      expect(inventory.total).toBe(78);
      expect(inventory.byLocale).toEqual([
        { locale: 'fr', count: 26 },
        { locale: 'es', count: 26 },
        { locale: 'de', count: 26 },
      ]);
      expect(result.ok).toBe(true);
      expect(result.violations).toEqual([]);
    });

  it('reports a nonzero exit when the current debt exceeds a supplied baseline', () => {
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
        changedPaths: [],
        baseline: { total: 0, bySurface: { fixture: 0 } },
        markdownInventory: collectDogfoodMarkdownLocalizationDebt({ sources: [] }),
        markdownBaseline: { total: 0, byLocale: {} },
        stdout: (text) => stdout.push(text),
        stderr: (text) => stderr.push(text),
      });

      expect(exitCode).toBe(1);
      expect(stdout).toEqual([]);
      expect(stderr.join('').length).toBeGreaterThan(0);
    });
});
