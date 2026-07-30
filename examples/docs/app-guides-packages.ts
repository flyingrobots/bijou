import type { GuideDoc } from './app-guide-contract.js';
import { PACKAGES_PAGE_ID } from './app-ids.js';
import { PACKAGES_OVERVIEW_TEXT, PACKAGE_TEXT } from './app-content.js';

export const PACKAGE_GUIDES: readonly GuideDoc[] = [
  {
    id: 'packages-overview',
    pageId: PACKAGES_PAGE_ID,
    title: 'Packages Overview',
    summary: 'How the public workspace packages fit together in the Bijou stack.',
    body: PACKAGES_OVERVIEW_TEXT,
  },
  {
    id: 'package-bijou',
    pageId: PACKAGES_PAGE_ID,
    title: '@flyingrobots/bijou',
    summary:
      'The pure core toolkit: prompts, components, themes, ports, and surface primitives.',
    body: PACKAGE_TEXT.bijou,
  },
  {
    id: 'package-bijou-node',
    pageId: PACKAGES_PAGE_ID,
    title: '@flyingrobots/bijou-node',
    summary:
      'Node runtime, IO, style, worker, and recorder adapters for Bijou apps.',
    body: PACKAGE_TEXT.node,
  },
  {
    id: 'package-bijou-tui',
    pageId: PACKAGES_PAGE_ID,
    title: '@flyingrobots/bijou-tui',
    summary:
      'The fullscreen runtime: TEA loop, layout, motion, overlays, and shell infrastructure.',
    body: PACKAGE_TEXT.tui,
  },
  {
    id: 'package-bijou-tui-app',
    pageId: PACKAGES_PAGE_ID,
    title: '@flyingrobots/bijou-tui-app',
    summary:
      'The opinionated framed-shell starter for tabbed fullscreen Bijou apps.',
    body: PACKAGE_TEXT.app,
  },
  {
    id: 'package-create-bijou-tui-app',
    pageId: PACKAGES_PAGE_ID,
    title: 'create-bijou-tui-app',
    summary:
      'The scaffolder for bootstrapping a runnable Bijou TUI app project.',
    body: PACKAGE_TEXT.create,
  },
  {
    id: 'package-bijou-i18n',
    pageId: PACKAGES_PAGE_ID,
    title: '@flyingrobots/bijou-i18n',
    summary:
      'The in-memory localization runtime for catalogs, direction, and runtime-safe lookups.',
    body: PACKAGE_TEXT.i18n,
  },
  {
    id: 'package-bijou-i18n-tools',
    pageId: PACKAGES_PAGE_ID,
    title: 'bijou-i18n-tools',
    summary:
      'Provider-neutral localization tooling for exchange, stale detection, and catalog compilation.',
    body: PACKAGE_TEXT.tools,
  },
  {
    id: 'package-bijou-i18n-tools-node',
    pageId: PACKAGES_PAGE_ID,
    title: 'bijou-i18n-tools-node',
    summary:
      'Node filesystem adapters for localization exchange workflows and bundle files.',
    body: PACKAGE_TEXT.toolsNode,
  },
  {
    id: 'package-bijou-i18n-tools-xlsx',
    pageId: PACKAGES_PAGE_ID,
    title: 'bijou-i18n-tools-xlsx',
    summary:
      'XLSX workbook adapters for spreadsheet-driven localization exchange.',
    body: PACKAGE_TEXT.toolsXlsx,
  },
];
