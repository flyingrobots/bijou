import { describe, expect, it } from 'vitest';
import { createTestContext } from '../../adapters/test/index.js';
import { surfaceToString } from '../render/differ.js';
import { preparePreferenceRow, preparePreferenceSections, preferenceListSurface, resolvePreferenceRowLayout, type PreferenceSection } from './preference-list.js';

describe('preference list surfaces', () => {
  it('reuses prepared rows and sections without changing preference list rendering', () => {
      const ctx = createTestContext({ mode: 'interactive' });
      const sections: readonly PreferenceSection[] = [{
        id: 'appearance',
        title: 'Appearance',
        rows: [{
          id: 'theme',
          label: 'Landing theme',
          valueLabel: 'Storybook Workstation',
          description: 'Uses the current design-language accent palette for the docs shell.',
          kind: 'choice',
        }],
      }];

      const rawSurface = preferenceListSurface(sections, {
        width: 28,
        selectedRowId: 'theme',
        ctx,
      });
      const preparedSurface = preferenceListSurface(preparePreferenceSections(sections), {
        width: 28,
        selectedRowId: 'theme',
        ctx,
      });

      expect(surfaceToString(preparedSurface, ctx.style)).toBe(surfaceToString(rawSurface, ctx.style));
    });

  it('uses grapheme-aware widths when resolving prepared row layout', () => {
      const prepared = preparePreferenceRow({
        id: 'theme',
        label: 'Theme 😀',
        valueLabel: '選択中',
        kind: 'choice',
      });

      const layout = resolvePreferenceRowLayout(prepared, 16);
      expect(layout.stackValue).toBe(true);
    });
});
