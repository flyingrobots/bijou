import { readMarkdownDoc, readMarkdownDocExcerpt } from './app-markdown.js';
import {
  standardBlockInventoryMarkdown,
  standardBlockLoweringMarkdown,
  standardBlockPreviewMarkdown,
} from './app-standard-block-docs.js';
import type { ReleaseStoryMarkdownPaths } from './app-release-story.js';
import { BIJOU_VERSION } from './app-ids.js';

export const GUIDES_START_HERE_TEXT = readMarkdownDoc(
  './content/guides-start-here.md',
);
export const GUIDES_NAVIGATE_DOGFOOD_TEXT = readMarkdownDoc(
  './content/guides-navigate-dogfood.md',
);
export const GUIDES_I18N_WORKFLOW_TEXT = readMarkdownDoc(
  './content/guides-i18n-workflow.md',
);
export const GUIDES_DOCUMENTATION_MAP_TEXT = readMarkdownDoc(
  '../../docs/README.md',
);
export const GUIDES_SECONDARY_EXAMPLES_TEXT = readMarkdownDoc(
  '../../docs/EXAMPLES.md',
);
export const BLOCKS_WHAT_ARE_BLOCKS_TEXT = readMarkdownDoc(
  '../../docs/design-system/blocks.md',
);
export const BLOCKS_MAKE_YOUR_OWN_TEXT = readMarkdownDoc(
  './content/blocks-make-your-own.md',
);
export const BLOCKS_PRE_MADE_TEXT = standardBlockInventoryMarkdown();
export const BLOCKS_PREVIEW_TEXT = standardBlockPreviewMarkdown();
export const BLOCKS_LOWERING_TEXT = standardBlockLoweringMarkdown();
export const PACKAGES_OVERVIEW_TEXT = readMarkdownDoc(
  './content/packages-overview.md',
);
export const PACKAGE_TEXT = Object.freeze({
  bijou: readMarkdownDocExcerpt('../../packages/bijou/README.md', [
    '## Install',
  ]),
  node: readMarkdownDocExcerpt('../../packages/bijou-node/README.md', [
    '## Install',
  ]),
  tui: readMarkdownDocExcerpt('../../packages/bijou-tui/README.md', [
    '## Installation',
  ]),
  app: readMarkdownDocExcerpt('../../packages/bijou-tui-app/README.md', [
    '## Quick Scaffold',
  ]),
  create: readMarkdownDocExcerpt(
    '../../packages/create-bijou-tui-app/README.md',
    ['## Flags'],
  ),
  i18n: readMarkdownDoc('../../packages/bijou-i18n/README.md'),
  tools: readMarkdownDoc('../../packages/bijou-i18n-tools/README.md'),
  toolsNode: readMarkdownDoc(
    '../../packages/bijou-i18n-tools-node/README.md',
  ),
  toolsXlsx: readMarkdownDoc(
    '../../packages/bijou-i18n-tools-xlsx/README.md',
  ),
});
export const PHILOSOPHY_TEXT = Object.freeze({
  overview: readMarkdownDoc('./content/philosophy-overview.md'),
  systemStyle: readMarkdownDoc('../../docs/system-style-javascript.md'),
  architecture: readMarkdownDoc('../../docs/ARCHITECTURE.md'),
  uxDoctrine: readMarkdownDoc('../../docs/strategy/bijou-ux-doctrine.md'),
  invariants: readMarkdownDoc('../../docs/invariants/README.md'),
  designSystem: readMarkdownDoc('../../docs/design-system/README.md'),
});
export const RELEASE_OVERVIEW_TEXT = readMarkdownDoc(
  './content/release-overview.md',
);
export const RELEASE_OVERVIEW_MARKDOWN_PATHS: ReleaseStoryMarkdownPaths =
  Object.freeze({
    en: './content/release-overview.md',
    de: './content/release-overview.de.md',
    es: './content/release-overview.es.md',
    fr: './content/release-overview.fr.md',
  });
export const RELEASE_WHATS_NEW_TEXT = readMarkdownDoc(
  `../../docs/releases/${BIJOU_VERSION}/whats-new.md`,
);
export const RELEASE_MIGRATION_GUIDE_TEXT = readMarkdownDoc(
  `../../docs/releases/${BIJOU_VERSION}/migration-guide.md`,
);
