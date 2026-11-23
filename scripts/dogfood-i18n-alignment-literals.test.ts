import { describe, expect, it } from 'vitest';
import { collectDogfoodI18nDebt } from '../examples/docs/i18n-debt.js';

describe('DOGFOOD layout alignment literal classification', () => {
  it('excludes only direct recognized alignment enum values', () => {
    const inventory = collectDogfoodI18nDebt({
      sources: [{
        surface: 'fixture',
        path: 'examples/docs/fixture.ts',
        text: [
          "const a = { hAlign: 'left', vAlign: 'top' };",
          "const b = { hAlign: 'center', vAlign: 'middle' };",
          "const c = { 'hAlign': 'right', 'vAlign': 'bottom' };",
          "const visible = { title: 'center', label: 'top' };",
          "const wrongAxis = { hAlign: 'top', vAlign: 'center' };",
          "const custom = { hAlign: 'Visible horizontal guidance', vAlign: 'Visible vertical guidance' };",
          "const nested = { hAlign: { label: 'center' }, vAlign: ['top'] };",
        ].join('\n'),
      }],
    });

    expect(inventory.entries.map((entry) => entry.value)).toEqual([
      'center',
      'top',
      'top',
      'center',
      'Visible horizontal guidance',
      'Visible vertical guidance',
      'center',
      'top',
    ]);
  });
});
