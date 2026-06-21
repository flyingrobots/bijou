import { describe, expect, it } from 'vitest';
import { DOGFOOD_I18N_DEBT_SOURCE_EXCLUSIONS, collectDogfoodI18nDebt, discoverDogfoodI18nDebtSources, evaluateDogfoodI18nDebtRatchet } from '../examples/docs/i18n-debt.js';

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
});
