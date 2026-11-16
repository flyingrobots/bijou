import type {
  FrameModel,
  KeyMsg,
} from '../../packages/bijou-tui/src/index.js';
import {
  CONTEXT_DRAWER_PANE_ID,
  createContextDrawerState,
  docsShellPaneIds,
  primaryContentPaneId,
  resolveContextDrawerRestorePane,
} from './app-context-drawer.js';
import { isDocsPageId, type DocsPageId } from './app-ids.js';
import type { DocsExplorerModel } from './app-model.js';

type DocsFrameModel = FrameModel<DocsExplorerModel>;

type ContextDrawerKeyId = 'escape' | 'i';

/** `i` ("inspect") toggles the drawer; `Esc` closes it while it has focus. */
const CONTEXT_DRAWER_KEYS = {
  toggle: 'i',
  close: 'escape',
} satisfies Readonly<Record<string, ContextDrawerKeyId>>;

export function isContextDrawerFocused(model: DocsFrameModel): boolean {
  return model.focusedPaneByPage[model.activePageId] === CONTEXT_DRAWER_PANE_ID;
}

/** Frame Overlay layers take keys before the drawer (DL-031 Key routing). */
function frameOverlayOpen(model: DocsFrameModel): boolean {
  return model.helpOpen ||
    model.settingsOpen ||
    model.notificationCenterOpen ||
    model.commandPalette != null ||
    model.quitConfirmOpen;
}

function plainKey(msg: KeyMsg, key: string): boolean {
  return !msg.ctrl && !msg.alt && !msg.shift && msg.key === key;
}

function withPage(
  model: DocsFrameModel,
  pageId: DocsPageId,
  page: DocsExplorerModel,
  focusedPaneId: string,
): DocsFrameModel {
  return {
    ...model,
    pageModels: { ...model.pageModels, [pageId]: page },
    focusedPaneByPage: { ...model.focusedPaneByPage, [pageId]: focusedPaneId },
  };
}

function activePage(model: DocsFrameModel) {
  const pageId = model.activePageId;
  const page = model.pageModels[pageId];
  return page === undefined || !isDocsPageId(pageId) ? undefined : { pageId, page };
}

/** Open the drawer on the active page, capture the restore pane and focus the drawer. */
export function openContextDrawer(model: DocsFrameModel): DocsFrameModel {
  const target = activePage(model);
  if (target === undefined || target.page.contextDrawer.open) return model;
  const focused = model.focusedPaneByPage[target.pageId];
  const restorePaneId = focused == null || focused === CONTEXT_DRAWER_PANE_ID
    ? primaryContentPaneId(target.pageId)
    : focused;
  const contextDrawer = { ...createContextDrawerState(target.pageId), open: true, restorePaneId };
  return withPage(model, target.pageId, { ...target.page, contextDrawer }, CONTEXT_DRAWER_PANE_ID);
}

function closePageDrawer(
  model: DocsFrameModel,
  pageId: DocsPageId,
  page: DocsExplorerModel,
): DocsFrameModel {
  if (!page.contextDrawer.open) return model;
  const visible = docsShellPaneIds(pageId, page.layoutVariant, false);
  const restore = resolveContextDrawerRestorePane(pageId, page.contextDrawer.restorePaneId, visible);
  const contextDrawer = { ...page.contextDrawer, open: false };
  return withPage(model, pageId, { ...page, contextDrawer }, restore);
}

/** Close the drawer on the active page and restore focus to a visible pane. */
export function closeContextDrawer(model: DocsFrameModel): DocsFrameModel {
  const target = activePage(model);
  return target === undefined ? model : closePageDrawer(model, target.pageId, target.page);
}

/** Changing page closes the drawer: no drawer stays open on an inactive page. */
export function closeInactiveContextDrawers(model: DocsFrameModel): DocsFrameModel {
  let next = model;
  for (const [pageId, page] of Object.entries(model.pageModels)) {
    if (pageId === model.activePageId || !isDocsPageId(pageId)) continue;
    next = closePageDrawer(next, pageId, page);
  }
  return next;
}

/**
 * Route one key through the drawer layer. Returns `undefined` when the key
 * belongs to a frame Overlay layer, frame globals or the focused pane.
 */
export function routeContextDrawerKey(
  model: DocsFrameModel,
  msg: KeyMsg,
): DocsFrameModel | undefined {
  if (frameOverlayOpen(model)) return undefined;
  const target = activePage(model);
  if (target === undefined) return undefined;
  const open = target.page.contextDrawer.open;
  if (plainKey(msg, CONTEXT_DRAWER_KEYS.toggle)) {
    return open ? closeContextDrawer(model) : openContextDrawer(model);
  }
  if (plainKey(msg, CONTEXT_DRAWER_KEYS.close) && open && isContextDrawerFocused(model)) {
    return closeContextDrawer(model);
  }
  return undefined;
}
