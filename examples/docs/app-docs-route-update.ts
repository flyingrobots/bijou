import {
  isKeyMsg,
  isShellQuitRequest,
  type FramedAppMsg,
  type KeyMsg,
  type MouseMsg,
  type ResizeMsg,
} from '../../packages/bijou-tui/src/index.js';
import {
  THEME_LAB_GUIDE_ID,
  THEME_LAB_PAGE_ID,
} from './app-ids.js';
import type {
  DocsMsg,
  PulseLikeMsg,
  RootModel,
} from './app-model.js';
import {
  isContextDrawerFocused,
  routeContextDrawerKey,
} from './app-context-drawer-focus.js';
import { syncDocsExplorerViewportLayout } from './app-viewport-sync.js';
import { updateThemeLabEditorFromKey } from './app-theme-lab-key-handling.js';
import {
  clampThemeInspectorScroll,
  resolveThemeInspectorScrollY,
  shouldCloseThemeInspector,
  shouldToggleThemeInspector,
  themeInspectorScrollTarget,
  themeInspectorViewportHeight,
} from './app-theme-inspector-state.js';
import { resolveDocsShellThemeById } from './app-theme-state.js';
import type {
  RootUpdateResult,
  UpdateExplorer,
} from './app-landing-route-update.js';

export type RootInputMsg =
  | FramedAppMsg<DocsMsg>
  | KeyMsg
  | MouseMsg
  | ResizeMsg
  | PulseLikeMsg;

export function updateDocsRoute(
  message: RootInputMsg,
  model: RootModel,
  updateExplorer: UpdateExplorer,
): RootUpdateResult {
  if (isKeyMsg(message)) {
    const inspectorUpdate = updateThemeInspector(
      message,
      model,
      updateExplorer,
    );
    if (inspectorUpdate !== undefined) return inspectorUpdate;
    const drawer = routeContextDrawerKey(model.docsModel, message);
    const withDrawer = (next: RootModel['docsModel']): RootUpdateResult =>
      [{ ...model, docsModel: syncDocsExplorerViewportLayout(next) }, []];
    if (drawer !== undefined && isContextDrawerFocused(model.docsModel)) {
      return withDrawer(drawer);
    }
    const docsModel = updateThemeLabEditorFromKey(
      model.docsModel,
      message,
      {
        pageId: THEME_LAB_PAGE_ID,
        guideId: THEME_LAB_GUIDE_ID,
        resolveShellThemeById: resolveDocsShellThemeById,
      },
    );
    if (docsModel !== undefined) {
      return [{ ...model, docsModel }, []];
    }
    if (drawer !== undefined) return withDrawer(drawer);
  }
  return updateExplorer(message, model);
}

function updateThemeInspector(
  message: KeyMsg,
  model: RootModel,
  updateExplorer: UpdateExplorer,
): RootUpdateResult | undefined {
  if (!model.themeInspectorOpen) {
    return shouldToggleThemeInspector(message)
      ? [
          {
            ...model,
            themeInspectorOpen: true,
            themeInspectorScrollY: 0,
          },
          [],
        ]
      : undefined;
  }
  if (
    shouldToggleThemeInspector(message) ||
    shouldCloseThemeInspector(message)
  ) {
    return [
      {
        ...model,
        themeInspectorOpen: false,
        themeInspectorScrollY: 0,
      },
      [],
    ];
  }
  const target = themeInspectorScrollTarget(
    message,
    themeInspectorViewportHeight(model.rows),
  );
  if (target !== undefined) {
    const theme = resolveDocsShellThemeById(
      model.docsModel.activeShellThemeId,
    ).theme;
    const scrollY = resolveThemeInspectorScrollY(
      model.themeInspectorScrollY,
      target,
      model.rows,
      theme,
    );
    return [
      {
        ...model,
        themeInspectorScrollY: clampThemeInspectorScroll(
          model.rows,
          theme,
          scrollY,
        ),
      },
      [],
    ];
  }
  return isShellQuitRequest(message)
    ? updateExplorer(
        message,
        {
          ...model,
          themeInspectorOpen: false,
          themeInspectorScrollY: 0,
        },
      )
    : [model, []];
}
