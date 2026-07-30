import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import {
  BLOCKS_PAGE_ID,
  COMPONENTS_PAGE_ID,
  GUIDES_PAGE_ID,
  PACKAGES_PAGE_ID,
  PHILOSOPHY_PAGE_ID,
  RELEASE_PAGE_ID,
  THEME_LAB_PAGE_ID,
  type DocsPageId,
} from './app-ids.js';
import { dogfoodText } from './app-localization.js';

export function pageTitle(
  pageId: DocsPageId,
  localization?: LocalizationPort,
): string {
  switch (pageId) {
    case GUIDES_PAGE_ID:
      return dogfoodText(localization, 'docs.page.guides', 'Guides');
    case COMPONENTS_PAGE_ID:
      return dogfoodText(
        localization,
        'docs.page.components',
        'Components',
      );
    case BLOCKS_PAGE_ID:
      return dogfoodText(localization, 'docs.page.blocks', 'Blocks');
    case PACKAGES_PAGE_ID:
      return dogfoodText(localization, 'docs.page.packages', 'Packages');
    case PHILOSOPHY_PAGE_ID:
      return dogfoodText(
        localization,
        'docs.page.philosophy',
        'Philosophy',
      );
    case THEME_LAB_PAGE_ID:
      return dogfoodText(localization, 'docs.page.themes', 'Themes');
    case RELEASE_PAGE_ID:
      return dogfoodText(localization, 'docs.page.release', 'Release');
  }
}
