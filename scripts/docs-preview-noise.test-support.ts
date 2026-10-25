import { createSurface } from '../packages/bijou/src/index.js';
import { paintLandingBackground } from '../examples/docs/app-landing-background.js';
import { resolveLandingQuality } from '../examples/docs/app-landing-quality.js';
import { docsVisualThemeFromShellThemeChoice } from '../examples/docs/app-landing-themes.js';
import { DOGFOOD_BOOK_DARK_THEME } from '../examples/docs/dogfood-book-theme-spec.js';

/** Isolate the real backdrop to verify that overlays preserve underlying cells. */
export function bareBookLandingBackground(width: number, height: number) {
  const tokens = docsVisualThemeFromShellThemeChoice({
    id: 'book:dark', label: 'Book', theme: DOGFOOD_BOOK_DARK_THEME,
  });
  const surface = createSurface(width, height);
  paintLandingBackground(surface, 0, tokens, resolveLandingQuality(width, height));
  return surface;
}
