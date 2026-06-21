import { afterEach, describe, expect, it } from 'vitest';
import { doctorTheme } from '@flyingrobots/bijou';
import { must, _resetDefaultContextForTesting  } from '@flyingrobots/bijou/adapters/test';

import {
  DOGFOOD_SHELL_THEMES,
  DOGFOOD_THEME_SAFE_PAIRS,
} from '../../../examples/docs/dogfood-shell-themes.js';

describe('DL-017 DOGFOOD light theme readiness', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });
  it('covers DOGFOOD light chrome tokens in safe-pair diagnostics', () => {
      const lightTheme = DOGFOOD_SHELL_THEMES[0]?.modes?.find((mode) => mode.id === 'light')?.theme;
      expect(lightTheme?.name).toBe('dogfood-light');

      const requiredChromePairs = [
        'border.primary -> surface.elevated.bg',
        'border.primary -> surface.overlay.bg',
        'border.muted -> surface.primary.bg',
        'border.muted -> surface.elevated.bg',
        'ui.scrollThumb -> surface.elevated.bg',
        'ui.scrollTrack -> surface.elevated.bg',
        'ui.focusGutter -> ui.focusGutter.bg',
      ];
      const chromePairs = new Set(
        DOGFOOD_THEME_SAFE_PAIRS
          .filter((pair) => pair.kind === 'chrome')
          .map((pair) => `${pair.foreground} -> ${pair.background}`),
      );

      for (const pair of requiredChromePairs) {
        expect(chromePairs).toContain(pair);
      }

      const report = doctorTheme(must(lightTheme), { contrastPairs: DOGFOOD_THEME_SAFE_PAIRS });
      expect(report.issues.filter((issue) => issue.kind === 'low-contrast')).toEqual([]);
    });
});
