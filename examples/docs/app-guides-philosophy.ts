import type { GuideDoc } from './app-guide-contract.js';
import { PHILOSOPHY_PAGE_ID } from './app-ids.js';
import { PHILOSOPHY_TEXT } from './app-content.js';

export const PHILOSOPHY_GUIDES: readonly GuideDoc[] = [
  {
    id: 'philosophy-overview',
    pageId: PHILOSOPHY_PAGE_ID,
    title: 'Philosophy and Architecture',
    summary:
      'How the doctrine, architecture, and design stance pages fit together in DOGFOOD.',
    body: PHILOSOPHY_TEXT.overview,
  },
  {
    id: 'philosophy-system-style-javascript',
    pageId: PHILOSOPHY_PAGE_ID,
    title: 'System-Style JavaScript',
    summary:
      'Runtime truth, boundaries, adapters, codecs, and the repo-wide infrastructure doctrine.',
    body: PHILOSOPHY_TEXT.systemStyle,
  },
  {
    id: 'philosophy-architecture',
    pageId: PHILOSOPHY_PAGE_ID,
    title: 'Architecture',
    summary:
      'The structural reference for the nine-package workspace and its core/runtime/i18n lanes.',
    body: PHILOSOPHY_TEXT.architecture,
  },
  {
    id: 'philosophy-ux-doctrine',
    pageId: PHILOSOPHY_PAGE_ID,
    title: 'Bijou UX Doctrine',
    summary:
      'The product doctrine for calm, explicit, humane terminal UX.',
    body: PHILOSOPHY_TEXT.uxDoctrine,
  },
  {
    id: 'philosophy-invariants',
    pageId: PHILOSOPHY_PAGE_ID,
    title: 'Invariants',
    summary:
      'The non-negotiable project truths and the legends that protect them.',
    body: PHILOSOPHY_TEXT.invariants,
  },
  {
    id: 'philosophy-design-system',
    pageId: PHILOSOPHY_PAGE_ID,
    title: 'Design System Overview',
    summary:
      'The foundations, patterns, blocks, and component-family doctrine behind Bijou UI.',
    body: PHILOSOPHY_TEXT.designSystem,
  },
];
