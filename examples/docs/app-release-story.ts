import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import { readMarkdownDoc } from './app-markdown.js';
import { dogfoodLocalizedText } from './localization.js';

export interface ReleaseStoryMarkdownPaths { readonly en: string; readonly de: string; readonly es: string; readonly fr: string; readonly [locale: string]: string; }

export interface ReleaseStoryGuideDoc {
  readonly id: string;
  readonly pageId: 'release';
  readonly title: string;
  readonly summary: string;
  readonly body: string;
  readonly localizedTitle?: (localization: LocalizationPort | undefined) => string;
  readonly localizedSummary?: (localization: LocalizationPort | undefined) => string;
  readonly localizedBody?: (localization: LocalizationPort | undefined) => string;
}

const CHANGELOG_BOUNDARY_MARKER = '{{CHANGELOG_VERSION_BOUNDARIES}}';
const CHANGELOG_VERSION_HEADING = /^## \[([^\]]+)\](?:\s+[-\u2014]\s+(.+))?\s*$/gm;

const RELEASE_STORY_CURRENT_PATHS: ReleaseStoryMarkdownPaths = Object.freeze({
  en: './content/release-story-current.md',
  de: './content/release-story-current.de.md',
  es: './content/release-story-current.es.md',
  fr: './content/release-story-current.fr.md',
});

const RELEASE_GRAPHQL_PROOF_PATHS: ReleaseStoryMarkdownPaths = Object.freeze({
  en: './content/release-graphql-proof.md',
  de: './content/release-graphql-proof.de.md',
  es: './content/release-graphql-proof.es.md',
  fr: './content/release-graphql-proof.fr.md',
});

const RELEASE_CHANGELOG_HISTORY_PATHS: ReleaseStoryMarkdownPaths = Object.freeze({
  en: './content/release-changelog-history.md',
  de: './content/release-changelog-history.de.md',
  es: './content/release-changelog-history.es.md',
  fr: './content/release-changelog-history.fr.md',
});

export const RELEASE_STORY_GUIDES: readonly ReleaseStoryGuideDoc[] = Object.freeze([
  {
    id: 'release-story-current',
    pageId: 'release',
    title: 'release-story-current',
    summary: '',
    body: releaseStoryMarkdownBody(RELEASE_STORY_CURRENT_PATHS),
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
    localizedBody: localizedReleaseStoryMarkdownBody(RELEASE_STORY_CURRENT_PATHS),
  },
  {
    id: 'release-graphql-proof',
    pageId: 'release',
    title: 'release-graphql-proof',
    summary: '',
    body: releaseStoryMarkdownBody(RELEASE_GRAPHQL_PROOF_PATHS),
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
    localizedBody: localizedReleaseStoryMarkdownBody(RELEASE_GRAPHQL_PROOF_PATHS),
  },
  {
    id: 'release-changelog-history',
    pageId: 'release',
    title: 'release-changelog-history',
    summary: '',
    body: releaseStoryMarkdownBody(RELEASE_CHANGELOG_HISTORY_PATHS),
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
    localizedBody: localizedReleaseStoryMarkdownBody(RELEASE_CHANGELOG_HISTORY_PATHS),
  },
]);

export function releaseStoryMarkdownBody(
  paths: ReleaseStoryMarkdownPaths,
  localization?: LocalizationPort,
): string {
  const locale = releaseStoryMarkdownLocale(localization?.locale);
  return injectChangelogVersionBoundaries(readMarkdownDoc(paths[locale ?? 'en']));
}

export function localizedReleaseStoryMarkdownBody(
  paths: ReleaseStoryMarkdownPaths,
): (localization: LocalizationPort | undefined) => string {
  return (localization) => releaseStoryMarkdownBody(paths, localization);
}

function dogfoodText(
  localization: LocalizationPort | undefined,
  id: string,
  fallback: string,
  values: Readonly<Record<string, unknown>> = {},
): string {
  return dogfoodLocalizedText(localization, id, fallback, values);
}

function releaseStoryMarkdownLocale(locale: string | undefined): string | undefined {
  if (locale == null || locale === defaultReleaseStoryMarkdownLocale()) return undefined;
  return Object.hasOwn(RELEASE_STORY_CURRENT_PATHS, locale) ? locale : undefined;
}

function defaultReleaseStoryMarkdownLocale(): string | undefined {
  return Object.keys(RELEASE_STORY_CURRENT_PATHS)[0];
}

function injectChangelogVersionBoundaries(markdown: string): string {
  if (!markdown.includes(CHANGELOG_BOUNDARY_MARKER)) return markdown;
  return markdown.replaceAll(CHANGELOG_BOUNDARY_MARKER, changelogVersionBoundariesMarkdown());
}

function changelogVersionBoundariesMarkdown(): string {
  const boundaries: string[] = [];
  const changelog = readMarkdownDoc('../../docs/CHANGELOG.md');
  for (const match of changelog.matchAll(CHANGELOG_VERSION_HEADING)) {
    const version = match[1];
    if (version == null) continue;
    const suffix = match[2]?.trim();
    boundaries.push(`- [${version}]${suffix == null || suffix.length === 0 ? '' : ` - ${suffix}`}`);
  }
  return boundaries.join('\n');
}
