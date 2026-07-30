import type {
  FrameCommandItem,
} from '../../packages/bijou-tui/src/index.js';
import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import type { ComponentStory } from '../_stories/protocol.js';
import { COMPONENT_STORIES } from './stories.js';
import { GUIDE_DOCS } from './app-guide-catalog.js';
import {
  guideDocBody,
  guideDocSummary,
  guideDocTitle,
} from './app-guide-access.js';
import { pageTitle } from './app-page-title.js';
import type { DocsMsg } from './app-model.js';
import { COMPONENTS_PAGE_ID } from './app-ids.js';

const storySearchText = (story: ComponentStory): string =>
  [
    story.id,
    story.family,
    story.title,
    story.docs.summary,
    ...story.docs.useWhen,
    ...story.docs.avoidWhen,
    ...story.docs.relatedFamilies,
    story.docs.gracefulLowering.interactive,
    story.docs.gracefulLowering.static,
    story.docs.gracefulLowering.pipe,
    story.docs.gracefulLowering.accessible,
    ...story.variants.flatMap((variant) => [
      variant.id,
      variant.label,
      variant.description ?? '',
    ]),
    story.source?.examplePath ?? '',
    story.source?.snippetLabel ?? '',
    ...(story.tags ?? []),
  ].join(' ');

export function documentationSearchItems(
  localization: LocalizationPort,
): readonly FrameCommandItem<DocsMsg>[] {
  const components = COMPONENT_STORIES.map(
    (story): FrameCommandItem<DocsMsg> => ({
      id: `component:${story.id}`,
      label: story.title,
      description: `${story.family} • ${story.docs.summary}`,
      category: pageTitle(COMPONENTS_PAGE_ID, localization),
      searchText: storySearchText(story),
      action: { type: 'select-story', storyId: story.id },
      targetPageId: COMPONENTS_PAGE_ID,
    }),
  );
  const guides = GUIDE_DOCS.map(
    (doc): FrameCommandItem<DocsMsg> => ({
      id: `doc:${doc.pageId}:${doc.id}`,
      label: guideDocTitle(doc, localization),
      description: guideDocSummary(doc, localization),
      category: pageTitle(doc.pageId, localization),
      searchText: [
        doc.id,
        pageTitle(doc.pageId, localization),
        guideDocTitle(doc, localization),
        guideDocSummary(doc, localization),
        guideDocBody(doc, localization),
      ].join(' '),
      action: { type: 'select-guide', guideId: doc.id },
      targetPageId: doc.pageId,
    }),
  );
  return [...components, ...guides];
}
