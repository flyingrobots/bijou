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
