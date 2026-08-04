import { describe, expect, it } from 'vitest';
import { BIJOU_DARK, surfaceToString } from '@flyingrobots/bijou';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { renderThemeLabPane } from '../../../examples/docs/app-theme-lab.js';
import { DOCS_SHELL_THEME_CHOICES } from '../../../examples/docs/app-shell-theme-state.js';
import { LANDING_THEMES } from '../../../examples/docs/app-landing-themes.js';
import { docsVisualThemeFromShellThemeChoice } from '../../../examples/docs/app-landing-themes.js';

const ctx = createTestContext({
  theme: BIJOU_DARK,
  mode: 'interactive',
  runtime: { columns: 100, rows: 40 },
});

function paneLines(): readonly string[] {
  const activeTheme = DOCS_SHELL_THEME_CHOICES[0];
  if (activeTheme === undefined) throw new Error('No shell theme choices.');
  const landingTheme = LANDING_THEMES[0]
    ?? docsVisualThemeFromShellThemeChoice(activeTheme);

  const surface = renderThemeLabPane({
    width: 100,
    ctx,
    landingTheme,
    activeTheme,
    shellThemes: DOCS_SHELL_THEME_CHOICES,
  });
  return surfaceToString(surface, ctx.style).split('\n');
}

function rowOf(lines: readonly string[], title: string): number {
  const index = lines.findIndex((line) => line.includes(`─ ${title} ─`));
  if (index < 0) throw new Error(`Theme Lab has no "${title}" box.`);
  return index;
}

describe('theme lab page order', () => {
  const lines = paneLines();

  it('pairs the picker and the preview on the top row', () => {
    // Side by side rather than stacked: the pane is far wider than it is
    // tall, and spending that width is what keeps the page on one screen.
    expect(rowOf(lines, 'Themes')).toBe(rowOf(lines, 'Live preview'));
  });

  it('puts the picker and preview above the editor and its reference material', () => {
    const top = rowOf(lines, 'Themes');
    for (const title of ['Theme editor', 'Why this value', 'Live token graph', 'theme posture']) {
      expect(top).toBeLessThan(rowOf(lines, title));
    }
  });

  it('pairs the editor column with the token graph', () => {
    expect(rowOf(lines, 'Theme editor')).toBe(rowOf(lines, 'Live token graph'));
  });

  it('keeps the picker and preview inside the first screenful', () => {
    // The regression this replaces: the theme list rendered at row 108 of a
    // 116-row pane, so a reader on a normal terminal saw one theme named in
    // the editor context and concluded the lab offered exactly one.
    const SCREENFUL = 30;
    expect(rowOf(lines, 'Themes')).toBeLessThan(SCREENFUL);
    expect(rowOf(lines, 'Live preview')).toBeLessThan(SCREENFUL);
  });

  it('lists every theme above the fold', () => {
    const SCREENFUL = 30;
    const visible = lines.slice(0, SCREENFUL).join('\n');
    for (const choice of DOCS_SHELL_THEME_CHOICES) {
      expect(visible).toContain(choice.label);
    }
  });

  it('names the active theme as the app names it, without the draft suffix', () => {
    const text = lines.join('\n');
    expect(text).toContain('Theme: dogfood-dark');
    expect(text).not.toContain('dogfood-dark-draft');
  });
});
