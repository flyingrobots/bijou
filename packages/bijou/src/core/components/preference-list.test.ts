import { describe, expect, it } from 'vitest';
import { createTestContext } from '../../adapters/test/index.js';
import { surfaceToString } from '../render/differ.js';
import { stripAnsi } from '../text/grapheme.js';
import {
  preparePreferenceRow,
  preparePreferenceSections,
  preferenceListSurface,
  preferenceRowSurface,
  resolvePreferenceRowLayout,
  type PreferenceSection,
} from './preference-list.js';

describe('preference list surfaces', () => {
  it('renders selected toggle rows with a surface background and checkbox affordance', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const surface = preferenceRowSurface({
      id: 'show-hints',
      label: 'Show hints',
      description: 'Show active control cues in the footer.',
      checked: true,
      kind: 'toggle',
    }, {
      width: 32,
      selected: true,
      ctx,
    });

    const rendered = stripAnsi(surfaceToString(surface, ctx.style));

    expect(rendered).toContain('☑ Show hints');
    expect(rendered).toContain('☑ On');
    expect(surface.get(1, 0).bg).toBe(ctx.surface('elevated').bg);
  });

  it('stacks long choice values beneath the label in narrow widths', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const surface = preferenceRowSurface({
      id: 'theme',
      label: 'Landing theme',
      valueLabel: 'Storybook Workstation',
      kind: 'choice',
    }, {
      width: 28,
      selected: true,
      ctx,
    });

    const lines = stripAnsi(surfaceToString(surface, ctx.style)).split('\n');
    const labelLine = lines.findIndex((line) => line.includes('Landing theme'));
    const valueLine = lines.findIndex((line) => line.includes('Storybook Workstation'));

    expect(labelLine).toBeGreaterThanOrEqual(0);
    expect(valueLine).toBe(labelLine + 1);
  });

  it('resolves row layout height from stacked values and wrapped descriptions', () => {
    const layout = resolvePreferenceRowLayout({
      id: 'theme',
      label: 'Landing theme',
      valueLabel: 'Storybook Workstation',
      description: 'Sets the DOGFOOD title screen and docs accent palette.',
      kind: 'choice',
    }, 28);

    expect(layout.stackValue).toBe(true);
    expect(layout.descriptionLines.length).toBeGreaterThan(1);
    expect(layout.height).toBe(1 + 1 + layout.descriptionLines.length);
  });

  it('renders sectioned preference lists with spacing between headings and rows', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const sections: readonly PreferenceSection[] = [{
      id: 'appearance',
      title: 'Appearance',
      rows: [{
        id: 'theme',
        label: 'Landing theme',
        valueLabel: 'Paper Moon',
        kind: 'choice',
      }],
    }, {
      id: 'landing',
      title: 'Landing',
      rows: [{
        id: 'quality',
        label: 'Landing quality',
        valueLabel: 'Auto',
        kind: 'choice',
      }],
    }];

    const surface = preferenceListSurface(sections, {
      width: 32,
      selectedRowId: 'theme',
      ctx,
    });
    const lines = stripAnsi(surfaceToString(surface, ctx.style)).split('\n');
    const appearanceLine = lines.findIndex((line) => line.includes('Appearance'));
    const themeLine = lines.findIndex((line) => line.includes('Landing theme'));
    const landingLine = lines.findIndex((line) => line.trim() === 'Landing');
    const qualityLine = lines.findIndex((line) => line.includes('Landing quality'));

    expect(appearanceLine).toBeGreaterThanOrEqual(0);
    expect(themeLine).toBeGreaterThan(appearanceLine + 1);
    expect(landingLine).toBeGreaterThan(themeLine + 1);
    expect(qualityLine).toBeGreaterThan(landingLine + 1);
  });

  it('honors explicit theme tokens for section titles and selected rows', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const surface = preferenceListSurface([{
      id: 'appearance',
      title: 'Appearance',
      rows: [{
        id: 'theme',
        label: 'Landing theme',
        valueLabel: 'Paper Moon',
        kind: 'choice',
      }],
    }], {
      width: 32,
      selectedRowId: 'theme',
      ctx,
      theme: {
        sectionTitleToken: { hex: '#ffaa00' },
        selectedRowBgToken: { hex: '#102938', bg: '#102938' },
        choiceToken: { hex: '#ff66cc' },
        descriptionToken: { hex: '#7799aa' },
      },
    });

    expect(surface.get(0, 0).fg).toBe('#ffaa00');
    expect(surface.get(1, 2).bg).toBe('#102938');
    expect(
      Array.from({ length: surface.width }, (_, x) => surface.get(x, 2).fg).includes('#ff66cc'),
    ).toBe(true);
  });

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
