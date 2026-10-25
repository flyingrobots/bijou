import { describe, expect, it } from 'vitest';
import { colorHex, createSurface, type Surface } from '../packages/bijou/src/index.js';
import type { LocalizationPort } from '../packages/bijou-i18n/src/index.js';
import { createLandingPromptSurface } from '../examples/docs/app-landing-footer.js';
import { createRasterPrompt } from '../examples/docs/app-prompt-raster.js';
import { placeLandingCluster } from '../examples/docs/app-landing-layout.js';
import { resolveLandingTheme } from '../examples/docs/app-landing-themes.js';
import { LANDING_TEXT_MODIFIERS } from '../examples/docs/app-shell-theme-state.js';

const tokens = resolveLandingTheme(0);
const modifiers = LANDING_TEXT_MODIFIERS;
function text(surface: Surface): string {
  return Array.from({ length: surface.height }, (_, y) => Array.from({ length: surface.width }, (_, x) => surface.get(x, y).char).join('')).join('\n');
}

function localized(value: string): LocalizationPort {
  return {
    locale: 'fr', direction: 'ltr',
    resolve: (request) => ({ key: request.key, value, locale: 'fr', fallbackLocale: 'en', direction: 'ltr', kind: 'message', status: 'translated', issues: [], facts: [] }),
    formatNumber: String, formatDate: (date) => date.toISOString(),
    formatTime: (date) => date.toISOString(), formatList: (values) => values.join(', '),
  };
}

describe('DOGFOOD font prompt and lowering', () => {
  it('renders the interactive prompt with offline Space Grotesk geometry and changing theme colors', () => {
    const before = createLandingPromptSurface(tokens, modifiers, 0);
    const after = createLandingPromptSurface(tokens, modifiers, 900);
    expect(before.height).toBe(3);
    expect(text(before)).toMatch(/[\u2801-\u28ff]/u);
    expect(text(after)).toBe(text(before));
    const colors = (surface: Surface) => Array.from({ length: surface.width }, (_, x) => colorHex(surface.get(x, 0).fg));
    expect(colors(after)).not.toEqual(colors(before));
  });

  it.each(['static', 'pipe', 'accessible'] as const)('lowers to the actual words, without raster lettering or time changes, in %s mode', (mode) => {
    const presentation = { mode, width: 80, rows: 10 };
    const before = createLandingPromptSurface(tokens, modifiers, 0, undefined, presentation);
    const after = createLandingPromptSurface(tokens, modifiers, 900, undefined, presentation);
    expect(before.height).toBe(1);
    expect(text(before)).toBe('Press [Enter]');
    expect(text(after)).toBe(text(before));
    expect(colorHex(after.get(0, 0).fg)).toBe(colorHex(before.get(0, 0).fg));
  });

  it('preserves localized text when the atlas lacks its characters', () => {
    const message = 'Appuyez sur [Entrée]';
    const prompt = createLandingPromptSurface(tokens, modifiers, 0, localized(message));
    expect(text(prompt)).toBe(message);
    expect(prompt.height).toBe(1);
  });

  it('falls back in narrow or short layouts', () => {
    for (const [width, rows] of [[10, 3], [80, 1]]) {
      const prompt = createLandingPromptSurface(tokens, modifiers, 0, undefined, { mode: 'interactive', width: width ?? 0, rows: rows ?? 0 });
      expect(text(prompt)).toBe('Press [Enter]');
    }
    expect(createRasterPrompt('', tokens, 0, 80, 3)).toBeUndefined();
    const compact = createRasterPrompt('Press [Enter]', tokens, 0, 80, 2);
    expect(compact?.height).toBe(2);
  });

  it('keeps the prompt visible when the panel and prompt cannot both fit', () => {
    const prompt = createLandingPromptSurface(tokens, modifiers, 0);
    const surface = createSurface(80, 20);
    const panel = createSurface(60, 4, { char: 'X' });
    const wordmark = createSurface(20, 4, { char: 'W' });
    placeLandingCluster(surface, panel, prompt, wordmark, {
      availableHeight: 4, contentTop: 14, contentBottom: 17,
      fullClusterHeight: 13, compactClusterHeight: 8,
      tokens, modifiers, timeMs: 0,
    });
    expect(text(surface)).toMatch(/[\u2801-\u28ff]/u);
    expect(text(surface)).not.toContain('X');
  });
});
