import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import {
  BLOCKS_PAGE_ID,
  THEME_LAB_GUIDE_ID,
  THEME_LAB_PAGE_ID,
  COUNTER_DEMO_BLOCK_GUIDE_ID,
  type DocsPageId,
} from './app-ids.js';
import { dogfoodText } from './app-localization.js';
import type { DocsExplorerModel } from './app-model.js';

export function guideFooterHint(
  pageId: DocsPageId,
  focusedPane: string | undefined,
  model: DocsExplorerModel,
  paneSwitch: string,
  localization: LocalizationPort,
): string | undefined {
  switch (focusedPane) {
    case 'guide-nav':
      if (
        pageId === BLOCKS_PAGE_ID &&
        model.selectedGuideId === COUNTER_DEMO_BLOCK_GUIDE_ID
      ) {
        return dogfoodText(
          localization,
          'docs.footer.counterBlockNav',
          '{paneSwitch} • ↑/↓ browse • Enter open • -/+ counter fixture',
          { paneSwitch },
        );
      }
      return dogfoodText(
        localization,
        'docs.footer.guideNav',
        '{paneSwitch} • ↑/↓ browse • Enter open',
        { paneSwitch },
      );
    case 'guide-content':
      if (
        pageId === THEME_LAB_PAGE_ID &&
        model.selectedGuideId === THEME_LAB_GUIDE_ID
      ) {
        return dogfoodText(
          localization,
          'docs.footer.themeLabEditor',
          '{paneSwitch} • n/p color • 1/2/3 channel • -/+ nudge • 0 reset',
          { paneSwitch },
        );
      }
      if (
        pageId === BLOCKS_PAGE_ID &&
        model.selectedGuideId === COUNTER_DEMO_BLOCK_GUIDE_ID
      ) {
        return dogfoodText(
          localization,
          'docs.footer.counterBlock',
          '{paneSwitch} • -/+ counter fixture • j/k scroll • d/u page • g/G top/bottom',
          { paneSwitch },
        );
      }
      return dogfoodText(
        localization,
        'docs.footer.guide',
        '{paneSwitch} • j/k scroll • d/u page • g/G top/bottom',
        { paneSwitch },
      );
    case 'guide-meta':
      return dogfoodText(
        localization,
        'docs.footer.guideMeta',
        '{paneSwitch} • section overview',
        { paneSwitch },
      );
    case undefined:
    default:
      return undefined;
  }
}
