import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import { readMarkdownDoc } from './app-markdown.js';
import { dogfoodLocalizedText } from './localization.js';

export interface ReleaseStoryGuideDoc {
  readonly id: string;
  readonly pageId: 'release';
  readonly title: string;
  readonly summary: string;
  readonly body: string;
  readonly localizedTitle?: (localization: LocalizationPort | undefined) => string;
  readonly localizedSummary?: (localization: LocalizationPort | undefined) => string;
}

export const RELEASE_STORY_GUIDES: readonly ReleaseStoryGuideDoc[] = Object.freeze([
  {
    id: 'release-story-current',
    pageId: 'release',
    title: 'release-story-current',
    summary: '',
    body: readMarkdownDoc('./content/release-story-current.md'),
    localizedTitle: (localization) => dogfoodText(
      localization,
      'release.story.current.title',
      'Current Release Story',
    ),
    localizedSummary: (localization) => dogfoodText(
      localization,
      'release.story.current.summary',
      'The v7.2 release path through What\'s New, proof, and changelog history.',
    ),
  },
  {
    id: 'release-graphql-proof',
    pageId: 'release',
    title: 'release-graphql-proof',
    summary: '',
    body: readMarkdownDoc('./content/release-graphql-proof.md'),
    localizedTitle: (localization) => dogfoodText(
      localization,
      'release.graphqlProof.title',
      'GraphQL Proof Walkthrough',
    ),
    localizedSummary: (localization) => dogfoodText(
      localization,
      'release.graphqlProof.summary',
      'The real NavigationListBlock fixture from GraphQL SDL to terminal proof.',
    ),
  },
  {
    id: 'release-changelog-history',
    pageId: 'release',
    title: 'release-changelog-history',
    summary: '',
    body: readMarkdownDoc('./content/release-changelog-history.md'),
    localizedTitle: (localization) => dogfoodText(
      localization,
      'release.changelogHistory.title',
      'CHANGELOG History',
    ),
    localizedSummary: (localization) => dogfoodText(
      localization,
      'release.changelogHistory.summary',
      'Version boundaries from docs/CHANGELOG.md in the DOGFOOD reader.',
    ),
  },
]);

function dogfoodText(
  localization: LocalizationPort | undefined,
  id: string,
  fallback: string,
  values: Readonly<Record<string, unknown>> = {},
): string {
  return dogfoodLocalizedText(localization, id, fallback, values);
}
