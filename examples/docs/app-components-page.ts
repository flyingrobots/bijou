import type { BijouContext } from '../../packages/bijou/src/index.js';
import type {
  FramePage,
} from '../../packages/bijou-tui/src/index.js';
import type {
  I18nRuntime,
  LocalizationPort,
} from '../../packages/bijou-i18n/src/index.js';
import { createComponentsPageLayout } from './app-components-layout.js';
import { updateComponentsPage } from './app-components-update.js';
import { createInitialComponentsExplorerModel } from './app-explorer-init.js';
import {
  componentsPageKeys,
  familyPaneKeys,
  variantPaneKeys,
} from './app-input-maps.js';
import { dogfoodText } from './app-localization.js';
import type {
  DocsAppOptions,
  DocsExplorerModel,
  DocsMsg,
} from './app-model.js';
import {
  resolveFamilyPaneMouse,
  resolveVariantPaneMouse,
} from './app-mouse-routes.js';
import { pageTitle } from './app-page-title.js';
import { documentationSearchItems } from './app-search.js';
import { renderDocsSearchTitle } from './app-search-title.js';
import {
  resolveDocsVisualThemeByShellThemeId,
} from './app-theme-state.js';

export function createComponentsPage(
  pageId: string,
  getContext: () => BijouContext,
  i18n: I18nRuntime,
  localization: LocalizationPort,
  options: DocsAppOptions,
  initialLocale: string,
): FramePage<DocsExplorerModel, DocsMsg> {
  return {
    id: pageId,
    title: () => pageTitle('components', localization),
    keyMap: componentsPageKeys,
    init: () => [
      createInitialComponentsExplorerModel(
        getContext(),
        initialLocale,
        options.initialSelectedStoryId,
      ),
      [],
    ],
    update: (message, model) =>
      updateComponentsPage(message, model, i18n, options),
    inputAreas: (model) => [
      {
        paneId: 'family-nav',
        keyMap: familyPaneKeys,
        helpSource: familyPaneKeys,
        mouse: ({ msg, rect }) =>
          resolveFamilyPaneMouse(msg, model, rect),
      },
      {
        paneId: 'story-variants',
        keyMap: variantPaneKeys,
        helpSource: variantPaneKeys,
        mouse: ({ msg, rect }) =>
          resolveVariantPaneMouse(msg, model, rect),
      },
    ],
    searchTitle: () =>
      renderDocsSearchTitle(
        dogfoodText(
          localization,
          'docs.search.title',
          'Search documentation',
        ),
      ),
    searchItems: () => documentationSearchItems(localization),
    layout: (model) =>
      createComponentsPageLayout(
        model,
        resolveDocsVisualThemeByShellThemeId(
          model.activeShellThemeId,
        ),
        getContext,
        localization,
      ),
  };
}
