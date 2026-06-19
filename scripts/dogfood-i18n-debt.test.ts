import { describe, expect, it } from 'vitest';
import {
  DOGFOOD_I18N_DEBT_SOURCE_EXCLUSIONS,
  collectDogfoodI18nDebt,
  collectDogfoodMarkdownLocalizationDebt,
  discoverDogfoodI18nDebtSources,
  evaluateDogfoodI18nDebtRatchet,
  evaluateDogfoodMarkdownLocalizationRatchet,
} from '../examples/docs/i18n-debt.js';
import { runDogfoodI18nDebtInventory } from './dogfood-i18n-debt.js';

describe('DOGFOOD i18n debt inventory', () => {
  it('discovers new DOGFOOD docs modules while keeping tooling exclusions explicit', () => {
    const sources = discoverDogfoodI18nDebtSources({
      paths: [
        'examples/docs/app.ts',
        'examples/docs/dogfood-shell-themes.ts',
        'examples/docs/i18n/new-docs-module.ts',
        'examples/docs/i18n-debt.ts',
        'examples/docs/content/guide.md',
        'examples/hello/hello.ts',
      ],
    });

    expect(sources).toEqual([
      { surface: 'docs-app', path: 'examples/docs/app.ts' },
      { surface: 'dogfood-shell-themes', path: 'examples/docs/dogfood-shell-themes.ts' },
      { surface: 'i18n-new-docs-module', path: 'examples/docs/i18n/new-docs-module.ts' },
    ]);
    expect(DOGFOOD_I18N_DEBT_SOURCE_EXCLUSIONS).toContainEqual({
      path: 'examples/docs/i18n-debt.ts',
      reason: 'localization debt scanner implementation, not a DOGFOOD product surface',
    });
  });

  it('fails the ratchet when a newly discovered DOGFOOD module adds raw visible text', () => {
    const sources = discoverDogfoodI18nDebtSources({
      paths: ['examples/docs/new-docs-module.ts'],
    }).map((source) => ({
      ...source,
      text: "export const label = 'Fresh DOGFOOD Label';",
    }));
    const inventory = collectDogfoodI18nDebt({ sources });
    const result = evaluateDogfoodI18nDebtRatchet(inventory, {
      total: 0,
      bySurface: {},
    });

    expect(inventory.bySurface).toEqual([{ surface: 'new-docs-module', count: 1 }]);
    expect(result.ok).toBe(false);
    expect(result.violations).toContain('new-docs-module 1 exceeds baseline 0');
  });

  it('counts uncataloged visible strings while ignoring ids, paths, and catalog fallbacks', () => {
    const inventory = collectDogfoodI18nDebt({
      sources: [{
        surface: 'fixture',
        path: 'examples/docs/fixture.ts',
        text: [
          "import value from './local-module.js';",
          "const cataloged = dogfoodMessage('settings.title', 'Settings');",
          "const fallback = dogfoodText(i18n, 'docs.page.guides', 'Guides');",
          "const token = 'docs.page.guides';",
          "const loadingLabel = 'loading';",
          "const continueLabel = 'continue';",
          "const requiredModes: readonly OutputMode[] = ['interactive', 'static'];",
          "const msg = { type: 'fixture-event', key: 'j' };",
          "const pane = { overflowX: 'scroll', tone: 'muted' };",
          "if (msg.type === 'pulse') return msg;",
          "switch (msg.key) { case 'j': return msg; }",
          "throw new Error('Internal fixture failure');",
          "createKeyMap().group('Visible key group', (group) => group.bind('j', 'Visible key label', msg));",
          "const page = { id: 'docs.page.guides', title: 'Raw English Title' };",
          "const markdown = readMarkdownDoc('./content/guide.md');",
          "const summary = `Visible template text ${cataloged}`;",
        ].join('\n'),
      }],
    });

    expect(inventory.entries.map((entry) => entry.value)).toEqual([
      'loading',
      'continue',
      'Visible key group',
      'Visible key label',
      'Raw English Title',
      'Visible template text',
    ]);
    expect(inventory.bySurface).toEqual([{ surface: 'fixture', count: 6 }]);
  });

  it('ignores machine environment mode literals without dropping visible copy', () => {
    const inventory = collectDogfoodI18nDebt({
      sources: [{
        surface: 'fixture',
        path: 'examples/docs/fixture.ts',
        text: [
          "const isProduction = process.env.NODE_ENV === 'production';",
          "const visible = 'production';",
        ].join('\n'),
      }],
    });

    expect(inventory.entries.map((entry) => entry.value)).toEqual(['production']);
  });

  it('ignores raster-renderer option literals without dropping visible copy', () => {
    const inventory = collectDogfoodI18nDebt({
      sources: [{
        surface: 'fixture',
        path: 'examples/docs/fixture.ts',
        text: [
          "const renderer = { kind: 'charset', fit: 'stretch', colorMode: 'fg' };",
          "const visible = 'Visible renderer label';",
        ].join('\n'),
      }],
    });

    expect(inventory.entries.map((entry) => entry.value)).toEqual(['Visible renderer label']);
  });

  it('ignores theme palette family identifiers only in the theme palette loop', () => {
    const inventory = collectDogfoodI18nDebt({
      sources: [{
        surface: 'fixture',
        path: 'examples/docs/fixture.ts',
        text: [
          "function themePaletteRows(theme: unknown) {",
          "  const rows: unknown[] = [];",
          "  for (const family of ['semantic', 'surface', 'border', 'ui', 'status', 'gradient'] as const) {",
          "    rows.push({ kind: 'group', label: family });",
          "  }",
          "  return rows;",
          "}",
          "const visible = 'semantic';",
        ].join('\n'),
      }],
    });

    expect(inventory.entries.map((entry) => entry.value)).toEqual(['semantic']);
  });

  it('freezes nested inventory entries and surface counts', () => {
    const inventory = collectDogfoodI18nDebt({
      sources: [{
        surface: 'fixture',
        path: 'examples/docs/fixture.ts',
        text: "const title = 'Raw English Title';",
      }],
    });

    expect(Object.isFrozen(inventory)).toBe(true);
    expect(Object.isFrozen(inventory.entries)).toBe(true);
    expect(Object.isFrozen(inventory.entries[0])).toBe(true);
    expect(Object.isFrozen(inventory.bySurface)).toBe(true);
    expect(Object.isFrozen(inventory.bySurface[0])).toBe(true);
  });

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
