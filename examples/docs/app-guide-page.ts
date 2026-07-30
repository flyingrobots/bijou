import type { BijouContext } from '../../packages/bijou/src/index.js';
import type {
  FrameInputArea,
  FramePage,
} from '../../packages/bijou-tui/src/index.js';
import type {
  I18nRuntime,
  LocalizationPort,
} from '../../packages/bijou-i18n/src/index.js';
import { createInitialExplorerModel } from './app-explorer-init.js';
import { createGuidePageLayout } from './app-guide-layout.js';
import { updateGuidePage } from './app-guide-update.js';
import {
  counterBlockGuidePaneKeys,
  counterBlockPreviewPaneKeys,
  guidePaneKeys,
} from './app-input-maps.js';
import {
  BLOCKS_PAGE_ID,
  COUNTER_DEMO_BLOCK_GUIDE_ID,
  type DocsPageId,
} from './app-ids.js';
import { dogfoodText } from './app-localization.js';
import type {
  DocsAppOptions,
  DocsExplorerModel,
  DocsMsg,
} from './app-model.js';
import { resolveGuidePaneMouse } from './app-mouse-routes.js';
import { pageTitle } from './app-page-title.js';
import { documentationSearchItems } from './app-search.js';
import { renderDocsSearchTitle } from './app-search-title.js';
import {
  resolveDocsVisualThemeByShellThemeId,
} from './app-theme-state.js';

export function createGuidePage(
  pageId: DocsPageId,
  getContext: () => BijouContext,
  i18n: I18nRuntime,
  localization: LocalizationPort,
  options: DocsAppOptions,
  initialLocale: string,
): FramePage<DocsExplorerModel, DocsMsg> {
  return {
    id: pageId,
    title: () => pageTitle(pageId, localization),
    init: () => [
      createInitialExplorerModel(getContext(), pageId, initialLocale),
      [],
    ],
    update: (message, model) =>
      updateGuidePage(pageId, message, model, i18n, options),
    inputAreas: (model) =>
      createGuideInputAreas(pageId, model),
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
      createGuidePageLayout(
        pageId,
        model,
        resolveDocsVisualThemeByShellThemeId(
          model.activeShellThemeId,
        ),
        getContext,
        localization,
      ),
  };
}

function createGuideInputAreas(
  pageId: DocsPageId,
  model: DocsExplorerModel,
): readonly FrameInputArea<DocsExplorerModel, DocsMsg>[] {
  const guide: FrameInputArea<DocsExplorerModel, DocsMsg> = {
    paneId: 'guide-nav',
    keyMap: guidePaneKeys,
    helpSource: guidePaneKeys,
    mouse: ({ msg, rect }) =>
      resolveGuidePaneMouse(msg, model, rect),
  };
  if (
    pageId !== BLOCKS_PAGE_ID ||
    model.selectedGuideId !== COUNTER_DEMO_BLOCK_GUIDE_ID
  ) {
    return [guide];
  }
  return [
    {
      ...guide,
      keyMap: counterBlockGuidePaneKeys,
      helpSource: counterBlockGuidePaneKeys,
    },
    {
      paneId: 'guide-content',
      keyMap: counterBlockPreviewPaneKeys,
      helpSource: counterBlockPreviewPaneKeys,
    },
  ];
}
