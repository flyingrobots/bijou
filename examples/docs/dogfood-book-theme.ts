import type { Theme, ThemeMode } from '../../packages/bijou/src/index.js';
import { compileRuleAuthoredPreset } from '../../packages/bijou/src/core/theme/preset-authoring.js';
import { minContrastWith } from '../../packages/bijou/src/core/theme/theme-rules.js';
import { BOOK_COLORS, BOOK_MODE_COLORS } from './dogfood-book-palette.js';

/** Build an inspectable book theme without modifying global first-party presets. */
export function createDogfoodBookTheme(mode: ThemeMode): Theme {
  const palette = BOOK_MODE_COLORS[mode];
  return compileRuleAuthoredPreset({
    name: `dogfood-book-${mode}`,
    mode,
    definitions: {
      book: BOOK_COLORS,
      palette,
      decision: {
        accent: minContrastWith({ ref: 'palette.elevated' }, ['palette.accent'], { ratio: 4.5 }),
      },
      status: {
        success: { ref: 'palette.success' }, error: { ref: 'palette.error' },
        warning: { ref: 'palette.warning' }, info: { ref: 'palette.info' },
        pending: { ref: 'palette.muted' }, active: { ref: 'decision.accent' },
        muted: { fg: { ref: 'palette.muted' }, modifiers: ['strikethrough'] },
      },
      semantic: {
        primary: { ref: 'palette.text' }, muted: { ref: 'palette.muted' },
        accent: { ref: 'decision.accent' }, info: { ref: 'status.info' },
        success: { ref: 'status.success' }, warning: { ref: 'status.warning' }, error: { ref: 'status.error' },
      },
      border: {
        primary: { ref: 'palette.chrome' }, secondary: { ref: 'semantic.accent' },
        success: { ref: 'semantic.success' }, warning: { ref: 'semantic.warning' },
        error: { ref: 'semantic.error' }, muted: { ref: 'palette.chrome' },
      },
      ui: {
        cursor: { ref: 'semantic.accent' },
        focusGutter: { fg: { ref: 'semantic.accent' }, bg: { ref: 'palette.background' }, modifiers: ['bold'] },
        scrollThumb: { ref: 'semantic.accent' }, scrollTrack: { ref: 'palette.chrome' },
        sectionHeader: { fg: { ref: 'semantic.accent' }, modifiers: ['bold'] },
        logo: { ref: 'semantic.accent' }, tableHeader: { ref: 'semantic.primary' },
        trackEmpty: { ref: 'palette.chrome' },
      },
      surface: {
        primary: { fg: { ref: 'palette.text' }, bg: { ref: 'palette.background' } },
        secondary: { fg: { ref: 'palette.text' }, bg: { ref: 'palette.secondary' } },
        elevated: { fg: { ref: 'palette.text' }, bg: { ref: 'palette.elevated' } },
        overlay: { fg: { ref: 'palette.text' }, bg: { ref: 'palette.overlay' } },
        muted: { fg: { ref: 'palette.muted' }, bg: { ref: 'palette.surfaceMuted' } },
      },
    },
    gradient: {
      brand: [{ ref: 'semantic.accent' }, { ref: 'palette.error' }, { ref: 'palette.text' }],
      progress: [{ ref: 'palette.info' }, { ref: 'semantic.accent' }, { ref: 'palette.success' }],
    },
  });
}
