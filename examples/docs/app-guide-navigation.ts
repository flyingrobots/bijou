import type { GuideDoc } from './app-guide-contract.js';
import {
  BLOCK_PREVIEW_GUIDE_ID,
  BLOCKS_PAGE_ID,
  COUNTER_DEMO_BLOCK_GUIDE_ID,
  type DocsPageId,
} from './app-ids.js';
import type { DocsExplorerModel } from './app-model.js';
import { guideDocsForPage } from './app-guide-catalog.js';
import { standardBlockForPreviewGuide } from './app-guides-blocks.js';
import { adjustScroll } from './app-list-state.js';

export function focusGuideRow(
  model: DocsExplorerModel,
  index: number,
): DocsExplorerModel {
  const itemCount = model.guideState.items.length;
  if (itemCount === 0) return model;
  const focusIndex = Math.max(0, Math.min(index, itemCount - 1));
  return {
    ...model,
    guideState: {
      ...model.guideState,
      focusIndex,
      scrollY: adjustScroll(
        focusIndex,
        model.guideState.scrollY,
        model.guideState.height,
        itemCount,
      ),
    },
  };
}

export function focusedGuideDoc(
  pageId: DocsPageId,
  model: DocsExplorerModel,
): GuideDoc | undefined {
  const guideId = model.guideState.items[model.guideState.focusIndex]?.value;
  return guideId == null
    ? undefined
    : guideDocsForPage(pageId).find((doc) => doc.id === guideId);
}

export function selectedGuide(
  pageId: DocsPageId,
  model: DocsExplorerModel,
): GuideDoc | undefined {
  const docs = guideDocsForPage(pageId);
  return docs.find((doc) => doc.id === model.selectedGuideId) ?? docs[0];
}

export function selectGuide(
  pageId: DocsPageId,
  model: DocsExplorerModel,
  guideId?: string,
): DocsExplorerModel {
  if (guideId == null) return model;
  const selectableGuideId =
    pageId === BLOCKS_PAGE_ID && guideId === BLOCK_PREVIEW_GUIDE_ID
      ? COUNTER_DEMO_BLOCK_GUIDE_ID
      : guideId;
  const docs = guideDocsForPage(pageId);
  const index = docs.findIndex((doc) => doc.id === selectableGuideId);
  if (index < 0) return model;
  return {
    ...model,
    selectedGuideId: selectableGuideId,
    guideState: {
      ...model.guideState,
      focusIndex: index,
      scrollY: adjustScroll(
        index,
        model.guideState.scrollY,
        model.guideState.height,
        model.guideState.items.length,
      ),
    },
  };
}

export const activateGuideRow = (
  model: DocsExplorerModel,
  pageId: DocsPageId,
): DocsExplorerModel =>
  selectGuide(
    pageId,
    model,
    model.guideState.items[model.guideState.focusIndex]?.value,
  );

export const activateGuideRowIndex = (
  model: DocsExplorerModel,
  pageId: DocsPageId,
  index: number,
): DocsExplorerModel => activateGuideRow(focusGuideRow(model, index), pageId);

export function selectFocusedBlockPreviewGuide(
  pageId: DocsPageId,
  model: DocsExplorerModel,
): DocsExplorerModel {
  if (pageId !== BLOCKS_PAGE_ID) return model;
  const doc = focusedGuideDoc(pageId, model);
  if (
    doc == null ||
    doc.id === BLOCK_PREVIEW_GUIDE_ID ||
    (doc.id !== COUNTER_DEMO_BLOCK_GUIDE_ID &&
      standardBlockForPreviewGuide(doc) === undefined)
  ) {
    return model;
  }
  return selectGuide(pageId, model, doc.id);
}

export function focusGuideStateAndSelect(
  pageId: DocsPageId,
  model: DocsExplorerModel,
  guideState: DocsExplorerModel['guideState'],
): DocsExplorerModel {
  return selectFocusedBlockPreviewGuide(pageId, {
    ...model,
    guideState,
    previewTimeMs: 0,
  });
}
