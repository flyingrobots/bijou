import type { ThemeMode } from '../../packages/bijou/src/index.js';
import type { FrameShellThemeSpec } from '../../packages/bijou-tui/src/index.js';
import { dogfoodLocalizedText as dogfoodText } from './localization.js';
import { createDogfoodBookTheme } from './dogfood-book-theme.js';

const DARK_MODE = 'dark' satisfies ThemeMode;
const LIGHT_MODE = 'light' satisfies ThemeMode;
export const DOGFOOD_BOOK_DARK_THEME = createDogfoodBookTheme(DARK_MODE);
export const DOGFOOD_BOOK_LIGHT_THEME = createDogfoodBookTheme(LIGHT_MODE);

export const DOGFOOD_BOOK_SHELL_THEME: FrameShellThemeSpec = Object.freeze({
  id: 'book',
  label: dogfoodText(undefined, 'shell.theme.book.label', 'Bijou Book'),
  description: dogfoodText(undefined, 'shell.theme.book.description', 'Coral, rose and warm ink from the Bijou Book.'),
  modes: [
    {
      id: 'dark',
      label: dogfoodText(undefined, 'shell.theme.book.dark.label', 'Dark'),
      description: dogfoodText(undefined, 'shell.theme.book.dark.description', 'Coral light over warm charcoal.'),
      theme: DOGFOOD_BOOK_DARK_THEME,
    },
    {
      id: 'light',
      label: dogfoodText(undefined, 'shell.theme.book.light.label', 'Light'),
      description: dogfoodText(undefined, 'shell.theme.book.light.description', 'Rose paper with dark wine headings.'),
      theme: DOGFOOD_BOOK_LIGHT_THEME,
    },
  ],
});
