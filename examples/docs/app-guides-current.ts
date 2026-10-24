import type { GuideDoc } from './app-guide-contract.js';
import { localizedReleaseStoryMarkdownBody } from './app-release-story.js';
import { renderReleaseStoryMarkdown } from './app-release-story-render.js';
import { readMarkdownDoc } from './app-markdown.js';
import { BIJOU_VERSION } from './app-ids.js';
import { dogfoodText } from './app-localization.js';

const FEATURES_PATHS = {
  en: './content/guides-latest-features.md', de: './content/guides-latest-features.de.md',
  es: './content/guides-latest-features.es.md', fr: './content/guides-latest-features.fr.md',
};
const MCP_PATHS = {
  en: './content/package-mcp.md', de: './content/package-mcp.de.md',
  es: './content/package-mcp.es.md', fr: './content/package-mcp.fr.md',
};

export const LATEST_FEATURES_GUIDE: GuideDoc = {
  id: 'latest-features', pageId: 'guides', title: 'latest-features', summary: '',
  body: renderReleaseStoryMarkdown(readMarkdownDoc('./content/guides-latest-features.md'), BIJOU_VERSION),
  localizedTitle: (localization) => dogfoodText(localization, 'docs.guides.latestFeatures.title', 'Latest Features'),
  localizedSummary: (localization) => dogfoodText(localization, 'docs.guides.latestFeatures.summary', 'Fonts, Markdown typography, theme animation, book themes, and current documentation boundaries.'),
  localizedBody: localizedReleaseStoryMarkdownBody(FEATURES_PATHS),
};

export const MCP_PACKAGE_GUIDE: GuideDoc = {
  id: 'package-bijou-mcp', pageId: 'packages', title: '@flyingrobots/bijou-mcp', summary: '',
  body: readMarkdownDoc('./content/package-mcp.md'),
  localizedSummary: (localization) => dogfoodText(localization, 'docs.packages.mcp.summary', 'MCP rendering tools, semantic output modes, configuration, and current limits.'),
  localizedBody: localizedReleaseStoryMarkdownBody(MCP_PATHS),
};
