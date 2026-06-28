import {
  BIJOU_DARK,
  BIJOU_LIGHT,
  boxSurface,
  createSurface,
  separatorSurface,
  type BijouContext,
  type Surface,
} from '../../packages/bijou/src/index.js';
import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import { column, proseSurface, spacer } from '../_shared/example-surfaces.js';
import type { DocsShellThemeChoice } from './app-docs-shell-theme.js';
import {
  docsThemeBorderToken,
  docsThemeMutedBorderToken,
  docsThemeSurfaceToken,
} from './app-docs-theme-tokens.js';
import type { LandingThemeTokens } from './app-landing.js';
import { dogfoodSafePairSummary, themeColorReuseSummary } from './app-theme-diagnostics.js';
import { renderThemeTokenPalette } from './app-theme-token-palette.js';
import { dogfoodLocalizedText } from './localization.js';

interface ThemeLabPaneOptions {
  readonly width: number;
  readonly ctx: BijouContext;
  readonly landingTheme: LandingThemeTokens;
  readonly activeTheme: DocsShellThemeChoice;
  readonly shellThemes: readonly DocsShellThemeChoice[];
  readonly localization?: LocalizationPort;
}

function dogfoodText(
  localization: LocalizationPort | undefined,
  id: string,
  fallback: string,
  values: Readonly<Record<string, unknown>> = {},
): string {
  return dogfoodLocalizedText(localization, id, fallback, values);
}

export function renderThemeLabPane(options: ThemeLabPaneOptions): Surface {
  const { width, ctx, landingTheme, activeTheme, shellThemes, localization } = options;
  const paneWidth = themeLabPaneInnerWidth(width);
  const bodyWidth = Math.max(24, paneWidth - 2);
  const shellGallery = shellThemes
    .map((shellTheme, index) => {
      const marker = shellTheme.id === activeTheme.id ? '* ' : '  ';
      return `${marker}${String(index + 1)}. ${shellTheme.label} -> ${shellTheme.theme.name}`;
    })
    .join('\n');
  const defaultSummary = [
    dogfoodText(localization, 'themeInspector.active', 'Active: {label}', { label: activeTheme.label }),
    dogfoodText(localization, 'themeInspector.theme', 'Theme: {name}', { name: activeTheme.theme.name }),
    dogfoodSafePairSummary(activeTheme.theme, localization),
    dogfoodText(localization, 'themeLab.defaultDark', 'Default dark preset: {name} ({summary})', {
      name: BIJOU_DARK.name,
      summary: dogfoodSafePairSummary(BIJOU_DARK, localization),
    }),
    dogfoodText(localization, 'themeLab.defaultLight', 'Default light preset: {name} ({summary})', {
      name: BIJOU_LIGHT.name,
      summary: dogfoodSafePairSummary(BIJOU_LIGHT, localization),
    }),
    dogfoodText(localization, 'themeLab.colorReuseLine', 'Color reuse: dark {dark}; light {light}.', {
      dark: themeColorReuseSummary(BIJOU_DARK, localization),
      light: themeColorReuseSummary(BIJOU_LIGHT, localization),
    }),
    dogfoodText(
      localization,
      'themeLab.swatchCoverage',
      'Swatches include semantic.primary, surface.primary, and gradient.brand rows.',
    ),
    dogfoodText(localization, 'themeLab.f10Hint', 'F10 opens the Theme Inspector drawer from the docs shell.'),
  ].join('\n');

  return themeLabInsetPaneSurface(column([
    themeLabSeparatorSurface(dogfoodText(localization, 'themeLab.separator', 'docs • Theme Lab'), paneWidth, ctx, landingTheme),
    spacer(1, 1),
    themeLabBox(defaultSummary, dogfoodText(localization, 'themeLab.postureTitle', 'theme posture'), paneWidth, bodyWidth, ctx, landingTheme),
    spacer(1, 1),
    themeLabBox(shellGallery, dogfoodText(localization, 'themeLab.galleryTitle', 'shell gallery'), paneWidth, bodyWidth, ctx, landingTheme),
    spacer(1, 1),
    themeLabPalette(activeTheme.theme, activeTheme.label, paneWidth, bodyWidth, ctx, landingTheme, localization),
    spacer(1, 1),
    themeLabPalette(BIJOU_DARK, dogfoodText(localization, 'themeLab.darkSwatchesTitle', 'bijou-dark token swatches'), paneWidth, bodyWidth, ctx, landingTheme, localization),
    spacer(1, 1),
    themeLabPalette(BIJOU_LIGHT, dogfoodText(localization, 'themeLab.lightSwatchesTitle', 'bijou-light token swatches'), paneWidth, bodyWidth, ctx, landingTheme, localization),
  ]), width);
}

function themeLabBox(
  text: string,
  title: string,
  paneWidth: number,
  bodyWidth: number,
  ctx: BijouContext,
  theme: LandingThemeTokens,
): Surface {
  return boxSurface(proseSurface(text, bodyWidth), {
    title,
    width: Math.max(28, paneWidth),
    borderToken: docsThemeMutedBorderToken(theme),
    bgToken: docsThemeSurfaceToken(theme),
    padding: { left: 1, right: 1 },
    ctx,
  });
}

function themeLabPalette(
  theme: typeof BIJOU_DARK,
  title: string,
  paneWidth: number,
  bodyWidth: number,
  ctx: BijouContext,
  landingTheme: LandingThemeTokens,
  localization: LocalizationPort | undefined,
): Surface {
  return boxSurface(renderThemeTokenPalette(theme, bodyWidth, localization, {
    maxRows: 28,
    chromeTheme: ctx.theme.theme,
  }), {
    title,
    width: Math.max(28, paneWidth),
    borderToken: docsThemeMutedBorderToken(landingTheme),
    bgToken: docsThemeSurfaceToken(landingTheme),
    padding: { left: 1, right: 1 },
    ctx,
  });
}

function themeLabSeparatorSurface(label: string, width: number, ctx: BijouContext, theme: LandingThemeTokens): Surface {
  return separatorSurface({ label, width, ctx, borderToken: docsThemeBorderToken(theme) });
}

function themeLabPaneInnerWidth(width: number): number {
  const inset = width >= 3 ? 1 : 0;
  return Math.max(1, width - (inset * 2));
}

function themeLabInsetPaneSurface(content: Surface, width: number): Surface {
  const safeWidth = Math.max(1, width);
  const inset = safeWidth >= 3 ? 1 : 0;
  const innerWidth = Math.max(1, safeWidth - (inset * 2));
  const result = createSurface(safeWidth, content.height);
  result.blit(content, inset, 0, 0, 0, innerWidth, content.height);
  return result;
}
