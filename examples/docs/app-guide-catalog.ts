import type { GuideDoc } from './app-guide-contract.js';
import type { DocsPageId } from './app-ids.js';
import { PRIMARY_GUIDES } from './app-guides-primary.js';
import { BLOCK_GUIDES } from './app-guides-blocks.js';
import { PACKAGE_GUIDES } from './app-guides-packages.js';
import { PHILOSOPHY_GUIDES } from './app-guides-philosophy.js';
import { RELEASE_AND_THEME_GUIDES } from './app-guides-release.js';
import { LATEST_FEATURES_GUIDE, MCP_PACKAGE_GUIDE } from './app-guides-current.js';

export const GUIDE_DOCS: readonly GuideDoc[] = Object.freeze([
  ...PRIMARY_GUIDES.slice(0, 1),
  LATEST_FEATURES_GUIDE,
  ...PRIMARY_GUIDES.slice(1),
  ...BLOCK_GUIDES,
  ...PACKAGE_GUIDES,
  MCP_PACKAGE_GUIDE,
  ...PHILOSOPHY_GUIDES,
  ...RELEASE_AND_THEME_GUIDES,
]);

export function guideDocsForPage(
  pageId: DocsPageId,
): readonly GuideDoc[] {
  return GUIDE_DOCS.filter((doc) => doc.pageId === pageId);
}
