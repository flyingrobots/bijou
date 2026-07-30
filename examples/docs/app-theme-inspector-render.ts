import {
  boxSurface,
  type BijouContext,
} from '../../packages/bijou/src/index.js';
import {
  viewportSurface,
} from '../../packages/bijou-tui/src/index.js';
import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import { column, spacer } from '../_shared/example-surfaces.js';
import type { RootModel } from './app-model.js';
import {
  resolveDocsShellThemeById,
  resolveDocsVisualThemeByShellThemeId,
} from './app-theme-state.js';
import { themeInspectorChromeTokens } from './app-theme-inspector-chrome.js';
import {
  clampThemeInspectorScroll,
  themeInspectorDrawerWidth,
} from './app-theme-inspector-state.js';
import {
  renderThemeInspectorLine,
  renderThemeInspectorSummary,
  renderThemeInspectorUsageProof,
  themeInspectorCloseHint,
  themeInspectorReferenceHeader,
  themeInspectorTitle,
} from './app-theme-inspector-usage.js';
import { renderThemeTokenPalette } from './app-theme-token-palette.js';
import { dogfoodSafePairSummary } from './app-theme-diagnostics.js';

export function renderThemeInspectorDrawer(
  model: RootModel,
  context: BijouContext,
  localization: LocalizationPort | undefined,
) {
  const activeTheme = resolveDocsShellThemeById(
    model.docsModel.activeShellThemeId,
  );
  const visualTheme = resolveDocsVisualThemeByShellThemeId(
    model.docsModel.activeShellThemeId,
  );
  const chrome = themeInspectorChromeTokens(
    activeTheme.theme,
    visualTheme,
  );
  const drawerWidth = themeInspectorDrawerWidth(model.columns);
  const drawerHeight = Math.max(8, model.rows - 4);
  const bodyWidth = Math.max(1, drawerWidth - 4);
  const viewportHeight = Math.max(1, drawerHeight - 2);
  const body = column([
    renderThemeInspectorSummary(
      activeTheme.label,
      activeTheme.theme.name,
      dogfoodSafePairSummary(activeTheme.theme, localization),
      bodyWidth,
      localization,
      chrome,
    ),
    spacer(1, 1),
    renderThemeInspectorUsageProof(bodyWidth, localization, chrome),
    spacer(1, 1),
    renderThemeInspectorLine(
      themeInspectorReferenceHeader(localization),
      bodyWidth,
      chrome.heading,
    ),
    spacer(1, 1),
    renderThemeTokenPalette(activeTheme.theme, bodyWidth, localization, {
      chromeTheme: activeTheme.theme,
      chromeTokens: {
        group: chrome.heading,
        label: chrome.body,
        value: chrome.muted,
      },
    }),
    spacer(1, 1),
    renderThemeInspectorLine(
      themeInspectorCloseHint(localization),
      bodyWidth,
      chrome.muted,
    ),
  ]);
  const viewport = viewportSurface({
    width: bodyWidth,
    height: viewportHeight,
    content: body,
    scrollY: clampThemeInspectorScroll(
      model.rows,
      activeTheme.theme,
      model.themeInspectorScrollY,
    ),
    showScrollbar: true,
    scrollbarMode: 'overlay',
    scrollbarTrackCell: {
      char: '│',
      fg: chrome.scrollTrack.hex,
      bg: chrome.scrollTrack.bg,
      modifiers: chrome.scrollTrack.modifiers,
    },
    scrollbarThumbCell: {
      char: '█',
      fg: chrome.scrollThumb.hex,
      bg: chrome.scrollThumb.bg,
      modifiers: chrome.scrollThumb.modifiers,
    },
  });
  const surface = boxSurface(viewport, {
    title: themeInspectorTitle(localization),
    width: drawerWidth,
    borderToken: chrome.border,
    bgToken: chrome.surface,
    padding: { left: 1, right: 1 },
    ctx: context,
  });
  return {
    content: '',
    surface,
    row: 1,
    col: Math.max(0, model.columns - drawerWidth - 1),
  };
}
