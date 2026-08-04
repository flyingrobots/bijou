import { describe, expect, it } from 'vitest';
import { BIJOU_DARK, colorHex, surfaceToString, type Surface, type Theme } from '@flyingrobots/bijou';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { renderThemeLabPickerSurface } from '../../../examples/docs/app-theme-lab-picker.js';
import { renderThemeLabPreviewSurface } from '../../../examples/docs/app-theme-lab-preview.js';
import { themeLabDisplayName } from '../../../examples/docs/app-theme-lab-copy.js';
import { cloneThemeForThemeLabEditor } from '../../../examples/docs/app-theme-lab-editor-theme.js';
import { DOCS_SHELL_THEME_CHOICES } from '../../../examples/docs/app-shell-theme-state.js';

const ctx = createTestContext({
  theme: BIJOU_DARK,
  mode: 'interactive',
  runtime: { columns: 100, rows: 40 },
});

const RENDER_TOKENS = {
  accent: BIJOU_DARK.semantic.accent,
  body: BIJOU_DARK.surface.primary,
  muted: BIJOU_DARK.surface.muted,
};

function choiceById(id: string) {
  const found = DOCS_SHELL_THEME_CHOICES.find((choice) => choice.id === id);
  if (found === undefined) throw new Error(`No shell theme choice "${id}".`);
  return found;
}

/** Every foreground and background colour actually written into a surface. */
function colorsIn(surface: Surface): ReadonlySet<string> {
  const seen = new Set<string>();
  for (let y = 0; y < surface.height; y++) {
    for (let x = 0; x < surface.width; x++) {
      const cell = surface.get(x, y);
      const fg = colorHex(cell.fg);
      const bg = colorHex(cell.bg);
      if (fg !== undefined) seen.add(fg.toLowerCase());
      if (bg !== undefined) seen.add(bg.toLowerCase());
    }
  }
  return seen;
}

describe('theme lab picker', () => {
  const surface = renderThemeLabPickerSurface(
    DOCS_SHELL_THEME_CHOICES,
    'dogfood:dark',
    90,
    RENDER_TOKENS,
  );
  const text = surfaceToString(surface, ctx.style);

  it('lists every selectable shell theme, not just the active one', () => {
    expect(DOCS_SHELL_THEME_CHOICES.length).toBeGreaterThan(1);
    for (const choice of DOCS_SHELL_THEME_CHOICES) {
      expect(text).toContain(choice.label);
    }
  });

  it('reports how many themes there are', () => {
    expect(text).toContain(`${String(DOCS_SHELL_THEME_CHOICES.length)} themes available`);
  });

  it('marks the active choice', () => {
    const activeLine = text.split('\n').find((line) => line.includes('DOGFOOD / Dark'));
    expect(activeLine?.trimStart().startsWith('*')).toBe(true);
  });

  it('draws each theme in its own colours, so the list scans as colour', () => {
    const painted = colorsIn(surface);
    for (const choice of DOCS_SHELL_THEME_CHOICES) {
      expect(painted).toContain(choice.theme.semantic.accent.hex.toLowerCase());
    }
  });
});

describe('theme lab live preview', () => {
  it('renders components in the draft theme rather than the surrounding shell', () => {
    const plum = choiceById('verdant-plum').theme;
    const painted = colorsIn(renderThemeLabPreviewSurface(plum, ctx, 60));

    // ctx is BIJOU_DARK; the preview must follow the theme it was handed.
    expect(painted).toContain(plum.semantic.accent.hex.toLowerCase());
    expect(painted).toContain(plum.semantic.error.hex.toLowerCase());
  });

  it('repaints when the theme changes', () => {
    const dark = choiceById('dogfood:dark').theme;
    const plum = choiceById('verdant-plum').theme;
    expect(dark.semantic.accent.hex).not.toBe(plum.semantic.accent.hex);

    const darkColors = colorsIn(renderThemeLabPreviewSurface(dark, ctx, 60));
    const plumColors = colorsIn(renderThemeLabPreviewSurface(plum, ctx, 60));

    expect(darkColors).toContain(dark.semantic.accent.hex.toLowerCase());
    expect(plumColors).not.toContain(dark.semantic.accent.hex.toLowerCase());
  });

  it('keeps the status roles side by side, where a collision would show', () => {
    const text = surfaceToString(renderThemeLabPreviewSurface(BIJOU_DARK, ctx, 60), ctx.style);
    for (const label of ['SUCCESS', 'WARNING', 'ERROR', 'INFO', 'ACCENT']) {
      expect(text).toContain(label);
    }
  });
});

describe('theme lab display name', () => {
  const base: Theme = choiceById('dogfood:dark').theme;

  it('reports the shell theme name, not the editor draft clone', () => {
    const draft = cloneThemeForThemeLabEditor(base);
    expect(draft.name).toContain('-draft');
    expect(themeLabDisplayName(base, draft, undefined)).toBe(base.name);
  });

  it('marks the name once the draft diverges', () => {
    const draft = cloneThemeForThemeLabEditor(base);
    const edited: Theme = {
      ...draft,
      semantic: { ...draft.semantic, accent: { ...draft.semantic.accent, hex: '#123456' } },
    };
    expect(themeLabDisplayName(base, edited, undefined)).toBe(`${base.name} (edited)`);
  });
});
