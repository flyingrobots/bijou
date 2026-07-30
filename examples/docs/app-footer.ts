import type { FrameModel } from '../../packages/bijou-tui/src/index.js';
import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import { componentsFooterHint } from './app-components-footer-hint.js';
import { guideFooterHint } from './app-guide-footer-hint.js';
import {
  COMPONENTS_PAGE_ID,
  GUIDES_PAGE_ID,
  isDocsPageId,
} from './app-ids.js';
import { dogfoodText } from './app-localization.js';
import type { DocsExplorerModel } from './app-model.js';
import { findComponentStory } from './stories.js';
import { footerHintBlock } from './dogfood-blocks.js';

export function buildDocsFooterHint(
  model: FrameModel<DocsExplorerModel>,
  localization: LocalizationPort,
): string {
  const pageId = isDocsPageId(model.activePageId)
    ? model.activePageId
    : GUIDES_PAGE_ID;
  const pageModel = model.pageModels[pageId];
  const controls = dogfoodText(
    localization,
    'docs.footer.shell',
    '? Help • / Search • F2 Settings • F10 Theme Inspector • q Quit',
  );
  if (!pageModel?.showHints) return renderDocsFooterHint({ controls });
  const paneSwitch = dogfoodText(
    localization,
    'docs.footer.paneSwitch',
    'Tab next pane',
  );
  const focusedPane = model.focusedPaneByPage[pageId];
  const activeHint =
    pageId === COMPONENTS_PAGE_ID
      ? componentsFooterHint(
          focusedPane,
          pageModel.selectedStoryId == null
            ? undefined
            : findComponentStory(pageModel.selectedStoryId),
          paneSwitch,
          localization,
        )
      : guideFooterHint(
          pageId,
          focusedPane,
          pageModel,
          paneSwitch,
          localization,
        );
  return renderDocsFooterHint({ controls, activeHint });
}

export function renderDocsFooterHint(config: {
  readonly controls: string;
  readonly activeHint?: string;
  readonly status?: string;
}): string {
  return footerHintBlock.render({
    config,
    mode: 'pipe',
  }).output;
}
