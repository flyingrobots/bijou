import { describe, expect, it } from 'vitest';
import {
  collectDogfoodI18nDebt,
  evaluateDogfoodI18nDebtRatchet,
} from '../examples/docs/i18n-debt.js';
import { runDogfoodI18nDebtInventory } from './dogfood-i18n-debt.js';

describe('DOGFOOD i18n debt inventory', () => {
  it('counts uncataloged visible strings while ignoring ids, paths, and catalog fallbacks', () => {
    const inventory = collectDogfoodI18nDebt({
      sources: [{
        surface: 'fixture',
        path: 'examples/docs/fixture.ts',
        text: [
          "import value from './local-module.js';",
          "const cataloged = dogfoodMessage('settings.title', 'Settings');",
          "const fallback = dogfoodText(i18n, 'docs.page.guides', 'Guides');",
          "const page = { id: 'docs.page.guides', title: 'Raw English Title' };",
          "const markdown = readMarkdownDoc('./content/guide.md');",
          "const summary = `Visible template text ${cataloged}`;",
        ].join('\n'),
      }],
    });

    expect(inventory.entries.map((entry) => entry.value)).toEqual([
      'Raw English Title',
      'Visible template text',
    ]);
    expect(inventory.bySurface).toEqual([{ surface: 'fixture', count: 2 }]);
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
      baseline: { total: 0, bySurface: { fixture: 0 } },
      stdout: (text) => stdout.push(text),
      stderr: (text) => stderr.push(text),
    });

    expect(exitCode).toBe(1);
    expect(stdout).toEqual([]);
    expect(stderr.join('').length).toBeGreaterThan(0);
  });
});
