import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import { DEFAULT_LOCALE } from './locale.js';
import type { GuideDoc } from './app-guide-contract.js';
import type { DocsPageId } from './app-ids.js';
import type { DocsExplorerModel } from './app-model.js';
import { guideDocsForPage } from './app-guide-catalog.js';
import { dogfoodText } from './app-localization.js';

export function guideDocTitle(
  doc: GuideDoc,
  localization?: LocalizationPort,
): string {
  return doc.localizedTitle?.(localization) ?? doc.title;
}

export function guideDocSummary(
  doc: GuideDoc,
  localization?: LocalizationPort,
): string {
  return doc.localizedSummary?.(localization) ?? doc.summary;
}

export function guideDocBody(
  doc: GuideDoc,
  localization?: LocalizationPort,
): string {
  const body = doc.localizedBody?.(localization) ?? doc.body;
  if (
    localization !== undefined &&
    localization.locale !== DEFAULT_LOCALE.id &&
    doc.localizedBody === undefined &&
    doc.body.trim().length > 0
  ) {
    return `${englishSourceDocumentationNotice(localization)}\n\n---\n\n${body}`;
  }
  return body;
}

export function guideItemsForPage(
  pageId: DocsPageId,
  localization?: LocalizationPort,
): readonly { label: string; value: string; description?: string }[] {
  return guideDocsForPage(pageId).map((doc) => ({
    label: guideDocTitle(doc, localization),
    value: doc.id,
    description: guideDocSummary(doc, localization),
  }));
}

export function localizedGuideStateForPage(
  pageId: DocsPageId,
  model: DocsExplorerModel,
  localization: LocalizationPort,
): DocsExplorerModel['guideState'] {
  return {
    ...model.guideState,
    items: guideItemsForPage(pageId, localization),
  };
}

const englishSourceDocumentationNotice = (
  localization: LocalizationPort,
): string =>
  dogfoodText(
    localization,
    'docs.englishSourceNotice',
    'English-source documentation. This article has not been translated yet.',
  );
