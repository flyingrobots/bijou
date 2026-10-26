import type { BijouContext, Surface, Theme } from '../../packages/bijou/src/index.js';
import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import type { LandingThemeTokens } from './app-landing.js';
import { themeLabBox } from './app-theme-lab-layout.js';
import { renderThemeTokenPalette } from './app-theme-token-palette.js';

const PALETTE_MAX_ROWS = 28;

/** Boxed swatch listing for the draft theme the editor is working on. */
export function themeLabPalette(
  theme: Theme,
  title: string,
  paneWidth: number,
  bodyWidth: number,
  ctx: BijouContext,
  landingTheme: LandingThemeTokens,
  localization: LocalizationPort | undefined,
): Surface {
  return themeLabBox(renderThemeTokenPalette(theme, bodyWidth, localization, {
    maxRows: PALETTE_MAX_ROWS,
    chromeTheme: ctx.theme.theme,
  }), title, paneWidth, ctx, landingTheme);
}
