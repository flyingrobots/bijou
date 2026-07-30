import type { BijouContext } from '../../packages/bijou/src/index.js';
import {
  createFramedApp,
  type FramedApp,
} from '../../packages/bijou-tui/src/index.js';
import type {
  I18nRuntime,
  LocalizationPort,
} from '../../packages/bijou-i18n/src/index.js';
import { createComponentsPage } from './app-components-page.js';
import { buildDocsFooterHint } from './app-footer.js';
import { createGuidePage } from './app-guide-page.js';
import {
  COMPONENTS_PAGE_ID,
  DOCS_SITE_PAGES,
  GUIDES_PAGE_ID,
} from './app-ids.js';
import { dogfoodText } from './app-localization.js';
import type {
  DocsAppOptions,
  DocsExplorerModel,
  DocsMsg,
} from './app-model.js';
import { createDocsSettingsBuilder } from './app-settings.js';
import { DOCS_SHELL_THEME_STATE } from './app-shell-theme-state.js';
import {
  resolveDocsVisualThemeByShellThemeId,
} from './app-theme-state.js';
import {
  resolveDocsThemeActiveHeaderTabToken,
} from './app-docs-theme-tokens.js';

export function createDocsExplorerApp(
  getContext: () => BijouContext,
  onShellThemeChange: (context: BijouContext) => void,
  i18n: I18nRuntime,
  localization: LocalizationPort,
  options: DocsAppOptions = {},
  initialLocale = 'en',
): FramedApp<DocsExplorerModel, DocsMsg> {
  const context = getContext();
  return createFramedApp<DocsExplorerModel, DocsMsg>({
    ctx: context,
    i18n,
    title: dogfoodText(localization, 'docs.title', 'Bijou Docs'),
    defaultPageId: options.initialPageId ?? GUIDES_PAGE_ID,
    headerStyle: ({ pageModel }) => ({
      activeTabToken: resolveDocsThemeActiveHeaderTabToken(
        resolveDocsVisualThemeByShellThemeId(
          pageModel.activeShellThemeId,
        ),
      ),
    }),
    initialColumns: context.runtime.columns,
    initialRows: context.runtime.rows,
    helpLineSource: ({ model }) =>
      buildDocsFooterHint(model, localization),
    shellThemes: DOCS_SHELL_THEME_STATE.shellThemes,
    pages: DOCS_SITE_PAGES.map((page) =>
      page.id === COMPONENTS_PAGE_ID
        ? createComponentsPage(
            page.id,
            getContext,
            i18n,
            localization,
            options,
            initialLocale,
          )
        : createGuidePage(
            page.id,
            getContext,
            i18n,
            localization,
            options,
            initialLocale,
          ),
    ),
    enableCommandPalette: true,
    onShellThemeChange: ({ ctx: nextContext }) => {
      onShellThemeChange(nextContext);
    },
    settings: createDocsSettingsBuilder(localization),
  });
}
