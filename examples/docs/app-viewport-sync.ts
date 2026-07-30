import type { FrameModel } from '../../packages/bijou-tui/src/index.js';
import {
  COMPONENTS_PAGE_ID,
  isDocsPageId,
  resolveDocsLayoutVariant,
} from './app-ids.js';
import { adjustScroll } from './app-list-state.js';
import type { DocsExplorerModel } from './app-model.js';
import {
  resolveFamilyPaneBodyHeight,
  visiblePaneIdsForLayout,
} from './app-pane-geometry.js';

export function syncDocsExplorerViewportLayout(
  model: FrameModel<DocsExplorerModel>,
): FrameModel<DocsExplorerModel> {
  const height = resolveFamilyPaneBodyHeight(model.rows);
  const layoutVariant = resolveDocsLayoutVariant(
    model.columns,
    model.rows,
  );
  let changed = false;
  const pageModels: Record<string, DocsExplorerModel> = {};
  const focusedPaneByPage: Record<string, string | undefined> = {};
  const scrollByPage: Record<
    string,
    Readonly<Record<string, { readonly x: number; readonly y: number }>>
  > = {};
  for (const [pageId, pageModel] of Object.entries(model.pageModels)) {
    if (!isDocsPageId(pageId)) continue;
    let nextPageModel =
      pageModel.layoutVariant === layoutVariant
        ? pageModel
        : { ...pageModel, layoutVariant };
    if (
      pageId === COMPONENTS_PAGE_ID &&
      pageModel.familyState.height !== height
    ) {
      nextPageModel = {
        ...nextPageModel,
        familyState: resizeListState(pageModel.familyState, height),
      };
    } else if (
      pageId !== COMPONENTS_PAGE_ID &&
      pageModel.guideState.height !== height
    ) {
      nextPageModel = {
        ...nextPageModel,
        guideState: resizeListState(pageModel.guideState, height),
      };
    }
    const paneIds = visiblePaneIdsForLayout(pageId, layoutVariant);
    const previousFocusedPane = model.focusedPaneByPage[pageId];
    const focusedPane =
      previousFocusedPane != null &&
      paneIds.includes(previousFocusedPane)
        ? previousFocusedPane
        : paneIds[0];
    const previousScroll = model.scrollByPage[pageId] ?? {};
    pageModels[pageId] = nextPageModel;
    focusedPaneByPage[pageId] = focusedPane;
    scrollByPage[pageId] = Object.fromEntries(
      paneIds.map((paneId) => [
        paneId,
        previousScroll[paneId] ?? { x: 0, y: 0 },
      ]),
    );
    changed ||= nextPageModel !== pageModel;
    changed ||= focusedPane !== previousFocusedPane;
  }
  return changed
    ? {
        ...model,
        pageModels,
        focusedPaneByPage: {
          ...model.focusedPaneByPage,
          ...focusedPaneByPage,
        },
        scrollByPage: {
          ...model.scrollByPage,
          ...scrollByPage,
        },
      }
    : model;
}

export function resetGuideContentScrollOnGuideSelection(
  previous: FrameModel<DocsExplorerModel>,
  next: FrameModel<DocsExplorerModel>,
): FrameModel<DocsExplorerModel> {
  let scrollByPage = next.scrollByPage;
  let changed = false;
  for (const [pageId, nextPage] of Object.entries(next.pageModels)) {
    if (
      pageId === COMPONENTS_PAGE_ID ||
      previous.pageModels[pageId]?.selectedGuideId ===
        nextPage.selectedGuideId
    ) {
      continue;
    }
    const pageScroll = scrollByPage[pageId] ?? {};
    const contentScroll = pageScroll['guide-content'];
    if (
      (contentScroll?.x ?? 0) === 0 &&
      (contentScroll?.y ?? 0) === 0
    ) {
      continue;
    }
    scrollByPage = {
      ...scrollByPage,
      [pageId]: {
        ...pageScroll,
        'guide-content': { x: 0, y: 0 },
      },
    };
    changed = true;
  }
  return changed ? { ...next, scrollByPage } : next;
}

function resizeListState(
  state: DocsExplorerModel['familyState'],
  height: number,
): DocsExplorerModel['familyState'] {
  return {
    ...state,
    height,
    scrollY: adjustScroll(
      state.focusIndex,
      state.scrollY,
      height,
      state.items.length,
    ),
  };
}
