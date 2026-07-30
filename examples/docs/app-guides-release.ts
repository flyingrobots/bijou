import type { GuideDoc } from './app-guide-contract.js';
import {
  BIJOU_VERSION,
  RELEASE_PAGE_ID,
  THEME_LAB_GUIDE_ID,
  THEME_LAB_PAGE_ID,
} from './app-ids.js';
import {
  RELEASE_MIGRATION_GUIDE_TEXT,
  RELEASE_OVERVIEW_MARKDOWN_PATHS,
  RELEASE_OVERVIEW_TEXT,
  RELEASE_WHATS_NEW_TEXT,
} from './app-content.js';
import {
  DOGFOOD_RELEASE_TITLE_GALLERY,
  dogfoodReleaseTitleMarkdown,
  type DogfoodReleaseTitle,
} from './release-title.js';
import {
  localizedReleaseStoryMarkdownBody,
  RELEASE_STORY_GUIDES,
} from './app-release-story.js';
import { dogfoodText } from './app-localization.js';

const releaseTitleGuide = (release: DogfoodReleaseTitle): GuideDoc => ({
  id: `release-title-${release.id}`,
  pageId: RELEASE_PAGE_ID,
  title: release.title,
  summary: release.summary,
  body: dogfoodReleaseTitleMarkdown(undefined, release),
  localizedTitle: (localization) =>
    dogfoodText(localization, release.titleKey, release.title),
  localizedSummary: (localization) =>
    dogfoodText(localization, release.summaryKey, release.summary),
  localizedBody: (localization) =>
    dogfoodReleaseTitleMarkdown(localization, release),
});

const THEME_LAB_GUIDE: GuideDoc = {
  id: THEME_LAB_GUIDE_ID,
  pageId: THEME_LAB_PAGE_ID,
  title: THEME_LAB_GUIDE_ID,
  summary: '',
  body: '',
  localizedTitle: (localization) =>
    dogfoodText(localization, 'themeLab.title', 'Theme Lab'),
  localizedSummary: (localization) =>
    dogfoodText(
      localization,
      'themeLab.summary',
      'Edit DOGFOOD theme colors with a live token graph, shell palettes, and token swatches.',
    ),
  localizedBody: (localization) =>
    [
      `# ${dogfoodText(localization, 'themeLab.title', 'Theme Lab')}`,
      '',
      dogfoodText(
        localization,
        'themeLab.body.summary',
        'DOGFOOD exposes Bijou theme facts as an editable product surface: draft colors, live token graph, first-party presets, shell theme gallery, token swatches, and contrast diagnostics.',
      ),
      '',
      dogfoodText(
        localization,
        'themeLab.body.inspectorHint',
        'Press F10 from the docs shell for the quick Theme Inspector drawer.',
      ),
    ].join('\n'),
};

export const RELEASE_AND_THEME_GUIDES: readonly GuideDoc[] = [
  THEME_LAB_GUIDE,
  ...DOGFOOD_RELEASE_TITLE_GALLERY.map(releaseTitleGuide),
  {
    id: 'release-overview',
    pageId: RELEASE_PAGE_ID,
    title: 'Release Overview',
    summary:
      `How the current release line is shaped and where to read the detailed ${BIJOU_VERSION} release docs.`,
    body: RELEASE_OVERVIEW_TEXT,
    localizedBody: localizedReleaseStoryMarkdownBody(
      RELEASE_OVERVIEW_MARKDOWN_PATHS,
    ),
  },
  {
    id: `release-whats-new-${BIJOU_VERSION.replaceAll('.', '-')}`,
    pageId: RELEASE_PAGE_ID,
    title: `What's New in v${BIJOU_VERSION}`,
    summary: `The long-form release story for the ${BIJOU_VERSION} line.`,
    body: RELEASE_WHATS_NEW_TEXT,
  },
  ...RELEASE_STORY_GUIDES,
  {
    id: `release-migration-${BIJOU_VERSION.replaceAll('.', '-')}`,
    pageId: RELEASE_PAGE_ID,
    title: `Migration Guide v${BIJOU_VERSION}`,
    summary: `Migration guidance for the ${BIJOU_VERSION} upgrade.`,
    body: RELEASE_MIGRATION_GUIDE_TEXT,
  },
];
