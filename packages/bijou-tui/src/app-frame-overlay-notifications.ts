import type { BijouContext } from '@flyingrobots/bijou';
import type { CreateFramedAppOptions, FramePage } from './app-frame.js';
import {
  DEFAULT_NOTIFICATION_CENTER_FILTERS,
  type ResolvedFrameNotificationCenter,
  type ResolvedNotificationCenterLayout,
} from './app-frame-overlay-contract.js';
import {
  frameEndAnchor,
  frameMessage,
  frameNotificationCue,
  frameNotificationFilterLabel,
} from './app-frame-i18n.js';
import type { InternalFrameModel } from './app-frame-types.js';
import { countNotificationHistory } from './notification.js';
import { drawer, type Overlay } from './overlay.js';
import { createPagerStateForSurface, pagerSurface } from './pager.js';
import { renderNotificationCenterSurface } from './app-frame-overlay-render-notifications.js';
export function resolveFrameNotificationCenter<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  options: CreateFramedAppOptions<PageModel, Msg>,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
): ResolvedFrameNotificationCenter<Msg> | undefined {
  const activePage = pagesById.get(model.activePageId);
  const pageModel = model.pageModels[model.activePageId];
  const provided = activePage == null || pageModel === undefined
    ? undefined
    : options.notificationCenter?.({
        model,
        activePage,
        pageModel,
        runtimeNotifications: model.runtimeNotifications,
      });
  if (provided != null) {
    const filters =
      provided.filters != null && provided.filters.length > 0
        ? provided.filters
        : DEFAULT_NOTIFICATION_CENTER_FILTERS;
    const activeFilter = filters.includes(provided.activeFilter ?? 'ALL')
      ? (provided.activeFilter ?? 'ALL')
      : (filters[0] ?? 'ALL');
    return {
      title: provided.title ??
        frameMessage(options.i18n, 'notifications.title', 'Notifications'),
      state: provided.state,
      filters,
      activeFilter,
      onFilterChange: provided.onFilterChange,
    };
  }
  return options.runtimeNotifications === false
    ? undefined
    : {
        title: frameMessage(options.i18n, 'notifications.title', 'Notifications'),
        state: model.runtimeNotifications,
        filters: DEFAULT_NOTIFICATION_CENTER_FILTERS,
        activeFilter: model.runtimeNotificationHistoryFilter,
      };
}

export function resolveNotificationCenterLayout<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  options: CreateFramedAppOptions<PageModel, Msg>,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
  ctx?: BijouContext,
): ResolvedNotificationCenterLayout<Msg> | undefined {
  const center = resolveFrameNotificationCenter(model, options, pagesById);
  if (center == null) return undefined;
  const drawerWidth = resolveNotificationCenterDrawerWidth(model.columns);
  const anchor = frameEndAnchor(options.i18n);
  const startCol = anchor === 'left'
    ? 0
    : Math.max(0, model.columns - drawerWidth);
  const contentWidth = Math.max(18, drawerWidth - 4);
  const content = renderNotificationCenterSurface(center, contentWidth, options.i18n, ctx);
  const contentHeight = Math.max(1, model.rows - 2);
  const pagerState = createPagerStateForSurface(content, {
    width: contentWidth,
    height: contentHeight,
  });
  return {
    center,
    anchor,
    startCol,
    drawerWidth,
    contentWidth,
    contentHeight,
    content,
    maxScrollY: pagerState.scroll.maxY,
  };
}

export function renderNotificationCenterDrawer<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  options: CreateFramedAppOptions<PageModel, Msg>,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
  titleOverride?: string,
  ctx?: BijouContext,
): Overlay | undefined {
  const layout = resolveNotificationCenterLayout(model, options, pagesById, ctx);
  if (layout == null) return undefined;
  const pagerState = createPagerStateForSurface(layout.content, {
    width: layout.contentWidth,
    height: layout.contentHeight,
  });
  const body = pagerSurface(
    layout.content,
    {
      ...pagerState,
      scroll: {
        ...pagerState.scroll,
        y: Math.max(0, Math.min(
          model.notificationCenterScrollY,
          layout.maxScrollY,
        )),
      },
    },
    { showScrollbar: layout.maxScrollY > 0, showStatus: false },
  );
  return drawer({
    anchor: layout.anchor,
    title: titleOverride ?? `${layout.center.title} • ${
      frameNotificationFilterLabel(options.i18n, layout.center.activeFilter)
    }`,
    content: body,
    borderToken: ctx?.border('primary'),
    bgToken: ctx?.surface('elevated'),
    ctx,
    width: layout.drawerWidth,
    screenWidth: model.columns,
    screenHeight: model.rows,
  });
}

export function resolveNotificationFooterCue<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  options: CreateFramedAppOptions<PageModel, Msg>,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
): string | undefined {
  const center = resolveFrameNotificationCenter(model, options, pagesById);
  if (center == null) return undefined;
  return frameNotificationCue(options.i18n, center.state.items.length,
    countNotificationHistory(center.state, center.activeFilter));
}

function resolveNotificationCenterDrawerWidth(columns: number): number {
  const bounded = Math.max(28, columns);
  return Math.min(Math.max(32, Math.floor(bounded * 0.34)),
    Math.max(32, bounded - 4), 52);
}
