import {
  type BijouContext,
  type Surface,
  type Theme,
} from '../../packages/bijou/src/index.js';
import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import { column, proseSurface, spacer } from '../_shared/example-surfaces.js';
import type { DocsShellThemeChoice } from './app-docs-shell-theme.js';
import type { LandingThemeTokens } from './app-landing.js';
import { themeLabCopy } from './app-theme-lab-copy.js';
import { renderThemeLabGraphSurface } from './app-theme-lab-editor-graph-view.js';
import { renderThemeLabEditorSurface } from './app-theme-lab-editor-view.js';
import {
  themeLabEditorStateFor,
  type ThemeLabEditorState,
} from './app-theme-lab-editor-model.js';
import {
  themeLabBox,
  themeLabInsetPaneSurface,
  themeLabPaneInnerWidth,
  themeLabSeparatorSurface,
} from './app-theme-lab-layout.js';
import { renderThemeTokenPalette } from './app-theme-token-palette.js';
import { dogfoodLocalizedText } from './localization.js';

interface ThemeLabPaneOptions {
  readonly width: number;
  readonly ctx: BijouContext;
  readonly landingTheme: LandingThemeTokens;
  readonly activeTheme: DocsShellThemeChoice;
  readonly shellThemes: readonly DocsShellThemeChoice[];
  readonly editorState?: ThemeLabEditorState;
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
  const { width, ctx, landingTheme, activeTheme, shellThemes, editorState, localization } = options;
  const paneWidth = themeLabPaneInnerWidth(width);
  const bodyWidth = Math.max(24, paneWidth - 2);
  const editor = themeLabEditorStateFor(activeTheme.id, activeTheme.theme, editorState);
  const draftTheme = editor.draftTheme;
  const renderTokens = {
    accent: draftTheme.semantic.accent,
    body: draftTheme.surface.primary,
    muted: draftTheme.surface.muted,
  };
  const shellGallery = shellThemes
    .map((shellTheme, index) => {
      const marker = shellTheme.id === activeTheme.id ? '* ' : '  ';
      return `${marker}${String(index + 1)}. ${shellTheme.label} -> ${shellTheme.theme.name}`;
    })
    .join('\n');
  const activeShellIndex = shellThemes.findIndex((shellTheme) => shellTheme.id === activeTheme.id);
  const activeShellLine = activeShellIndex >= 0
    ? `* ${String(activeShellIndex + 1)}. ${activeTheme.label} -> ${draftTheme.name}`
    : `* ${activeTheme.label} -> ${draftTheme.name}`;
  const copy = themeLabCopy({
    activeLabel: activeTheme.label,
    draftTheme,
    activeShellLine,
    localization,
  });

  return themeLabInsetPaneSurface(column([
    themeLabSeparatorSurface(
      dogfoodText(localization, 'themeLab.separator', 'docs • Theme Lab'),
      paneWidth,
      ctx,
      landingTheme,
    ),
    spacer(1, 1),
    themeLabBox(
      renderThemeLabEditorSurface(activeTheme.theme, editor, bodyWidth, localization, renderTokens, {
        contextLines: copy.editorContext,
      }),
      dogfoodText(localization, 'themeLab.editorTitle', 'Theme editor'),
      paneWidth,
      ctx,
      landingTheme,
    ),
    spacer(1, 1),
    themeLabBox(
      renderThemeLabGraphSurface(activeTheme.theme, draftTheme, bodyWidth, localization, renderTokens),
      dogfoodText(localization, 'themeLab.graphTitle', 'Live token graph'),
      paneWidth,
      ctx,
      landingTheme,
    ),
    spacer(1, 1),
    themeLabPalette(draftTheme, activeTheme.label, paneWidth, bodyWidth, ctx, landingTheme, localization),
    spacer(1, 1),
    themeLabBox(
      proseSurface(copy.defaultSummary, bodyWidth),
      dogfoodText(localization, 'themeLab.postureTitle', 'theme posture'),
      paneWidth,
      ctx,
      landingTheme,
    ),
    spacer(1, 1),
    themeLabBox(
      proseSurface(shellGallery, bodyWidth),
      dogfoodText(localization, 'themeLab.galleryTitle', 'shell gallery'),
      paneWidth,
      ctx,
      landingTheme,
    ),
  ]), width);
}

function themeLabPalette(
  theme: Theme,
  title: string,
  paneWidth: number,
  bodyWidth: number,
  ctx: BijouContext,
  landingTheme: LandingThemeTokens,
  localization: LocalizationPort | undefined,
): Surface {
  return themeLabBox(renderThemeTokenPalette(theme, bodyWidth, localization, {
    maxRows: 28,
    chromeTheme: ctx.theme.theme,
  }), title, paneWidth, ctx, landingTheme);
}
