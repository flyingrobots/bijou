import type { Cmd } from './types.js';
import type { FramePage } from './app-frame-page-contract.js';
import type { CreateFramedAppOptions } from './app-frame-options.js';
import type {
  FramedAppMsg,
  InternalFrameModel,
} from './app-frame-types.js';
import { wrapCmdForPage } from './app-frame-types.js';
import { createNotificationState } from './notification.js';
import { restoreLayoutState } from './layout-preset.js';
import { syncPageFrameState } from './app-frame-actions.js';
import { resolveShellThemeForContext } from './app-frame-overlays.js';
import type { FrameThemeRuntime } from './app-frame-theme-runtime.js';

export interface FrameAppInitDependencies<PageModel, Msg> {
  readonly options: CreateFramedAppOptions<PageModel, Msg>;
  readonly pagesById: Map<string, FramePage<PageModel, Msg>>;
  readonly pageOrder: readonly string[];
  readonly defaultPageId: string;
  readonly themeRuntime: FrameThemeRuntime<PageModel, Msg>;
}

export function initializeFrameApp<PageModel, Msg>(
  dependencies: FrameAppInitDependencies<PageModel, Msg>,
): [InternalFrameModel<PageModel, Msg>, Cmd<FramedAppMsg<Msg>>[]] {
  const { defaultPageId, options, pageOrder, pagesById, themeRuntime } =
    dependencies;
  const pageModels: Record<string, PageModel> = {};
  const commands: Cmd<FramedAppMsg<Msg>>[] = [];
  for (const page of options.pages) {
    const [pageModel, pageCommands] = page.init();
    pageModels[page.id] = pageModel;
    commands.push(
      ...pageCommands.map((command) =>
        wrapCmdForPage(page.id, command),
      ),
    );
  }
  let model: InternalFrameModel<PageModel, Msg> = {
    activePageId: defaultPageId,
    pageOrder,
    pageModels,
    warnedFrameKeyCollisionPages: {},
    focusedPaneByPage: {},
    scrollByPage: {},
    columns: Math.max(1, options.initialColumns ?? 80),
    rows: Math.max(1, options.initialRows ?? 24),
    frameTimeMs: 0,
    viewTimeMs: 0,
    diffTimeMs: 0,
    frameBudgetMs: undefined,
    frameOverBudget: false,
    perfHudOpen: false,
    helpOpen: false,
    footerVisible: true,
    footerTranslateY: 0,
    footerAnimationGeneration: 0,
    helpScrollY: 0,
    commandPaletteKind: undefined,
    settingsOpen: false,
    notificationCenterOpen: false,
    quitConfirmOpen: false,
    settingsFocusIndex: 0,
    settingsScrollY: 0,
    notificationCenterScrollY: 0,
    transitionProgress: 1,
    transitionGeneration: 0,
    transitionFrame: 0,
    minimizedByPage: {},
    maximizedPaneByPage: {},
    dockStateByPage: {},
    splitRatioOverrides: {},
    runtimeNotifications: createNotificationState(),
    runtimeNotificationHistoryFilter: 'ALL',
    runtimeNotificationLoopActive: false,
    activeShellThemeId: undefined,
  };
  themeRuntime.ensure(themeRuntime.resolveContext());
  const initialTheme =
    resolveShellThemeForContext(
      themeRuntime.resolvedThemes,
      themeRuntime.resolveContext(),
    ) ?? themeRuntime.resolvedThemes[0];
  model = { ...model, activeShellThemeId: initialTheme?.id };
  if (initialTheme != null) themeRuntime.publish(initialTheme);
  for (const pageId of pageOrder) {
    model = syncPageFrameState(model, pageId, pagesById);
  }
  if (options.initialLayout != null) {
    const restored = restoreLayoutState(options.initialLayout);
    model = {
      ...model,
      activePageId: pagesById.has(restored.activePageId)
        ? restored.activePageId
        : model.activePageId,
      focusedPaneByPage: {
        ...model.focusedPaneByPage,
        ...restored.focusedPaneByPage,
      },
      minimizedByPage: restored.minimizedByPage,
      maximizedPaneByPage: restored.maximizedPaneByPage,
      dockStateByPage: restored.dockStateByPage,
      splitRatioOverrides: restored.splitRatiosByPage,
    };
  }
  return [model, commands];
}
