import type { GuideDoc } from './app-guide-contract.js';
import { GUIDES_PAGE_ID } from './app-ids.js';
import {
  GUIDES_DOCUMENTATION_MAP_TEXT,
  GUIDES_I18N_WORKFLOW_TEXT,
  GUIDES_NAVIGATE_DOGFOOD_TEXT,
  GUIDES_SECONDARY_EXAMPLES_TEXT,
  GUIDES_START_HERE_TEXT,
} from './app-content.js';
import { dogfoodText } from './app-localization.js';

export const PRIMARY_GUIDES: readonly GuideDoc[] = [
  {
    id: 'start-here',
    pageId: GUIDES_PAGE_ID,
    title: 'start-here',
    summary: '',
    body: GUIDES_START_HERE_TEXT,
    localizedTitle: (localization) =>
      dogfoodText(
        localization,
        'docs.guides.startHere.title',
        'Start Here',
      ),
    localizedSummary: (localization) =>
      dogfoodText(
        localization,
        'docs.guides.startHere.summary',
        'What Bijou is, what DOGFOOD is for, and how the docs map is now shaped.',
      ),
  },
  {
    id: 'navigate-dogfood',
    pageId: GUIDES_PAGE_ID,
    title: '',
    summary: '',
    body: GUIDES_NAVIGATE_DOGFOOD_TEXT,
    localizedTitle: (localization) =>
      dogfoodText(
        localization,
        'docs.guides.navigate.title',
        'Navigate DOGFOOD',
      ),
    localizedSummary: (localization) =>
      dogfoodText(
        localization,
        'docs.guides.navigate.summary',
        'How to move between sections, panes, search, settings, and component stories.',
      ),
  },
  {
    id: 'documentation-map',
    pageId: GUIDES_PAGE_ID,
    title: 'documentation-map',
    summary: '',
    body: GUIDES_DOCUMENTATION_MAP_TEXT,
    localizedTitle: (localization) =>
      dogfoodText(
        localization,
        'docs.guides.documentationMap.title',
        'Documentation Map',
      ),
    localizedSummary: (localization) =>
      dogfoodText(
        localization,
        'docs.guides.documentationMap.summary',
        'Repo orientation and the current-truth documentation lanes inside Bijou.',
      ),
  },
  {
    id: 'guides-i18n-workflow',
    pageId: GUIDES_PAGE_ID,
    title: '@flyingrobots/bijou-i18n workflow',
    summary:
      '@flyingrobots/bijou-i18n-tools + @flyingrobots/bijou-i18n-tools-node',
    body: GUIDES_I18N_WORKFLOW_TEXT,
  },
  {
    id: 'secondary-example-map',
    pageId: GUIDES_PAGE_ID,
    title: 'Secondary Example Map',
    summary:
      'Why examples are now secondary/internal and what reference value they still keep.',
    body: GUIDES_SECONDARY_EXAMPLES_TEXT,
  },
];
