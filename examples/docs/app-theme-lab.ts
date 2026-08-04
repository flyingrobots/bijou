import {
  type BijouContext,
  type Surface,
} from '../../packages/bijou/src/index.js';
import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import { column, proseSurface, spacer } from '../_shared/example-surfaces.js';
import type { DocsShellThemeChoice } from './app-docs-shell-theme.js';
import type { LandingThemeTokens } from './app-landing.js';
import { themeLabCopy, themeLabDisplayName } from './app-theme-lab-copy.js';
import { renderThemeLabGraphSurface } from './app-theme-lab-editor-graph-view.js';
import { renderThemeLabEditorSurface } from './app-theme-lab-editor-view.js';
import {
  themeLabEditorSelectedPath,
  themeLabEditorStateFor,
  type ThemeLabEditorState,
} from './app-theme-lab-editor-model.js';
import { themeLabMode } from './app-theme-lab-mode.js';
import { themeLabColumnWidth, themeLabColumns, themeLabRightColumnWidth } from './app-theme-lab-columns.js';
import { renderThemeLabPickerSurface } from './app-theme-lab-picker.js';
import { renderThemeLabPreviewSurface } from './app-theme-lab-preview.js';
import { themeLabPalette } from './app-theme-lab-palette.js';
import { renderThemeLabProvenanceSurface } from './app-theme-lab-provenance-view.js';
import {
  themeLabBox,
  themeLabInsetPaneSurface,
  themeLabPaneInnerWidth,
  themeLabSeparatorSurface,
} from './app-theme-lab-layout.js';
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
  const activeShellIndex = shellThemes.findIndex((shellTheme) => shellTheme.id === activeTheme.id);
  const displayName = themeLabDisplayName(activeTheme.theme, draftTheme, localization);
  const activeShellLine = activeShellIndex >= 0
    ? `* ${String(activeShellIndex + 1)}. ${activeTheme.label} -> ${displayName}`
    : `* ${activeTheme.label} -> ${displayName}`;
  const copy = themeLabCopy({
    activeLabel: activeTheme.label,
    draftTheme,
    baseTheme: activeTheme.theme,
    activeShellLine,
    localization,
  });

  const leftWidth = themeLabColumnWidth(bodyWidth);
  const rightWidth = themeLabRightColumnWidth(bodyWidth);
  const leftBody = Math.max(20, leftWidth - 2);
  const rightBody = Math.max(18, rightWidth - 2);
  const leftBox = (surface: Surface, title: string): Surface =>
    themeLabBox(surface, title, leftWidth, ctx, landingTheme);
  const rightBox = (surface: Surface, title: string): Surface =>
    themeLabBox(surface, title, rightWidth, ctx, landingTheme);

  return themeLabInsetPaneSurface(column([
    themeLabSeparatorSurface(
      dogfoodText(localization, 'themeLab.separator', 'docs • Theme Lab'),
      paneWidth,
      ctx,
      landingTheme,
    ),
    spacer(1, 1),
    themeLabColumns(
      leftBox(
        renderThemeLabPickerSurface(shellThemes, activeTheme.id, leftBody, renderTokens, localization),
        dogfoodText(localization, 'themeLab.pickerTitle', 'Themes'),
      ),
      rightBox(
        renderThemeLabPreviewSurface(draftTheme, ctx, rightBody, localization),
        dogfoodText(localization, 'themeLab.previewTitle', 'Live preview'),
      ),
      bodyWidth,
    ),
    spacer(1, 1),
    themeLabColumns(
      column([
        leftBox(
          renderThemeLabEditorSurface(activeTheme.theme, editor, leftBody, localization, renderTokens, {
            contextLines: copy.editorContext,
          }),
          dogfoodText(localization, 'themeLab.editorTitle', 'Theme editor'),
        ),
        spacer(1, 1),
        leftBox(
          renderThemeLabProvenanceSurface(
            activeTheme.theme,
            themeLabEditorSelectedPath(editor),
            leftBody,
            renderTokens,
            themeLabMode(ctx),
            localization,
          ),
          dogfoodText(localization, 'themeLab.provenanceTitle', 'Why this value'),
        ),
      ]),
      rightBox(
        renderThemeLabGraphSurface(
          activeTheme.theme,
          draftTheme,
          rightBody,
          localization,
          renderTokens,
          themeLabMode(ctx),
        ),
        dogfoodText(localization, 'themeLab.graphTitle', 'Live token graph'),
      ),
      bodyWidth,
    ),
    spacer(1, 1),
    themeLabColumns(
      themeLabPalette(draftTheme, activeTheme.label, leftWidth, leftBody, ctx, landingTheme, localization),
      rightBox(
        proseSurface(copy.defaultSummary, rightBody),
        dogfoodText(localization, 'themeLab.postureTitle', 'theme posture'),
      ),
      bodyWidth,
    ),
  ]), width);
}
