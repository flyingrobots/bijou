import { describe, expect, it } from 'vitest';
import { surfaceToString, type Surface } from '@flyingrobots/bijou';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { renderThemeLabEditorSurface } from '../../../examples/docs/app-theme-lab-editor-view.js';
import { createThemeLabEditorState } from '../../../examples/docs/app-theme-lab-editor-model.js';
import { renderThemeLabPickerSurface } from '../../../examples/docs/app-theme-lab-picker.js';
import { themeLabPaneCopy } from '../../../examples/docs/app-theme-lab-state.js';
import { DOCS_SHELL_THEME_CHOICES } from '../../../examples/docs/app-shell-theme-state.js';

const choice = DOCS_SHELL_THEME_CHOICES.find((item) => item.id === 'book:dark');
if (choice === undefined) throw new Error('Missing Book theme fixture.');
const theme = choice.theme;
const tokens = { accent: theme.semantic.accent, body: theme.surface.primary, muted: theme.surface.muted };
const ctx = createTestContext({ theme, mode: 'interactive' });
const compact = (text: string): string => text.replace(/\s/gu, '');
const textOf = (surface: Surface): string => compact(surfaceToString(surface, ctx.style));

describe('complete Theme Lab headers in narrow source surfaces', () => {
  it.each([24, 36])('preserves every editor context and control at width %i', (width) => {
    const contextLines = themeLabPaneCopy(choice, DOCS_SHELL_THEME_CHOICES, theme, undefined).editorContext;
    const surface = renderThemeLabEditorSurface(
      theme, createThemeLabEditorState(choice.id, theme), width, undefined, tokens, { contextLines },
    );
    const text = textOf(surface);
    expect(surface.width).toBe(width);
    for (const line of contextLines) expect(text).toContain(compact(line));
    expect(text).toContain(compact('Selected: semantic.primary'));
    expect(text).toContain(compact('Channel: red'));
    expect(text).toContain(compact('Controls: n/p color | 1/2/3 channel | -/+ nudge | 0 reset'));
  });

  it.each([24, 36])('preserves the picker hint and long labels at width %i', (width) => {
    const label = 'A deliberately long localized theme label';
    const choices = [{ ...choice, label }, { ...choice, id: 'another', label: 'Second theme' }];
    const surface = renderThemeLabPickerSurface(choices, choice.id, width, tokens);
    const text = textOf(surface);
    expect(surface.width).toBe(width);
    expect(text).toContain(compact('F2 opens the theme picker. 2 themes available.'));
    expect(text).toContain(compact(`1. ${label}`));
    expect(text).toContain(compact('2. Second theme'));
  });
});
