import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import {
  BIJOU_VERSION,
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

export function guidePosture(
  pageId: DocsPageId,
  localization: LocalizationPort,
): string {
  switch (pageId) {
    case GUIDES_PAGE_ID:
      return dogfoodText(
        localization,
        'guide.info.posture.guides',
        'Reader-first orientation path for DOGFOOD with the repo documentation map.',
      );
    case COMPONENTS_PAGE_ID:
      return dogfoodText(
        localization,
        'guide.info.posture.components',
        'Component story exploration path for DOGFOOD.',
      );
    case BLOCKS_PAGE_ID:
      return dogfoodText(
        localization,
        'guide.info.posture.blocks',
        'Block authoring inventory preview and lowering path published directly inside DOGFOOD.',
      );
    case PACKAGES_PAGE_ID:
      return dogfoodText(
        localization,
        'guide.info.posture.packages',
        'Explainer pages for shipped workspace packages published inside DOGFOOD.',
      );
    case PHILOSOPHY_PAGE_ID:
      return dogfoodText(
        localization,
        'guide.info.posture.philosophy',
        'Key doctrine architecture invariants and design-system guidance published inside DOGFOOD.',
      );
    case THEME_LAB_PAGE_ID:
      return dogfoodText(
        localization,
        'guide.info.posture.themes',
        'Theme palettes, safe-pair diagnostics, and runtime token swatches published inside DOGFOOD.',
      );
    case RELEASE_PAGE_ID:
      return dogfoodText(
        localization,
        'guide.info.posture.release',
        '{version} release story and migration guidance published inside DOGFOOD.',
        { version: BIJOU_VERSION },
      );
    default:
      return dogfoodText(
        localization,
        'guide.info.defaultPosture',
        'This section now has a visible home in DOGFOOD.',
      );
  }
}
